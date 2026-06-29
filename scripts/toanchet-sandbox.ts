/**
 * Toanchet Pay (ACLEDA) — sandbox integration test harness.
 *
 * Calls the XPAY Connector `openSessionV2` endpoint with the public sandbox
 * credentials and prints the full request/response so we can verify the
 * signature scheme + endpoint before building the real integration.
 *
 * Run:
 *   npx tsx scripts/toanchet-sandbox.ts            # single attempt (current CONFIG)
 *   npx tsx scripts/toanchet-sandbox.ts --probe    # try a matrix of unknowns
 *
 * Two things the public docs DON'T pin down (override via env once ACLEDA
 * confirms them):
 *   TOANCHET_SECRET        — HMAC shared secret used to sign the request
 *   TOANCHET_MERCHANT_NAME — the {MERCHANTNAME} path segment in the URL
 *
 * Everything else (algorithm, concatenation order, encoding) follows the
 * public KHQR/MPGS integration pages: HMAC-SHA512 over
 *   merchantID + loginId + password + txid
 * output as an UPPERCASE hex string.
 */
import { createHmac, createHash } from "node:crypto";

// --- Sandbox credentials (provided by ACLEDA's public sandbox page) ----------
const CREDS = {
  loginId: "xpaytest2024",
  password: "xpaytest2024",
  merchantID: "v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
};

// --- Config (override via env) ----------------------------------------------
const BASE_URL = process.env.TOANCHET_BASE_URL ?? "https://epaymentuat.acledabank.com.kh";
// Unknown #1: the secret used to sign. Default guess = the password.
// (Unconfirmed — every guessable value still yields the generic -99 error,
//  so the real shared secret must come from ACLEDA.)
const SECRET = process.env.TOANCHET_SECRET ?? CREDS.password;
// Unknown #2 (DISCOVERED): the {MERCHANTNAME} path segment is the UPPERCASE
// loginId — "XPAYTEST2024" is the only candidate that gets past the merchant
// filter (others return code -119 "Filter Merchant not found!!!").
const MERCHANT_NAME = process.env.TOANCHET_MERCHANT_NAME ?? CREDS.loginId.toUpperCase();

// --- txid: a unique per-transaction id. The sandbox sample used a 14-digit
// timestamp-like value (YYMMDDHHMMSSxx). Generate the same shape unless one is
// pinned via env (e.g. to replay the sample 26062909080063). --------------
function makeTxid(): string {
  if (process.env.TOANCHET_TXID) return process.env.TOANCHET_TXID;
  const d = new Date();
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    p(d.getFullYear() % 100) +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds()) +
    p(Math.floor(Math.random() * 100))
  );
}

// --- Signature schemes to consider ------------------------------------------
type Scheme = {
  name: string;
  sign: (txid: string, secret: string) => string;
};

function message(txid: string): string {
  // Documented order: merchantID + loginId + password + txid
  return CREDS.merchantID + CREDS.loginId + CREDS.password + txid;
}

const SCHEMES: Scheme[] = [
  {
    name: "HMAC-SHA512(msg, secret) UPPER hex  [documented]",
    sign: (txid, secret) =>
      createHmac("sha512", secret).update(message(txid), "utf8").digest("hex").toUpperCase(),
  },
  {
    name: "HMAC-SHA512(msg, secret) lower hex",
    sign: (txid, secret) =>
      createHmac("sha512", secret).update(message(txid), "utf8").digest("hex"),
  },
  {
    name: "SHA-512(msg) UPPER hex  [no key]",
    sign: (txid) => createHash("sha512").update(message(txid), "utf8").digest("hex").toUpperCase(),
  },
  {
    name: "HMAC-SHA256(msg, secret) UPPER hex",
    sign: (txid, secret) =>
      createHmac("sha256", secret).update(message(txid), "utf8").digest("hex").toUpperCase(),
  },
];

function openSessionUrl(merchantName: string): string {
  return (
    `${BASE_URL}/${merchantName}` +
    `/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/openSessionV2`
  );
}

type Attempt = {
  url: string;
  scheme: string;
  secret: string;
  body: Record<string, string>;
};

async function callOpenSession(a: Attempt) {
  const started = Date.now();
  try {
    const res = await fetch(a.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(a.body),
      // sandbox sometimes has slow/odd TLS; give it room
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, statusText: res.statusText, text, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, statusText: "FETCH_ERROR", text: String(err), ms: Date.now() - started };
  }
}

