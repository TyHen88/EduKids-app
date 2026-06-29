"use server";

import {
  computeHash,
  getToanchetConfig,
  makeTxid,
  openSessionV2,
  todayDDMMYYYY,
  type OpenSessionBody,
  type XpayTransaction,
} from "@/lib/toanchet";

/**
 * Known-good KHQR-String sample provided by ACLEDA. Replaying it verbatim
 * returns a real QR from the UAT sandbox — used to prove the flow end-to-end
 * without needing the shared secret. (The hash is valid only for THESE fields.)
 */
const SAMPLE: { hash: string; txn: XpayTransaction } = {
  hash: "8313A36827D455B992E50B21B691CECF67850D03CB05DFCD625E00CCD15E22659B5D0E6F5734BE1C7CE9270522602450B6A4407A53D1B1173360FFEB4B76322A",
  txn: {
    txid: "260629091720972",
    purchaseAmount: "4000",
    purchaseCurrency: "KHR",
    purchaseDate: "29-06-2026",
    purchaseDesc: "mobile",
    invoiceid: "260629091720972",
    item: "1",
    quantity: "1",
    expiryTime: "5",
    operationType: "5",
  },
};

export type KhqrTestInput = {
  mode: "sample" | "generate";
  amount: string;
  currency: string;
  desc: string;
  expiryMinutes: string;
};

export type KhqrTestResult = {
  ok: boolean;
  httpStatus: number;
  code?: number;
  message?: string;
  sessionid?: string;
  paymentTokenid?: string;
  qrValue?: string;
  qrBase64?: string; // bare base64 (no data: prefix)
  sentBody: OpenSessionBody;
  raw: string;
  note?: string;
};

/**
 * Call openSessionV2 for the KHQR-String API (operationType "5") and return a
 * UI-friendly result (QR string + PNG, session ids, raw response).
 */
export async function khqrStringTest(input: KhqrTestInput): Promise<KhqrTestResult> {
  const cfg = getToanchetConfig();

  let txn: XpayTransaction;
  let hash: string;
  let note: string | undefined;

  if (input.mode === "sample") {
    txn = SAMPLE.txn;
    hash = SAMPLE.hash;
    note = "Replaying ACLEDA's known-good sample (fixed 4000 KHR).";
  } else {
    const txid = makeTxid();
    txn = {
      txid,
      purchaseAmount: input.amount || "100",
      purchaseCurrency: input.currency || "KHR",
      purchaseDate: todayDDMMYYYY(),
      purchaseDesc: input.desc || "EduKids",
      invoiceid: txid,
      item: "1",
      quantity: "1",
      expiryTime: input.expiryMinutes || "5",
      operationType: "5",
    };
    hash = computeHash(txn, cfg);
    if (!hash) {
      note =
        "No TOANCHET_SECRET configured, so the hash is empty — the bank will reject it. Set the shared secret (and confirm the hash formula) to generate fresh QRs.";
    } else {
      note =
        "Hash computed with the PLACEHOLDER formula — expect rejection until ACLEDA confirms the exact field set/order + secret.";
    }
  }

  const sentBody: OpenSessionBody = {
    loginId: cfg.loginId,
    password: cfg.password,
    merchantID: cfg.merchantID,
    hash,
    xpayTransaction: txn,
  };

  try {
    const { httpStatus, raw, result } = await openSessionV2(sentBody, cfg);
    const code = typeof result?.code === "number" ? result.code : undefined;
    return {
      ok: code === 0,
      httpStatus,
      code,
      message: result?.errorDetails,
      sessionid: result?.sessionid,
      paymentTokenid: result?.xTran?.paymentTokenid as string | undefined,
      qrValue: result?.qrValue,
      qrBase64: result?.qrBase64,
      sentBody,
      raw: raw.length > 4000 ? raw.slice(0, 4000) + "…(truncated)" : raw,
      note,
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      message: err instanceof Error ? err.message : String(err),
      sentBody,
      raw: "",
      note: "Network/timeout error calling the sandbox.",
    };
  }
}
