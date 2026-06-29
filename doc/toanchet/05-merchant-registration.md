# 05 — Merchant Registration & End-to-End Integration (from scratch)

The full path from "no account" to "EduKids accepts real KHQR payments." Start
here if you're beginning the integration.

Apply form: <https://toanchetpay.acledabank.com.kh/toanchetpay/apply>

---

## Which Merchant Type to choose? → **eCommerce Merchant** ✅

The apply form's **Business Type** step offers three options (radio boxes
`khqrMerchantBox`, `posMerchantBox`, `eCommerceMerchantBox`):

| Type | What it's for | API integration? | Right for EduKids? |
|------|---------------|------------------|--------------------|
| **KHQR Merchant** | Accept payments via a KHQR code (static/dynamic) shown in the ACLEDA merchant app or printed. Cashier-style, no developer integration. | ❌ No API | ❌ No |
| **POS Merchant** | A physical POS terminal/device for in-store card + QR payments. | ❌ No (hardware) | ❌ No |
| **eCommerce Merchant** | Online payment acceptance **integrated into your website/app via the API** (the XPAY Connector — `openSessionV2`, KHQR String, card/MPGS, callbacks). | ✅ **Yes** | ✅ **Yes** |

**Choose `eCommerce Merchant`.** EduKids is an online app that needs to generate
KHQR in-app and confirm payments programmatically — that capability (the API
credentials + **shared secret key** + sandbox we've been testing) is granted
**only** to the eCommerce merchant type. KHQR/POS types do not give you the
`merchantID` + secret + connector endpoints.

> If you also ever want to take payments face-to-face (e.g. an event), you can
> additionally register a KHQR or POS merchant later — but for the app
> integration, eCommerce is the one.

---

## Step 1 — Apply (online form)

Go to the [apply page](https://toanchetpay.acledabank.com.kh/toanchetpay/apply)
and fill in:

| Field | Notes |
|-------|-------|
| Full name | Contact person |
| Gender | — |
| Phone number | Reachable number (ACLEDA calls to verify) |
| Email address | Use a monitored inbox — credentials/updates come here |
| Business Name | Your store/app name (e.g. "EduKids") |
| **Business Type** | **Select eCommerce Merchant** |
| Description | Up to 1000 chars — describe the app: *"Online learning app for kids; selling course access / Pro subscriptions; need KHQR + API integration."* |

Submit. This is an **enquiry/application** — it starts the onboarding, it does
not instantly provision an account.

## Step 2 — ACLEDA onboarding (offline)

ACLEDA's merchant team follows up to complete KYC/merchant setup. Expect to
provide (confirm the exact list with them — the web form doesn't publish it):

- Business registration / company documents (or sole-proprietor details)
- Owner/authorized-person ID (national ID or passport)
- An **ACLEDA settlement account** (where payments are paid out)
- Bank/merchant agreement signing (fees/MDR are defined here)

You can also register/track via the **AC Super App** (per the product page).

## Step 3 — Receive your credentials 🔑

On approval, ACLEDA issues your **merchant integration pack**. Make sure you get
**all** of these (the last one is the piece we're currently missing):

| Credential | Used for | Env var |
|------------|----------|---------|
| Merchant name (path segment) | URL `/{MERCHANTNAME}/...` | `TOANCHET_MERCHANT_NAME` |
| `loginId` | Connector login | `TOANCHET_LOGIN_ID` |
| `password` | Connector password | `TOANCHET_PASSWORD` |
| `merchantID` | Merchant identifier | `TOANCHET_MERCHANT_ID` |
| **Shared secret key** | **Compute the `hash`** | `TOANCHET_SECRET` |
| API Spec PDF | Exact hash recipe, callback format, status check | — |

> 🚩 **Explicitly ask for the "shared secret key" and the hash recipe.** Without
> it you cannot sign requests — see [04-sandbox-test.md](./04-sandbox-test.md).
> The whole flow is otherwise built and proven; this is the one blocker.

## Step 4 — Sandbox test (UAT)

Validate the integration against UAT **before** touching production:

1. Put the **sandbox** values in `.env` (defaults already point at the public
   UAT sandbox — see `.env.example`), set `TOANCHET_SECRET` to the sandbox key.
2. Run the app and open **`/km/payment-test`**.
   - **Sample (known-good)** → renders a live KHQR immediately (proves the endpoint).
   - **Generate** → with the real secret, mints a fresh KHQR for any amount.
3. Or use the CLI harness: `npx tsx scripts/toanchet-sandbox.ts`.
4. Confirm `lib/toanchet.ts → computeHash` matches ACLEDA's recipe (verify your
   hash reproduces their sample exactly).

Details: [04-sandbox-test.md](./04-sandbox-test.md) · [02-api-integration.md](./02-api-integration.md).

## Step 5 — Build the EduKids payment flow

Wire it into the app (server action + callback route + DB), replacing the
stubbed `getUserSubscription()`. Full design: [03-edukids-integration-plan.md](./03-edukids-integration-plan.md).

Minimum to go live:
1. `lib/toanchet.ts` — signing + `openSessionV2` (done; finalize `computeHash`).
2. A **purchase** server action that creates a `payments` row + returns the QR.
3. A **callback** route (`app/api/payments/toanchet/callback/route.ts`) that
   verifies the bank's signature and marks the payment paid (idempotent on `txid`).
4. A **status-check** (`getTxnStatus`) as the source of truth.
5. Grant entitlement (Pro / course unlock) only after confirmation.

## Step 6 — Go to production

1. Get **production** credentials + secret (separate from sandbox).
2. Set env: `TOANCHET_BASE_URL=https://epayment...` (prod host — confirm),
   `TOANCHET_MERCHANT_NAME`, `TOANCHET_*`, `TOANCHET_SECRET` to **prod** values.
3. Register the production **callback URL** with ACLEDA.
4. Do one small real transaction, confirm settlement in the
   [merchant portal](https://epaymentportal.acledabank.com.kh/acledaMerchant),
   then enable for users.

---

## At-a-glance checklist

- [ ] Apply as **eCommerce Merchant** at the apply URL
- [ ] Complete ACLEDA KYC + sign merchant agreement (note the fees/MDR)
- [ ] Receive: merchant name, `loginId`, `password`, `merchantID`, **secret key**, API Spec
- [ ] Confirm the **hash recipe** reproduces ACLEDA's sample hash
- [ ] Pass UAT on `/km/payment-test` (Sample + Generate)
- [ ] Build purchase action + callback route + status check (replace the subscription stub)
- [ ] Switch to production creds + callback URL, verify a live payment, launch

> Contacts: technical **onlinebanking@acledabank.com.kh**; general
> **inquiry@acledabank.com.kh** · +855 23 998 777 · +855 23 430 999 ·
> +855 (0)15 800 182.