function buildBody(txid: string, signature: string): Record<string, string> {
  // Mirrors the credential JSON shape ACLEDA's sandbox page shows.
  return {
    loginId: CREDS.loginId,
    password: CREDS.password,
    merchantID: CREDS.merchantID,
    signature,
    txid,
  };
}

async function single() {
  const txid = makeTxid();
  const scheme = SCHEMES[0];
  const signature = scheme.sign(txid, SECRET);
  const url = openSessionUrl(MERCHANT_NAME);
  const body = buildBody(txid, signature);

  console.log("=== Toanchet Pay sandbox — openSessionV2 ===\n");
  console.log("URL          :", url);
  console.log("Scheme       :", scheme.name);
  console.log("Secret (key) :", SECRET);
  console.log("Merchant path:", MERCHANT_NAME);
  console.log("txid         :", txid);
  console.log("signature    :", signature);
  console.log("\nRequest body :", JSON.stringify(body, null, 2));

  const r = await callOpenSession({ url, scheme: scheme.name, secret: SECRET, body });
  console.log(`\nResponse     : ${r.status} ${r.statusText}  (${r.ms}ms)`);
  console.log("Body         :", r.text.slice(0, 2000));

  if (r.text.includes("sessionId") || r.text.includes("paymentTokenId")) {
    console.log("\n✅ Looks like a session was opened — capture sessionId + paymentTokenId.");
  } else {
    console.log("\nℹ️  No session in response. Try `--probe` to sweep the unknowns,");
    console.log("   or set TOANCHET_SECRET / TOANCHET_MERCHANT_NAME once ACLEDA confirms them.");
  }
}

async function probe() {
  const txid = makeTxid();
  const merchantNames = [
    process.env.TOANCHET_MERCHANT_NAME,
    CREDS.loginId,
    CREDS.loginId.toUpperCase(),
    "xpaytest",
    "test",
  ].filter(Boolean) as string[];
  const secrets = [
    process.env.TOANCHET_SECRET,
    CREDS.password,
    CREDS.merchantID,
    CREDS.loginId,
    "",
  ].filter((s) => s !== undefined) as string[];

  console.log("=== PROBE: sweeping endpoint × scheme × secret ===");
  console.log("txid:", txid, "\n");

  // 1) First find a merchant-name path that the server even recognises
  //    (404 vs anything else), using the documented scheme + default secret.
  const reachable: string[] = [];
  for (const mn of [...new Set(merchantNames)]) {
    const url = openSessionUrl(mn);
    const sig = SCHEMES[0].sign(txid, secrets[0] ?? CREDS.password);
    const r = await callOpenSession({ url, scheme: SCHEMES[0].name, secret: "", body: buildBody(txid, sig) });
    console.log(`[path] ${mn.padEnd(16)} → ${r.status} ${r.statusText}  ${r.text.slice(0, 120).replace(/\s+/g, " ")}`);
    // A path is RECOGNISED if it gets past the merchant filter, i.e. the
    // response is NOT the "Filter Merchant not found!!!" (code -119) rejection.
    if (r.status !== 0 && !r.text.includes("Filter Merchant not found")) reachable.push(mn);
  }

  if (reachable.length === 0) {
    console.log("\n❌ No merchant-name path got past the merchant filter (all -119 / network error).");
    console.log("   The {MERCHANTNAME} segment is wrong — ask ACLEDA for the sandbox merchant name / full URL.");
    return;
  }

  // 2) For a reachable path, sweep schemes × secrets and show what changes.
  const mn = reachable[0];
  const url = openSessionUrl(mn);
  console.log(`\nSweeping signatures against reachable path: ${mn}\n`);
  for (const scheme of SCHEMES) {
    for (const secret of [...new Set(secrets)]) {
      const t = makeTxid();
      const sig = scheme.sign(t, secret);
      const r = await callOpenSession({ url, scheme: scheme.name, secret, body: buildBody(t, sig) });
      const hit = r.text.includes("sessionId") || r.text.includes("paymentTokenId");
      console.log(
        `${hit ? "✅" : "  "} ${scheme.name.padEnd(42)} key=${(secret || "<empty>").padEnd(28)} → ${r.status} ${r.text.slice(0, 100).replace(/\s+/g, " ")}`
      );
      if (hit) {
        console.log("\n🎉 MATCH — use this scheme + secret. Full body:\n", r.text);
        return;
      }
    }
  }
  console.log("\nNo signature combination opened a session. The secret is likely a value only ACLEDA can give you.");
}

const mode = process.argv.includes("--probe") ? probe : single;
mode().catch((e) => {
  console.error(e);
  process.exit(1);
});
