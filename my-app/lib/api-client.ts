"use client";

import type {
  BillingStatus,
  BillingSummary,
  BillingTotals,
  BusinessApprovalStatus,
  BusinessBillingRow,
  Payment,
  Property,
  Report,
  ReportReason,
  ReportStatus,
  Role,
  User,
} from "./types";

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies (file uploads) must let the browser set the multipart
  // Content-Type itself, boundary included.
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new ApiClientError(body?.message ?? "Something went wrong. Please try again.", res.status);
  }

  return body.data as T;
}

export function login(email: string, password: string) {
  return request<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  password: string;
  role: Extract<Role, "BUSINESS" | "TENANT">;
}

export function register(input: RegisterInput) {
  return request<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return request<void>("/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return request<{ user: User }>("/auth/me", { method: "GET" });
}

export function forgotPassword(email: string) {
  return request<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return request<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function verifyEmail(token: string) {
  return request<void>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return request<void>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListUsersParams {
  role?: Role;
  businessApproval?: BusinessApprovalStatus;
  page?: number;
  limit?: number;
}

export function listUsers(params: ListUsersParams = {}) {
  const query = new URLSearchParams();
  if (params.role) query.set("role", params.role);
  if (params.businessApproval) query.set("businessApproval", params.businessApproval);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();

  return request<{ users: User[]; pagination: Pagination }>(`/users${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export function updateUserStatus(id: string, isActive: boolean) {
  return request<{ user: User }>(`/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function updateUserRole(id: string, role: Role) {
  return request<{ user: User }>(`/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateBusinessApproval(id: string, status: Extract<BusinessApprovalStatus, "APPROVED" | "REJECTED">) {
  return request<{ user: User }>(`/users/${id}/business-approval`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Exactly one of reportedEmail (report a user) or propertyId (report a listing).
export interface CreateReportInput {
  reportedEmail?: string;
  propertyId?: string;
  reason: ReportReason;
  details: string;
}

export function createReport(input: CreateReportInput) {
  return request<{ report: Report }>("/reports", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface ListReportsParams {
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

export function listReports(params: ListReportsParams = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();

  return request<{ reports: Report[]; pagination: Pagination }>(`/reports${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

export function updateReportStatus(id: string, status: ReportStatus) {
  return request<{ report: Report }>(`/reports/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface CreatePropertyInput {
  city: string;
  neighborhood: string;
  description: string;
  phone: string;
  rooms: number;
  bathrooms: number;
  price: number;
  deposit: number;
  images: File[];
}

export function createProperty(input: CreatePropertyInput) {
  const form = new FormData();
  form.set("city", input.city);
  form.set("neighborhood", input.neighborhood);
  form.set("description", input.description);
  form.set("phone", input.phone);
  form.set("rooms", String(input.rooms));
  form.set("bathrooms", String(input.bathrooms));
  form.set("price", String(input.price));
  form.set("deposit", String(input.deposit));
  input.images.forEach((image) => form.append("images", image));

  return request<{ property: Property }>("/properties", { method: "POST", body: form });
}

export interface ListPropertiesParams {
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  // Admin-only filters (listAllProperties / exportProperties).
  q?: string;
  provider?: string;
  page?: number;
  limit?: number;
}

function propertiesQuery(params: ListPropertiesParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

/** Public listings shown on the home page. */
export function listProperties(params: ListPropertiesParams = {}) {
  return request<{ properties: Property[]; pagination: Pagination }>(`/properties${propertiesQuery(params)}`, {
    method: "GET",
  });
}

/** The logged-in business's own listings. */
export function listMyProperties(params: ListPropertiesParams = {}) {
  return request<{ properties: Property[]; pagination: Pagination }>(
    `/properties/mine${propertiesQuery(params)}`,
    { method: "GET" }
  );
}

/** Every listing with full poster details (SUPER_ADMIN only). */
export function listAllProperties(params: ListPropertiesParams = {}) {
  return request<{ properties: Property[]; pagination: Pagination }>(
    `/properties/all${propertiesQuery(params)}`,
    { method: "GET" }
  );
}

/** Fetches a file from the API and triggers a browser download of it. */
async function downloadFile(path: string, fallbackName: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiClientError(body?.message ?? "Unable to export right now.", res.status);
  }

  const disposition = res.headers.get("content-disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Downloads every listing matching the admin filters as an .xlsx file
 * (SUPER_ADMIN only). Resolves once the download starts.
 */
export function exportProperties(params: Omit<ListPropertiesParams, "page" | "limit"> = {}) {
  return downloadFile(`/properties/export${propertiesQuery(params)}`, "listings.xlsx");
}

export function deleteProperty(id: string) {
  return request<void>(`/properties/${id}`, { method: "DELETE" });
}

// ---- Billing ----

export function getMyBilling() {
  return request<{ billing: BillingSummary }>("/billing/me", { method: "GET" });
}

/** Starts a WaafiPay charge; the customer approves on their phone. Poll getPayment for the result. */
export function startPayment(phone: string) {
  return request<{ payment: Payment }>("/billing/payments", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function getPayment(id: string) {
  return request<{ payment: Payment }>(`/billing/payments/${id}`, { method: "GET" });
}

export interface ListBillingParams {
  q?: string;
  status?: BillingStatus;
  page?: number;
  limit?: number;
}

function billingQuery(params: ListBillingParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export function listBillingBusinesses(params: ListBillingParams = {}) {
  return request<{ businesses: BusinessBillingRow[]; totals: BillingTotals; pagination: Pagination }>(
    `/billing/businesses${billingQuery(params)}`,
    { method: "GET" }
  );
}

export function exportBilling(params: Omit<ListBillingParams, "page" | "limit"> = {}) {
  return downloadFile(`/billing/businesses/export${billingQuery(params)}`, "billing.xlsx");
}

/** Admin records an off-app payment (cash, bank, direct transfer) — adds one month. */
export function recordManualPayment(businessId: string, note?: string) {
  return request<{ payment: Payment }>(`/billing/businesses/${businessId}/payments`, {
    method: "POST",
    body: JSON.stringify({ note: note || undefined }),
  });
}

export type ContactTopic = "GENERAL" | "RENTING" | "LISTING" | "BILLING" | "SUPPORT";

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  message: string;
}

export function sendContactMessage(input: ContactInput) {
  return request<Record<string, never>>("/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
