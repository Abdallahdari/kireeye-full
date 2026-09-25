import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as billingService from "../services/billing.service";
import { recordAuditLog } from "../services/auditLog.service";
import { AuditAction, BillingStatus } from "../types";

function requireUser(req: Request) {
  if (!req.user) throw new AppError("Authentication required", 401);
  return req.user;
}

/** Rejects a listing upload up front when the business can't publish (402). */
export const requirePublishAllowance = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  await billingService.assertCanPublish(requireUser(req)._id.toString());
  next();
});

export const getMyBilling = asyncHandler(async (req: Request, res: Response) => {
  const summary = await billingService.getBillingSummary(requireUser(req)._id.toString());
  res.status(200).json({ success: true, data: { billing: summary } });
});

export const startPayment = asyncHandler(async (req: Request, res: Response) => {
  const user = requireUser(req);
  const { phone } = req.body as { phone: string };
  const payment = await billingService.startSubscriptionPayment(user, phone, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.status(202).json({
    success: true,
    message: "Approve the payment on your phone to finish.",
    data: { payment },
  });
});

export const getPayment = asyncHandler(async (req: Request, res: Response) => {
  const payment = await billingService.getPaymentForUser(req.params.id, requireUser(req)._id.toString());
  res.status(200).json({ success: true, data: { payment } });
});

export const listBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const { q, status, page, limit } = req.query as { q?: string; status?: BillingStatus; page?: number; limit?: number };
  const result = await billingService.listBillingBusinesses({ q, status, page, limit });

  res.status(200).json({
    success: true,
    data: {
      businesses: result.businesses,
      totals: result.totals,
      pagination: { total: result.total, page: result.page, limit: result.limit, pages: result.pages },
    },
  });
});

export const exportBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const filters = req.query as { q?: string; status?: BillingStatus };
  const workbook = await billingService.exportBillingWorkbook(filters);

  // Contains contact details and payment history — record who downloaded it.
  await recordAuditLog({
    actor: admin._id,
    action: AuditAction.BILLING_EXPORTED,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { filters, rows: (workbook.getWorksheet("Businesses")?.actualRowCount ?? 1) - 1 },
  });

  const filename = `kireeye-billing-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  await workbook.xlsx.write(res);
  res.end();
});

export const recordManualPayment = asyncHandler(async (req: Request, res: Response) => {
  const admin = requireUser(req);
  const { note } = req.body as { note?: string };
  const payment = await billingService.recordManualPayment(admin, req.params.id, note);

  await recordAuditLog({
    actor: admin._id,
    action: AuditAction.MANUAL_PAYMENT_RECORDED,
    targetUser: payment.user,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { paymentId: payment._id.toString(), amount: payment.amount, note },
  });

  res.status(201).json({ success: true, message: "Payment recorded", data: { payment } });
});
