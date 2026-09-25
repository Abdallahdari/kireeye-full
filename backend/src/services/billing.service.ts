import ExcelJS from "exceljs";
import { FilterQuery, Types } from "mongoose";
import { User, IUser } from "../models/User";
import { Property } from "../models/Property";
import { Payment, IPayment } from "../models/Payment";
import { AuditLog } from "../models/AuditLog";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import { escapeRegex, nationalDigits } from "../utils/search";
import { normalizeSomaliPhone } from "../utils/somaliPhone";
import { styleHeaderRow, USD_FORMAT, DATE_TIME_FORMAT } from "../utils/excel";
import { recordAuditLog } from "./auditLog.service";
import { chargeMobileWallet, isPaymentServiceEnabled } from "./waafipay.service";
import { AuditAction, BillingStatus, PaymentMethod, PaymentStatus, Role } from "../types";

// Pricing rules:
//  - A business's first `freeListingLimit` listings (lifetime) are free.
//  - After that, publishing needs an active subscription ($/month).
//  - Without one, the business can't publish, and every listing beyond its
//    `freeListingLimit` oldest current listings is hidden from the public
//    site (Property.billingHidden) until it pays.

const FREE_LIMIT = () => env.billing.freeListingLimit;
const PRICE = () => env.billing.monthlyPriceUsd;

// A WaafiPay call times out well before this; anything still pending after it
// was interrupted (e.g. a server restart) and is marked failed by the sweep.
const STALE_PENDING_MS = 10 * 60 * 1000;

type BillingFields = Pick<IUser, "listingsPublishedCount" | "subscriptionPaidUntil">;

export function billingStatusOf(user: BillingFields, now = new Date()): BillingStatus {
  if (user.subscriptionPaidUntil && user.subscriptionPaidUntil > now) return BillingStatus.PAID;
  if ((user.listingsPublishedCount ?? 0) < FREE_LIMIT()) return BillingStatus.FREE;
  return BillingStatus.UNPAID;
}

function addOneMonth(from: Date): Date {
  const d = new Date(from);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  // Jan 31 + 1 month would roll into March; clamp to the month's last day.
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

// ---------------------------------------------------------------------------
// Publishing allowance
// ---------------------------------------------------------------------------

function limitReachedError(): AppError {
  return new AppError(
    `You've used your ${FREE_LIMIT()} free listings. Pay $${PRICE()}/month to publish more.`,
    402
  );
}

/** Fast pre-check before accepting an upload; reserveListingSlot is the real guard. */
export async function assertCanPublish(userId: string): Promise<void> {
  const user = await User.findById(userId).select("listingsPublishedCount subscriptionPaidUntil");
  if (!user || billingStatusOf(user) === BillingStatus.UNPAID) throw limitReachedError();
}

/**
 * Atomically counts a new listing against the allowance. Done as a single
 * conditional update so two simultaneous uploads can't both take the last
 * free slot.
 */
export async function reserveListingSlot(userId: string): Promise<void> {
  const updated = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { listingsPublishedCount: { $lt: FREE_LIMIT() } },
        { subscriptionPaidUntil: { $gt: new Date() } },
      ],
    },
    { $inc: { listingsPublishedCount: 1 } }
  );
  if (!updated) throw limitReachedError();
}

/** Gives a reserved slot back when the listing couldn't be saved after all. */
export async function releaseListingSlot(userId: string): Promise<void> {
  await User.updateOne({ _id: userId, listingsPublishedCount: { $gt: 0 } }, { $inc: { listingsPublishedCount: -1 } });
}

/**
 * Recomputes which of an owner's listings are publicly visible. Call after
 * anything that changes the owner's billing status or listing set.
 */
export async function syncListingVisibility(ownerId: Types.ObjectId | string): Promise<void> {
  const user = await User.findById(ownerId).select("listingsPublishedCount subscriptionPaidUntil");
  if (!user) return;

  const status = billingStatusOf(user);
  if (status !== BillingStatus.UNPAID) {
    await Property.updateMany({ owner: ownerId, billingHidden: true }, { billingHidden: false });
  } else {
    // The oldest listings are the free ones; everything newer waits for payment.
    // (Not .distinct(): MongoDB's distinct ignores sort and limit.)
    const oldest = await Property.find({ owner: ownerId })
      .sort({ createdAt: 1, _id: 1 })
      .limit(FREE_LIMIT())
      .select("_id")
      .lean();
    const freeIds = oldest.map((p) => p._id);
    await Promise.all([
      Property.updateMany({ owner: ownerId, _id: { $in: freeIds }, billingHidden: true }, { billingHidden: false }),
      // $ne rather than false: listings from before billing have no field at all.
      Property.updateMany({ owner: ownerId, _id: { $nin: freeIds }, billingHidden: { $ne: true } }, { billingHidden: true }),
    ]);
  }

  await User.updateOne({ _id: ownerId }, { billingSyncedPaid: status === BillingStatus.PAID });
}

