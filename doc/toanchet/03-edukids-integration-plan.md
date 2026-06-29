# 03 — EduKids Integration Plan

How Toanchet Pay would slot into **this** app (Next.js 16 App Router · React 19 ·
Supabase Auth · Drizzle on Supabase Postgres). This is a **proposed design**, not
implemented code.

## Why this matters here

Billing was stripped during the migration. `getUserSubscription()` in
[db/queries.ts](../../db/queries.ts) is a **stub that always returns
`{ isActive: true }`**, and gameplay still branches on it (so hearts are
effectively unlimited). Toanchet Pay is the path to **real payments** — e.g. a
"Pro / unlimited hearts" purchase or a paid course unlock.

## Architectural fit

| Concern | Decision |
|---------|----------|
| Where secrets live | Server only — a `"use server"` action in `actions/`, reading `process.env`. **Never** `NEXT_PUBLIC_*`. |
| Starting a payment | Server action: sign → `openSessionV2` → return hosted-page POST params to the client. |
| Hosted checkout | Browser auto-submits a form to ACLEDA's `paymentPage.jsp` (the customer leaves your site). |
| Result handling | A **Route Handler** webhook (`app/api/payments/toanchet/callback/route.ts`) + a `getTxnStatus` re-check. |
| Persistence | New Drizzle tables: `payments` (+ optionally `subscriptions`). |
| Granting value | Webhook flips the user's entitlement, idempotently keyed on `transactionID`. |

> [!IMPORTANT]
> The repo **intentionally removed all `app/api/*` routes** during the core-only
> migration (see CLAUDE.md). The callback webhook **reintroduces exactly one**
> route handler. Keep it minimal and payment-scoped.

## Proposed flow

```
[Client]  click "Buy Pro"
   │
   ▼
[Server action: actions/payment.ts → startToanchetPayment()]
   • auth() → userId  (lib/auth.ts)
   • generate txid, insert payments row (status: "pending")
   • hash = HMAC_SHA512(merchantID+loginId+password+txid, secret)
   • POST openSessionV2 → { sessionId, paymentTokenId }
   • return xpayTransaction params (incl. success/error URLs + callback)
   │
   ▼
[Client]  auto-submit <form> POST → ACLEDA paymentPage.jsp
   │                                   (customer pays via KHQR/card)
   ▼
[ACLEDA]  ── browser redirect ──► /[lang]/payment/success | /error   (UX only)
          ── server webhook  ──►  /api/payments/toanchet/callback     (source of truth)
   │
   ▼
[Route handler: callback]
   • verify signature
   • getTxnStatus(txid) to confirm
   • idempotent update: payments.status = "paid"; grant entitlement
   • return 200
```

## Files to add

```
actions/payment.ts                                   # "use server": startToanchetPayment(), verifyToanchetPayment()
lib/toanchet.ts                                       # signToanchet(), openSessionV2(), getTxnStatus(), URL builders
app/api/payments/toanchet/callback/route.ts           # webhook (the one reintroduced API route)
app/[lang]/(main)/payment/success/page.tsx            # "thanks, confirming…" (polls/reads status)
app/[lang]/(main)/payment/error/page.tsx              # failure UX
db/schema.ts                                          # + payments (+ subscriptions) tables
```

## Schema sketch (`db/schema.ts`)

```ts
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "expired",
]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),          // Supabase auth uid
  txid: text("txid").notNull().unique(),       // our id == transactionID == hash txid
  invoiceId: text("invoice_id").notNull(),
  amount: integer("amount").notNull(),         // store minor units — confirm with ACLEDA
  currency: text("currency").notNull(),        // "USD" | "KHR"
  method: text("method"),                       // "khqr" | "card"
  status: paymentStatusEnum("status").notNull().default("pending"),
  product: text("product"),                     // e.g. "pro" | "course:123"
  rawCallback: jsonb("raw_callback"),           // audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});
```

Apply with `npm run db:push` (this repo generates no migration files).

## Critical gotchas for this stack

1. **`proxy.ts` (Next 16 middleware) must not locale-redirect the webhook.**
   The proxy does the locale redirect (`/foo` → `/km/foo`) **and** Supabase
   session refresh. **Good news:** [proxy.ts](../../proxy.ts) already early-returns
   `NextResponse.next()` for any path starting with `/api` (the
   `pathname.startsWith("/api")` guard), so a callback at
   `/api/payments/toanchet/callback` is **already safe** — it won't be
   307-redirected to `/km/api/...`. Just keep the webhook under `/api/...` and
   **don't** locale-prefix it. (If you ever move the route out of `/api`, you'd
   have to add an explicit exclusion.)

2. **The webhook is unauthenticated by Supabase** — ACLEDA isn't logged in.
   Security comes from **verifying the HMAC signature** on the callback, not from
   `auth()`. Do not call `auth()` in the callback route.

3. **Idempotency.** ACLEDA may send the callback more than once, and the user may
   also hit the success page. Key all "grant value" logic on `txid` and make it a
   no-op if `status` is already `paid`. Use a unique constraint on `txid`.

4. **Verify server-side, always.** The browser redirect to `/payment/success` is
   UX only. Flip entitlement **only** from the callback or an explicit
   `getTxnStatus` check (see [02](./02-api-integration.md) Step 4).

5. **Amount units.** Confirm whether `amount` is major (USD `1.50`) or minor
   (cents / riel) units before computing hashes or storing — getting this wrong
   silently over/undercharges.

6. **Replacing the stub.** Once `payments`/`subscriptions` exist, rewrite
   `getUserSubscription()` in [db/queries.ts](../../db/queries.ts) to read real
   entitlement instead of returning `{ isActive: true }`. Audit every caller
   (gameplay actions in `actions/`, hearts logic, `constants.ts`) so the change
   from "always Pro" to "real Pro" doesn't break free-tier UX.

7. **Locale-prefixed return URLs.** `successUrlToReturn` / `errorUrlToReturn` are
   user-facing pages → they must be locale-prefixed: `/${locale}/payment/success`.
   The **callback** URL is the API route and is **not** locale-prefixed.

## Environment variables to add

Add to `.env.example` and the deployment env (all server-only — no `NEXT_PUBLIC_`):

```bash
TOANCHET_MERCHANT_ID=
TOANCHET_MERCHANT_NAME=          # the {MERCHANTNAME} path segment
TOANCHET_LOGIN_ID=
TOANCHET_PASSWORD=
TOANCHET_SECRET_KEY=             # HMAC-SHA512 shared secret
TOANCHET_BASE_URL=https://epaymentuat.acledabank.com.kh   # swap for prod at launch
TOANCHET_CURRENCY=USD
```

## Build order (suggested)

1. Get a **UAT merchant** + the **API Spec** from ACLEDA (resolve the open
   questions in [02](./02-api-integration.md) first — especially callback payload
   + signature, and amount units).
2. `lib/toanchet.ts` — `signToanchet`, `openSessionV2`, `getTxnStatus` (pure,
   unit-testable against the spec).
3. `payments` table → `db:push`.
4. `actions/payment.ts` + the buy button UI.
5. Callback route + `proxy.ts` matcher exclusion + idempotent grant.
6. Test end-to-end in **UAT** (virtual merchant) with KHQR.
7. Swap `getUserSubscription()` off the stub; audit free-vs-paid UX.
8. Switch `TOANCHET_BASE_URL` to production, re-test, launch.

> Because this touches money, build it behind UAT first and keep the production
> switch as a single env change. Treat the callback as the only trusted signal.
