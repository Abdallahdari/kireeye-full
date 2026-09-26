export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  BUSINESS = "BUSINESS",
  TENANT = "TENANT",
}

export interface JwtPayload {
  sub: string;
  role: Role;
  // Must match the user's tokenVersion; bumping it signs every session out.
  tv?: number;
}

export enum AuditAction {
  REGISTER = "REGISTER",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_SUCCESS = "PASSWORD_RESET_SUCCESS",
  EMAIL_VERIFIED = "EMAIL_VERIFIED",
  VERIFICATION_RESENT = "VERIFICATION_RESENT",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  BUSINESS_APPROVED = "BUSINESS_APPROVED",
  BUSINESS_REJECTED = "BUSINESS_REJECTED",
  PROPERTY_CREATED = "PROPERTY_CREATED",
  PROPERTY_DELETED = "PROPERTY_DELETED",
  PROPERTIES_EXPORTED = "PROPERTIES_EXPORTED",
  SUBSCRIPTION_PAID = "SUBSCRIPTION_PAID",
  SUBSCRIPTION_PAYMENT_FAILED = "SUBSCRIPTION_PAYMENT_FAILED",
  MANUAL_PAYMENT_RECORDED = "MANUAL_PAYMENT_RECORDED",
  BILLING_EXPORTED = "BILLING_EXPORTED",
}

// Only meaningful for BUSINESS accounts — null for TENANT/SUPER_ADMIN.
export enum BusinessApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ReportReason {
  SCAM_OR_FRAUD = "SCAM_OR_FRAUD",
  HARASSMENT = "HARASSMENT",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  FAKE_LISTING = "FAKE_LISTING",
  OTHER = "OTHER",
}

// FREE: still within the free listing allowance.
// PAID: has an active subscription (paid until a future date).
// UNPAID: used the free allowance and has no active subscription — can't
// publish, and listings beyond the free ones are hidden from the public site.
export enum BillingStatus {
  FREE = "FREE",
  PAID = "PAID",
  UNPAID = "UNPAID",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export enum PaymentMethod {
  WAAFIPAY = "WAAFIPAY",
  MANUAL = "MANUAL",
}

export enum ReportStatus {
  OPEN = "OPEN",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}
