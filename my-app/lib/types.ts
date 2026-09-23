export type Role = "SUPER_ADMIN" | "BUSINESS" | "TENANT";

export type BusinessApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // null for accounts created before cities were collected at registration.
  city: string | null;
  role: Role;
  businessApproval: BusinessApprovalStatus | null;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReportReason = "SCAM_OR_FRAUD" | "HARASSMENT" | "SUSPICIOUS_ACTIVITY" | "FAKE_LISTING" | "OTHER";

export type ReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export interface ReportUserSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface ReportPropertySummary {
  _id: string;
  city: string;
  neighborhood: string;
  images: string[];
}

export interface Report {
  _id: string;
  reporter: ReportUserSummary;
  reportedUser: ReportUserSummary;
  // Set for listing reports; null for user reports, or if the listing was since deleted.
  property?: ReportPropertySummary | null;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyOwnerSummary {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  // Only included in the admin listing.
  email?: string;
  city?: string | null;
  role?: Role;
  isActive?: boolean;
}

export interface Property {
  _id: string;
  owner: PropertyOwnerSummary;
  city: string;
  neighborhood: string;
  description: string;
  phone: string;
  rooms: number;
  bathrooms: number;
  // US dollars: monthly rent and one-off security deposit.
  price: number;
  deposit: number;
  images: string[];
  // Only on the owner's and admin's lists: hidden from the public site because
  // the owner is over the free allowance without a subscription.
  billingHidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

// FREE: within the free allowance. PAID: active subscription.
// UNPAID: allowance used, no subscription — can't publish, extras hidden.
export type BillingStatus = "FREE" | "PAID" | "UNPAID";

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";

export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  method: "WAAFIPAY" | "MANUAL";
  status: PaymentStatus;
  phone: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  transactionId: string | null;
  responseMessage: string | null;
  note: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface BillingSummary {
  status: BillingStatus;
  canPublish: boolean;
  freeListingLimit: number;
  listingsPublished: number;
  freeListingsRemaining: number;
  currentListings: number;
  hiddenListings: number;
  subscriptionPaidUntil: string | null;
  monthlyPriceUsd: number;
  currency: string;
  paymentsEnabled: boolean;
  // Mock/sandbox payments — no real money moves.
  testMode: boolean;
  totalPaid: number;
  pendingPayment: Payment | null;
  payments: Payment[];
}

export interface BusinessBillingRow {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  status: BillingStatus;
  listingsPublished: number;
  currentListings: number;
  hiddenListings: number;
  totalPaid: number;
  paymentsCount: number;
  lastPaymentAt: string | null;
  subscriptionPaidUntil: string | null;
}

export interface BillingTotals {
  paid: number;
  unpaid: number;
  free: number;
  revenueTotal: number;
  revenueThisMonth: number;
  monthlyPriceUsd: number;
}
