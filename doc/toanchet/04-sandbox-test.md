# 04 — Sandbox Test (empirical findings)

We called the real ACLEDA UAT `openSessionV2` endpoint with the public sandbox
credentials and **successfully generated a live KHQR** (operationType 5).

## ✅ RESULT: KHQR String works

Replaying ACLEDA's known-good sample returned `code 0 "SUCCESS"` with a real
Bakong KHQR string **and** a PNG — the QR comes back **directly in the
`openSessionV2` response** (no payment-page redirect needed for the QR-string
flow):

```jsonc
{ "result": {
  "code": 0,
  "errorDetails": "SUCCESS",
  "sessionid": "8NoLnyyPeKq7m3HdP3A0ct57xX8z",
  "xTran": { "purchaseAmount": 4000.0, "paymentTokenid": "Yxz8aeHmOq7H9OSSmuUHBojPLLoz", "expiryTime": 5, ... },
  "qrValue":  "00020101021230410009khqr@aclb0114000108111111210206ACLEDA3937...6304E36A",
  "qrBase64": "iVBORw0KGgoAAAANSUhEUgAA...”   // PNG of the QR
}}
```

## The real request shape

`openSessionV2` is **not** the 5-flat-field body we first guessed. It is a
`hash` + a nested `xpayTransaction`:

```jsonc
POST https://epaymentuat.acledabank.com.kh/XPAYTEST2024/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/openSessionV2
Content-Type: application/json
{
  "loginId":   "xpaytest2024",
  "password":  "xpaytest2024",
  "merchantID":"v4uFDbZKlJ1Dyf7dq7MfpTmpYKU=",
  "hash":      "8313A368…B76322A",          // HMAC over the txn w/ a SHARED SECRET
  "xpayTransaction": {
    "txid":            "260629091720972",     // 15-digit, timestamp-shaped
    "purchaseAmount":  "4000",
    "purchaseCurrency":"KHR",
    "purchaseDate":    "29-06-2026",          // DD-MM-YYYY
    "purchaseDesc":    "mobile",
    "invoiceid":       "260629091720972",
    "item":            "1",
    "quantity":        "1",
    "expiryTime":      "5",                    // minutes
    "operationType":   "5"                     // 5 = KHQR string
  }
}
```

## Confirmed by testing ✅

| Thing | Finding |
|-------|---------|
| Endpoint | `POST {base}/{MERCHANTNAME}/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/openSessionV2` |
| UAT base | `https://epaymentuat.acledabank.com.kh` |
| `{MERCHANTNAME}` | **`XPAYTEST2024`** (uppercase loginId) — others give `code -119 "Filter Merchant not found!!!"` |
| Content-Type | **`application/json`** required (form-encoded → HTTP 415) |
| Body | `hash` + nested `xpayTransaction` (above) |
| KHQR-String op | `operationType: "5"` → `qrValue` + `qrBase64` returned inline |
| Success envelope | `code 0 "SUCCESS"` + `sessionid` + `xTran.paymentTokenid` |

## ⛔ The one remaining blocker: the `hash` secret

To generate a QR for **any** amount we must compute `hash` for a fresh `txid`.
The `hash` is a **128-hex (SHA-512-family) HMAC** that folds in a **shared secret
key ACLEDA issues per merchant** (their docs: *"hash the message using your
shared secret key"*).

We tried to reverse-engineer it from the one known-good `(inputs → hash)` pair —
**~210,000+ candidates**: every field order, ordered subsets of the txn fields,
plain SHA-512 / SHA3-512 / HMAC-SHA512/256, all known values as the HMAC key,
amount/currency/merchantID encoding variants, multiple separators. **No match.**

**Conclusion:** the secret is genuinely external — only ACLEDA can supply it.
Once we have it (and the exact field set/order they hash), fresh QRs work.

## What to ask ACLEDA (onlinebanking@acledabank.com.kh)

> KHQR-String `openSessionV2` works when we replay your sample hash. To generate
> our own transactions, please provide for sandbox merchant **XPAYTEST2024**:
> 1. The **shared secret key** used to compute `hash`.
> 2. The **exact hash recipe** — which fields, in what order, which algorithm
>    (HMAC-SHA512?), and output encoding (uppercase hex?). A worked example for
>    the sample (txid `260629091720972`, amount 4000 KHR → hash `8313A368…`)
>    would let us verify instantly.
> 3. The full **API Spec PDF** (callback payload + signature verification,
>    transaction-status check, amount units, prod base URL).

## Tools in this repo

| Tool | Purpose |
|------|---------|
| **UI:** `app/[lang]/payment-test/` → visit **`/km/payment-test`** | Click **Sample (known-good)** to render a live QR; **Generate** is ready for the real secret. |
| `actions/toanchet.ts` | Server action `khqrStringTest()` — builds the body, calls the sandbox, returns QR + ids + raw. |
| `lib/toanchet.ts` | `openSessionV2()`, `makeTxid()`, `computeHash()` (⚠️ placeholder formula — fix once ACLEDA confirms). |
| `scripts/toanchet-sandbox.ts` | The original CLI discovery harness (how we found `XPAYTEST2024` + the JSON requirement). |

## When the secret arrives

1. Set `TOANCHET_SECRET=…` (and confirm/fix the formula in `lib/toanchet.ts → computeHash`).
2. On `/km/payment-test`, switch to **Generate**, set an amount, **Run** → expect a fresh QR.
3. Then build the **callback/status-check** to confirm payment server-side and
   grant entitlement — see [03-edukids-integration-plan.md](./03-edukids-integration-plan.md).

> All calls were against ACLEDA's **UAT/sandbox** with public test credentials —
> no production calls, no real money.
