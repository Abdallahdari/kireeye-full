import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// WaafiPay "API_PURCHASE" against a mobile wallet (EVC Plus / ZAAD / SAHAL).
// The customer gets a prompt on their phone and the HTTP call only returns
// once they approve, decline, or it times out — so callers should run this in
// the background rather than inside a request.
// Docs: https://docs.waafipay.com/api-introduction

export interface WalletChargeInput {
  // E.164 Somali number, e.g. "+252611234567".
  phone: string;
  amount: number;
  currency: "USD";
  // Our payment id; must be alphanumeric/dash/underscore/dot for WaafiPay.
  referenceId: string;
  description: string;
}

export interface WalletChargeResult {
  approved: boolean;
  transactionId: string | null;
  responseCode: string | null;
  // Human-readable reason, shown to the business when a payment fails.
  message: string;
}

interface WaafiResponse {
  responseCode?: string;
  errorCode?: string;
  responseMsg?: string;
  params?: {
    state?: string;
    transactionId?: string;
    referenceId?: string;
    txAmount?: string;
  };
}

const RESPONSE_MESSAGES: Record<string, string> = {
  "5306": "The payment was cancelled on the phone.",
  "5301": "Payment service is misconfigured. Please contact support.",
  "5307": "Payment session expired. Please try again.",
};

function waafiTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

async function chargeMock(input: WalletChargeInput): Promise<WalletChargeResult> {
  await new Promise((r) => setTimeout(r, 1500));
  if (input.phone.endsWith("0000")) {
    return { approved: false, transactionId: null, responseCode: "5306", message: "Payment declined (test mode)." };
  }
  return {
    approved: true,
    transactionId: `MOCK-${crypto.randomBytes(6).toString("hex").toUpperCase()}`,
    responseCode: "2001",
    message: "Approved (test mode)",
  };
}

export function isPaymentServiceEnabled(): boolean {
  return env.waafi.mode !== "disabled";
}

export async function chargeMobileWallet(input: WalletChargeInput): Promise<WalletChargeResult> {
  if (env.waafi.mode === "mock") return chargeMock(input);
  if (env.waafi.mode === "disabled") {
    return { approved: false, transactionId: null, responseCode: null, message: "Online payments are not set up yet." };
  }

  const body = {
    schemaVersion: "1.0",
    requestId: crypto.randomUUID(),
    timestamp: waafiTimestamp(new Date()),
    channelName: "WEB",
    serviceName: "API_PURCHASE",
    serviceParams: {
      merchantUid: env.waafi.merchantUid,
      apiUserId: env.waafi.apiUserId,
      apiKey: env.waafi.apiKey,
      paymentMethod: "MWALLET_ACCOUNT",
      payerInfo: { accountNo: input.phone.replace(/\D/g, "") },
      transactionInfo: {
        referenceId: input.referenceId,
        invoiceId: input.referenceId,
        // WaafiPay truncates past 2 decimals; round explicitly instead.
        amount: Math.round(input.amount * 100) / 100,
        currency: input.currency,
        description: input.description,
      },
    },
  };

  let data: WaafiResponse;
  try {
    const res = await fetch(env.waafi.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(env.waafi.timeoutMs),
    });
    data = (await res.json()) as WaafiResponse;
  } catch (err) {
    // Never log the request body — it contains the API key.
    logger.error(`WaafiPay request failed for payment ${input.referenceId}`, (err as Error)?.message);
    return {
      approved: false,
      transactionId: null,
      responseCode: null,
      message: "Couldn't reach the payment provider. You were not charged — please try again.",
    };
  }

  // 2001 only means WaafiPay processed the request; the transaction state
  // says whether money actually moved.
  const approved = data.responseCode === "2001" && data.params?.state === "APPROVED";
  const code = data.responseCode ?? null;

  if (!approved) {
    logger.warn(
      `WaafiPay declined payment ${input.referenceId}: ${code} ${data.errorCode ?? ""} ${data.responseMsg ?? ""} ${data.params?.state ?? ""}`
    );
  }

  return {
    approved,
    transactionId: data.params?.transactionId ?? null,
    responseCode: code,
    message: approved
      ? "Approved"
      : (code && RESPONSE_MESSAGES[code]) ?? data.responseMsg ?? "The payment was not approved.",
  };
}