/**
 * Periodic job (see server.ts): hides listings of subscriptions that have
 * just lapsed, and fails payments abandoned mid-flight.
 */
export async function sweepBilling(): Promise<void> {
  const now = new Date();

  const lapsed = await User.find({ billingSyncedPaid: true, subscriptionPaidUntil: { $lte: now } }).distinct("_id");
  for (const id of lapsed) {
    await syncListingVisibility(id);
  }
  if (lapsed.length > 0) logger.info(`[billing] ${lapsed.length} subscription(s) lapsed; listing visibility updated`);

  await Payment.updateMany(
    { status: PaymentStatus.PENDING, createdAt: { $lt: new Date(now.getTime() - STALE_PENDING_MS) } },
    {
      status: PaymentStatus.FAILED,
      responseMessage: "Timed out waiting for payment confirmation. You were not charged.",
      completedAt: now,
    }
  );
}

/**
 * One-off at startup: gives businesses that existed before billing a lifetime
 * count (from their listing history), then applies visibility to anyone over
 * the free allowance.
 */
export async function backfillBilling(): Promise<void> {
  const legacy = await User.find({ role: Role.BUSINESS, listingsPublishedCount: { $exists: false } }).distinct("_id");
  for (const id of legacy) {
    const [created, current] = await Promise.all([
      AuditLog.countDocuments({ actor: id, action: AuditAction.PROPERTY_CREATED }),
      Property.countDocuments({ owner: id }),
    ]);
    await User.updateOne({ _id: id }, { listingsPublishedCount: Math.max(created, current) });
  }
  if (legacy.length > 0) logger.info(`[billing] Backfilled listing counts for ${legacy.length} business(es)`);

  const overLimit = await Property.aggregate<{ _id: Types.ObjectId }>([
    { $group: { _id: "$owner", count: { $sum: 1 } } },
    { $match: { count: { $gt: FREE_LIMIT() } } },
  ]);
  for (const { _id } of overLimit) {
    await syncListingVisibility(_id);
  }
}

// ---------------------------------------------------------------------------
// Business-facing summary
// ---------------------------------------------------------------------------

