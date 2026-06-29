import "server-only";
import { createHmac } from "node:crypto";

/**
 * ACLEDA Toanchet Pay — XPAY Connector helpers (server-only).
 *
 * Verified against the public UAT sandbox:
 *   POST {baseUrl}/{merchantName}/XPAYConnectorServiceInterfaceImplV2
 *        /XPAYConnectorServiceInterfaceImplV2RS/openSessionV2
 *   Content-Type: application/json   (form-encoding → HTTP 415)
 *
 * A successful KHQR-String call (operationType "5") returns the QR directly in
 * the response: result.qrValue (KHQR string) + result.qrBase64 (PNG).
 *
 * ⚠️ The `hash` is an HMAC over the request using a SHARED SECRET KEY that
 * ACLEDA issues per-merchant. The exact field set/order is defined in their API
 * Spec. `computeHash` below is a BEST-GUESS placeholder (documented order with
 * an HMAC-SHA512) — it will NOT match until the real secret + formula are
 * confirmed. See doc/toanchet/04-sandbox-test.md.
 */

export type ToanchetConfig = {
  baseUrl: string;
  merchantName: string;
  loginId: string;
  password: string;
  merchantID: string;
  secret: string;
};

// Public sandbox credentials (override via env for real merchants).
export function getToanchetConfig(): ToanchetConfig {
  return {
    baseUrl: process.env.TOANCHET_BASE_URL ?? "https://epaymentuat.acledabank.com.kh",
    merchantName: process.env.TOANCHET_MERCHANT_NAME ?? "XPAYTEST2024",
    loginId: process.env.TOANCHET_LOGIN_ID ?? "xpaytest2024",
    password: process.env.TOANCHET_PASSWORD ?? "xpaytest2024",
    merchantID: process.env.TOANCHET_MERCHANT_ID ?? "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
    secret: process.env.TOANCHET_SECRET ?? "",
  };
}

export type XpayTransaction = {
  txid: string;
  purchaseAmount: string;
  purchaseCurrency: string;
  purchaseDate: string; // DD-MM-YYYY
  purchaseDesc: string;
  invoiceid: string;
  item: string;
  quantity: string;
  expiryTime: string; // minutes
  operationType: string; // "5" = KHQR string
};

/** 14–15 digit timestamp-shaped id: YYMMDDHHMMSS + 3 random digits. */
export function makeTxid(): string {
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    p(d.getFullYear() % 100) +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds()) +
    p(Math.floor(Math.random() * 1000), 3)
  );
}

/** ACLEDA uses DD-MM-YYYY for purchaseDate. */
export function todayDDMMYYYY(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/**
 * ⚠️ PLACEHOLDER hash. Documented order: merchantID + loginId + password + txid,
 * HMAC-SHA512 with the shared secret, uppercase hex. Replace with the exact
 * formula from ACLEDA's API Spec once known (the real one also folds in the
 * transaction fields). Returns "" if no secret is configured.
 */
export function computeHash(txn: XpayTransaction, cfg = getToanchetConfig()): string {
  if (!cfg.secret) return "";
  const message = cfg.merchantID + cfg.loginId + cfg.password + txn.txid;
  return createHmac("sha512", cfg.secret).update(message, "utf8").digest("hex").toUpperCase();
}

export function openSessionUrl(cfg = getToanchetConfig()): string {
  return (
    `${cfg.baseUrl}/${cfg.merchantName}` +
    `/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/openSessionV2`
  );
}

export type OpenSessionBody = {
  loginId: string;
  password: string;
  merchantID: string;
  hash: string;
  xpayTransaction: XpayTransaction;
};

export type OpenSessionResult = {
  httpStatus: number;
  raw: string;
  /** Parsed `result` object when the response was JSON. */
  result?: {
    code?: number;
    errorDetails?: string;
    sessionid?: string;
    qrValue?: string;
    qrBase64?: string;
    xTran?: { paymentTokenid?: string; [k: string]: unknown };
    [k: string]: unknown;
  };
};

export async function openSessionV2(
  body: OpenSessionBody,
  cfg = getToanchetConfig()
): Promise<OpenSessionResult> {
  const res = await fetch(openSessionUrl(cfg), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const raw = await res.text();
  let result: OpenSessionResult["result"];
  try {
    result = JSON.parse(raw).result;
  } catch {
    /* non-JSON (e.g. 415) — leave undefined */
  }
  return { httpStatus: res.status, raw, result };
}
