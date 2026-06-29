# 02 — API Integration (Technical)

> [!WARNING]
> Reconstructed from the public portal. **Shape and order are reliable; exact
> field names, the full callback payload, and the callback-signature scheme are
> not.** Confirm against the official **API Spec** before building. Anything
> marked _(confirm)_ is inferred.

## Integration model

Toanchet Pay is an **XPAY Connector** gateway using a **redirect / hosted
payment page** model:

1. Server computes an HMAC signature and opens a session (`openSessionV2`).
2. Server hands the browser a set of parameters that it **POSTs to ACLEDA's
   hosted `paymentPage.jsp`**.
3. Customer completes payment on ACLEDA's page (scans KHQR or enters card).
4. ACLEDA redirects the browser back to your **success** or **error** URL **and**
   (asynchronously) calls your **callback** webhook.
5. Server **verifies** the outcome with `getTxnStatus` before granting value.

This is the same family as ABA PayWay's hosted checkout — secrets stay on the
server, the customer is redirected to the bank, and you reconcile out-of-band.

## Integration variants

The docs list several `operationType` / service selectors on the hosted page:

| Selector | Meaning |
|----------|---------|
| `operationType = 1` _(confirm)_ | **MPGS / card** |
| `operationType = 3` | **KHQR** (string + web-view + deeplink variants) |
| `paymentCard = 1` | MPGS Service integration flag |
| — | Tokenize integration (card-on-file) |
| — | Direct Debit integration (account/wallet pull) |

## Step 0 — Credentials (issued at onboarding)

| Credential | Use |
|------------|-----|
| `merchantID` | Merchant identifier |
| `loginId` | Connector login |
| `password` | Connector password |
| `sharedSecretKey` | HMAC key — **never leaves the server** |
| `{MERCHANTNAME}` | Path segment in every connector URL |

## Step 1 — Authentication: HMAC-SHA512

Concatenate **in this exact order** (order-sensitive, no delimiters):

```
message = merchantID + loginId + password + txid
hash    = HMAC_SHA512(message, sharedSecretKey)
        → uppercase HEX (base-16), no spaces or separators
```

`txid` is your unique per-transaction id (you generate it; reuse the same value
as `transactionID` on the payment page).

Node example:

```ts
import { createHmac } from "node:crypto";

function signToanchet(params: {
  merchantID: string;
  loginId: string;
  password: string;
  txid: string;
  sharedSecretKey: string;
}): string {
  const message =
    params.merchantID + params.loginId + params.password + params.txid;
  return createHmac("sha512", params.sharedSecretKey)
    .update(message, "utf8")
    .digest("hex")
    .toUpperCase();
}
```

## Step 2 — `openSessionV2`

**POST** (server-to-server) to:

```
https://epaymentuat.acledabank.com.kh/{MERCHANTNAME}/XPAYConnectorServiceInterfaceImplV2/XPAYConnectorServiceInterfaceImplV2RS/openSessionV2
```

Send `merchantID`, `loginId`, `txid`, and the `hash` _(confirm exact body/format
— likely JSON; the password itself is not sent, only proven via the hash)_.

**Returns:** `sessionId` and `paymentTokenId` — both required for Step 3.

## Step 3 — Redirect to the hosted payment page

Build an `xpayTransaction` object and **POST it as a form** from the browser to:

```
https://epaymentuat.acledabank.com.kh/{MERCHANTNAME}/paymentPage.jsp
```

Known fields:

| Field | Notes |
|-------|-------|
| `sessionid` | from `openSessionV2` |
| `paymenttokenid` | from `openSessionV2` |
| `merchantID` | your merchant id |
| `transactionID` | your unique txn id (== `txid`) |
| `invoiceid` | your invoice/order ref |
| `amount` | transaction amount |
| `quantity` | item quantity |
| `item` | item name |
| `description` | description shown to payer |
| `currencytype` | currency (e.g. USD / KHR) _(confirm enum)_ |
| `operationType` | `3` = KHQR, `1` = card _(confirm)_ |
| `expirytime` | QR / session expiry |
| `successUrlToReturn` | browser redirect on success (dynamic, per-txn) |
| `errorUrlToReturn` | browser redirect on failure (dynamic, per-txn) |

The customer pays on ACLEDA's page, then is redirected to `successUrlToReturn`
or `errorUrlToReturn`.

> **KHQR variants:** the QR can be returned as a **string** (you render it), a
> **web view** (ACLEDA hosts it), or a **deeplink** (open a banking app on
> mobile). The exact mechanism for the raw KHQR string is not in the public docs —
> confirm in the API Spec. The KHQR payload itself follows the **Bakong / EMVCo
> KHQR** standard (see the NBC spec linked in [01](./01-overview.md)).

## Step 4 — Verify the result (do NOT trust the redirect)

The redirect to your success URL is **not** proof of payment (it's a browser
navigation a user could fake or interrupt). Always confirm server-side:

- **`getTxnStatus` API** — query the final status by `transactionID`.
- **Callback API (webhook)** — ACLEDA POSTs the result to a callback URL you
  register. Treat it as the source of truth; verify its signature _(scheme:
  confirm — likely the same HMAC-SHA512 over the returned fields)_, then update
  your records idempotently.

Recommended reconciliation rule:

> Grant value only when **either** the callback **or** an explicit `getTxnStatus`
> call reports success for that `transactionID`, and only **once** per
> `transactionID` (idempotency).

## Open questions to resolve with ACLEDA

1. Exact `openSessionV2` request/response bodies (JSON shape, field names).
2. Full **callback payload** fields and how to **verify its signature**.
3. `currencytype` enum and whether amounts are major units (USD `1.50`) or minor
   units (cents/riel).
4. Card flow specifics: 3‑D Secure handling, tokenization (card-on-file) API.
5. Refund API (the portal supports refunds — is there a programmatic endpoint?).
6. Production base URL pattern (UAT uses `epaymentuat...`; prod likely
   `epayment...` — confirm).
7. IP allow-listing / mTLS or any transport requirements for server-to-server calls.

See [03-edukids-integration-plan.md](./03-edukids-integration-plan.md) for how this maps onto this codebase.