export async function getBillingSummary(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const [currentListings, hiddenListings, pendingPayment, payments, paid] = await Promise.all([
    Property.countDocuments({ owner: userId }),
    Property.countDocuments({ owner: userId, billingHidden: true }),
    Payment.findOne({ user: userId, status: PaymentStatus.PENDING }),
    Payment.find({ user: userId }).sort({ createdAt: -1 }).limit(20),
    Payment.aggregate<{ total: number }>([
      { $match: { user: user._id, status: PaymentStatus.SUCCEEDED } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const status = billingStatusOf(user);
  return {
    status,
    canPublish: status !== BillingStatus.UNPAID,
    freeListingLimit: FREE_LIMIT(),
    listingsPublished: user.listingsPublishedCount ?? 0,
    freeListingsRemaining: Math.max(0, FREE_LIMIT() - (user.listingsPublishedCount ?? 0)),
    currentListings,
    hiddenListings,
    subscriptionPaidUntil: user.subscriptionPaidUntil,
    monthlyPriceUsd: PRICE(),
    currency: "USD",
    paymentsEnabled: isPaymentServiceEnabled(),
    testMode: env.waafi.mode === "mock" || env.waafi.mode === "sandbox",
    totalPaid: paid[0]?.total ?? 0,
    pendingPayment,
    payments,
  };
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

async function applySuccessfulPayment(
  payment: IPayment,
  details: { transactionId?: string | null; responseCode?: string | null; responseMessage?: string | null }
): Promise<void> {
  const user = await User.findById(payment.user);
  if (!user) throw new AppError("User not found", 404);

  // Paying early extends from the current end date, so no days are lost.
  const now = new Date();
  const start = user.subscriptionPaidUntil && user.subscriptionPaidUntil > now ? user.subscriptionPaidUntil : now;
  const end = addOneMonth(start);

  await User.updateOne({ _id: user._id }, { subscriptionPaidUntil: end });

  payment.status = PaymentStatus.SUCCEEDED;
  payment.periodStart = start;
  payment.periodEnd = end;
  payment.completedAt = now;
  payment.transactionId = details.transactionId ?? null;
  payment.responseCode = details.responseCode ?? null;
  payment.responseMessage = details.responseMessage ?? null;
  await payment.save();

  await syncListingVisibility(user._id);
}

/**
 * Starts a WaafiPay charge and returns immediately with the PENDING payment.
 * The customer approves on their phone; the frontend polls getPaymentForUser.
 */
export async function startSubscriptionPayment(user: IUser, phone: string, meta: { ip?: string; userAgent?: string }) {
  if (!isPaymentServiceEnabled()) {
    throw new AppError("Online payments are not set up yet. Please contact support to pay.", 503);
  }

  let payment: IPayment;
  try {
    payment = await Payment.create({
      user: user._id,
      amount: PRICE(),
      currency: "USD",
      method: PaymentMethod.WAAFIPAY,
      status: PaymentStatus.PENDING,
      phone,
    });
  } catch (err) {
    // Unique partial index: one PENDING payment per user.
    if ((err as { code?: number }).code === 11000) {
      throw new AppError("A payment is already in progress. Approve it on your phone or wait a moment.", 409);
    }
    throw err;
  }

  void processWalletPayment(payment._id, meta).catch((err) =>
    logger.error(`[billing] Payment ${payment._id} processing crashed`, err)
  );

  return payment;
}

async function processWalletPayment(paymentId: Types.ObjectId, meta: { ip?: string; userAgent?: string }) {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== PaymentStatus.PENDING || !payment.phone) return;

  const result = await chargeMobileWallet({
    phone: payment.phone,
    amount: payment.amount,
    currency: "USD",
    referenceId: payment._id.toString(),
    description: `Kireeye monthly subscription`,
  });

  if (result.approved) {
    await applySuccessfulPayment(payment, {
      transactionId: result.transactionId,
      responseCode: result.responseCode,
      responseMessage: result.message,
    });
    await recordAuditLog({
      actor: payment.user,
      action: AuditAction.SUBSCRIPTION_PAID,
      targetUser: payment.user,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { paymentId: payment._id.toString(), amount: payment.amount, transactionId: result.transactionId },
    });
    return;
  }

  payment.status = PaymentStatus.FAILED;
  payment.responseCode = result.responseCode;
  payment.responseMessage = result.message;
  payment.completedAt = new Date();
  await payment.save();
  await recordAuditLog({
    actor: payment.user,
    action: AuditAction.SUBSCRIPTION_PAYMENT_FAILED,
    targetUser: payment.user,
    ip: meta.ip,
    userAgent: meta.userAgent,
    metadata: { paymentId: payment._id.toString(), responseCode: result.responseCode },
  });
}

export async function getPaymentForUser(paymentId: string, userId: string): Promise<IPayment> {
  const payment = await Payment.findOne({ _id: paymentId, user: userId });
  if (!payment) throw new AppError("Payment not found", 404);
  return payment;
}

/** Admin records an off-app payment (cash, bank, direct EVC) — adds one month. */
export async function recordManualPayment(admin: IUser, businessId: string, note: string | undefined) {
  const business = await User.findById(businessId);
  if (!business || business.role !== Role.BUSINESS) {
    throw new AppError("Business account not found", 404);
  }

  const payment = await Payment.create({
    user: business._id,
    amount: PRICE(),
    currency: "USD",
    method: PaymentMethod.MANUAL,
    // Never PENDING, so it can't collide with an in-flight WaafiPay payment.
    status: PaymentStatus.SUCCEEDED,
    recordedBy: admin._id,
    note: note ?? null,
  });
  await applySuccessfulPayment(payment, { responseMessage: "Recorded by admin" });
  return payment;
}

// ---------------------------------------------------------------------------
// Admin: who paid / who didn't
// ---------------------------------------------------------------------------

export interface BillingListOptions {
  q?: string;
  status?: BillingStatus;
}

function buildBusinessFilter(options: BillingListOptions): FilterQuery<IUser> {
  const now = new Date();
  const notPaid = { $or: [{ subscriptionPaidUntil: null }, { subscriptionPaidUntil: { $lte: now } }] };
  const conditions: FilterQuery<IUser>[] = [{ role: Role.BUSINESS }];

  if (options.status === BillingStatus.PAID) {
    conditions.push({ subscriptionPaidUntil: { $gt: now } });
  } else if (options.status === BillingStatus.UNPAID) {
    conditions.push({ listingsPublishedCount: { $gte: FREE_LIMIT() } }, notPaid);
  } else if (options.status === BillingStatus.FREE) {
    conditions.push({ listingsPublishedCount: { $lt: FREE_LIMIT() } }, notPaid);
  }

  if (options.q) {
    for (const token of options.q.split(/\s+/).filter(Boolean).slice(0, 5)) {
      const re = new RegExp(escapeRegex(token), "i");
      const or: FilterQuery<IUser>[] = [{ firstName: re }, { lastName: re }, { email: re }, { city: re }];
      const digits = nationalDigits(token);
      if (digits.length >= 3) or.push({ phone: new RegExp(escapeRegex(digits)) });
      conditions.push({ $or: or });
    }
  }

  return { $and: conditions };
}

export interface BusinessBillingRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string | null;
  isActive: boolean;
  createdAt: Date;
  status: BillingStatus;
  listingsPublished: number;
  currentListings: number;
  hiddenListings: number;
  totalPaid: number;
  paymentsCount: number;
  lastPaymentAt: Date | null;
  subscriptionPaidUntil: Date | null;
}

async function toBillingRows(users: IUser[]): Promise<BusinessBillingRow[]> {
  const ids = users.map((u) => u._id);
  const [payments, listings] = await Promise.all([
    Payment.aggregate<{ _id: Types.ObjectId; total: number; count: number; last: Date }>([
      { $match: { user: { $in: ids }, status: PaymentStatus.SUCCEEDED } },
      { $group: { _id: "$user", total: { $sum: "$amount" }, count: { $sum: 1 }, last: { $max: "$completedAt" } } },
    ]),
    Property.aggregate<{ _id: Types.ObjectId; current: number; hidden: number }>([
      { $match: { owner: { $in: ids } } },
      { $group: { _id: "$owner", current: { $sum: 1 }, hidden: { $sum: { $cond: ["$billingHidden", 1, 0] } } } },
    ]),
  ]);
  const payBy = new Map(payments.map((p) => [p._id.toString(), p]));
  const listBy = new Map(listings.map((l) => [l._id.toString(), l]));

  return users.map((u) => {
    const pay = payBy.get(u._id.toString());
    const lst = listBy.get(u._id.toString());
    return {
      _id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      city: u.city ?? null,
      isActive: u.isActive,
      createdAt: u.createdAt,
      status: billingStatusOf(u),
      listingsPublished: u.listingsPublishedCount ?? 0,
      currentListings: lst?.current ?? 0,
      hiddenListings: lst?.hidden ?? 0,
      totalPaid: pay?.total ?? 0,
      paymentsCount: pay?.count ?? 0,
      lastPaymentAt: pay?.last ?? null,
      subscriptionPaidUntil: u.subscriptionPaidUntil ?? null,
    };
  });
}

export async function listBillingBusinesses(options: BillingListOptions & { page?: number; limit?: number }) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const filter = buildBusinessFilter(options);
  const now = new Date();

  const [users, total, paidCount, unpaidCount, freeCount, revenue] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
    User.countDocuments(buildBusinessFilter({ status: BillingStatus.PAID })),
    User.countDocuments(buildBusinessFilter({ status: BillingStatus.UNPAID })),
    User.countDocuments(buildBusinessFilter({ status: BillingStatus.FREE })),
    Payment.aggregate<{ total: number; month: number }>([
      { $match: { status: PaymentStatus.SUCCEEDED } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          month: {
            $sum: {
              $cond: [{ $gte: ["$completedAt", new Date(now.getFullYear(), now.getMonth(), 1)] }, "$amount", 0],
            },
          },
        },
      },
    ]),
  ]);

  return {
    businesses: await toBillingRows(users),
    totals: {
      paid: paidCount,
      unpaid: unpaidCount,
      free: freeCount,
      revenueTotal: revenue[0]?.total ?? 0,
      revenueThisMonth: revenue[0]?.month ?? 0,
      monthlyPriceUsd: PRICE(),
    },
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

const STATUS_LABELS: Record<BillingStatus, string> = {
  [BillingStatus.FREE]: "Free",
  [BillingStatus.PAID]: "Paid",
  [BillingStatus.UNPAID]: "Unpaid (inactive)",
};
const MAX_EXPORT_ROWS = 10_000;

/** Two sheets: one row per business, and every payment those businesses made. */
export async function exportBillingWorkbook(options: BillingListOptions): Promise<ExcelJS.Workbook> {
  const users = await User.find(buildBusinessFilter(options)).sort({ createdAt: -1 }).limit(MAX_EXPORT_ROWS);
  const rows = await toBillingRows(users);
  const payments = await Payment.find({ user: { $in: users.map((u) => u._id) } })
    .sort({ createdAt: -1 })
    .populate<{ user: IUser | null }>("user", "firstName lastName phone")
    .populate<{ recordedBy: IUser | null }>("recordedBy", "firstName lastName")
    .lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kireeye";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Businesses", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "Network", key: "provider", width: 12 },
    { header: "Email", key: "email", width: 28 },
    { header: "City", key: "city", width: 14 },
    { header: "Billing status", key: "status", width: 18 },
    { header: "Listings published (lifetime)", key: "published", width: 16 },
    { header: "Current listings", key: "current", width: 12 },
    { header: "Hidden (unpaid)", key: "hidden", width: 12 },
    { header: "Total paid (USD)", key: "totalPaid", width: 14, style: { numFmt: USD_FORMAT } },
    { header: "Payments", key: "paymentsCount", width: 10 },
    { header: "Last payment", key: "lastPaymentAt", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
    { header: "Paid until", key: "paidUntil", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
    { header: "Account", key: "account", width: 11 },
    { header: "Joined", key: "createdAt", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
  ];
  for (const r of rows) {
    const row = sheet.addRow({
      name: `${r.firstName} ${r.lastName}`,
      phone: r.phone,
      provider: normalizeSomaliPhone(r.phone)?.provider ?? "",
      email: r.email,
      city: r.city ?? "",
      status: STATUS_LABELS[r.status],
      published: r.listingsPublished,
      current: r.currentListings,
      hidden: r.hiddenListings,
      totalPaid: r.totalPaid,
      paymentsCount: r.paymentsCount,
      lastPaymentAt: r.lastPaymentAt,
      paidUntil: r.subscriptionPaidUntil,
      account: r.isActive ? "Active" : "Suspended",
      createdAt: r.createdAt,
    });
    if (r.status === BillingStatus.UNPAID) {
      row.getCell("status").font = { bold: true, color: { argb: "FFB91C1C" } };
    } else if (r.status === BillingStatus.PAID) {
      row.getCell("status").font = { bold: true, color: { argb: "FF047857" } };
    }
  }
  styleHeaderRow(sheet);

  const paySheet = workbook.addWorksheet("Payments", { views: [{ state: "frozen", ySplit: 1 }] });
  paySheet.columns = [
    { header: "Date", key: "createdAt", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
    { header: "Business", key: "name", width: 24 },
    { header: "Business phone", key: "userPhone", width: 16 },
    { header: "Amount (USD)", key: "amount", width: 13, style: { numFmt: USD_FORMAT } },
    { header: "Method", key: "method", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Paid from", key: "phone", width: 16 },
    { header: "Period start", key: "periodStart", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
    { header: "Period end", key: "periodEnd", width: 18, style: { numFmt: DATE_TIME_FORMAT } },
    { header: "Transaction ID", key: "transactionId", width: 22 },
    { header: "Recorded by", key: "recordedBy", width: 20 },
    { header: "Message / note", key: "message", width: 40 },
  ];
  for (const p of payments) {
    paySheet.addRow({
      createdAt: p.createdAt,
      name: p.user ? `${p.user.firstName} ${p.user.lastName}` : "(deleted account)",
      userPhone: p.user?.phone ?? "",
      amount: p.amount,
      method: p.method === PaymentMethod.MANUAL ? "Manual" : "WaafiPay",
      status: p.status,
      phone: p.phone ?? "",
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      transactionId: p.transactionId ?? "",
      recordedBy: p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : "",
      message: p.note ?? p.responseMessage ?? "",
    });
  }
  styleHeaderRow(paySheet);

  return workbook;
}
