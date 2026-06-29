# ACLEDA Toanchet Pay — Integration Guide

Research notes and an integration plan for accepting payments in **EduKids** via
**ACLEDA Bank's Toanchet Pay** (ទាន់ចិត្ត) merchant payment platform.

> [!IMPORTANT]
> **Verify before you build.** ACLEDA's developer docs are a login/SPA-gated portal,
> and the authoritative **API Spec** (PDF) + sample code are released only to a
> registered (UAT) merchant. The flows here were reconstructed from the public
> portal pages and are accurate at the level of *shape and order*, but exact field
> names, the callback payload, and the callback-signature scheme **must be
> confirmed against the official API Spec** before going live. Sources are listed
> at the bottom of [01-overview.md](./01-overview.md).

Read in order — files are numbered. **Starting from scratch? Begin with [05](./05-merchant-registration.md)** (register the merchant), then come back to 01–04 for the technical detail.

| # | File | What it covers |
|---|------|----------------|
| — | [README.md](./README.md) | This index |
| 05 | [05-merchant-registration.md](./05-merchant-registration.md) | **START HERE** — register the merchant (choose **eCommerce Merchant**), onboarding, credentials, and the full from-scratch checklist to production |
| 01 | [01-overview.md](./01-overview.md) | What Toanchet Pay is, payment methods, onboarding, environments, sources |
| 02 | [02-api-integration.md](./02-api-integration.md) | Technical flow: HMAC auth, `openSessionV2`, hosted payment page, KHQR, MPGS/card, `getTxnStatus`, callback |
| 03 | [03-edukids-integration-plan.md](./03-edukids-integration-plan.md) | How it slots into this Next.js 16 / Supabase / Drizzle app — server action, callback route, schema, env vars |
| 04 | [04-sandbox-test.md](./04-sandbox-test.md) | **Runnable** sandbox harness ([`scripts/toanchet-sandbox.ts`](../../scripts/toanchet-sandbox.ts)) + empirical findings from probing the live UAT endpoint |

## TL;DR

- **Model:** XPAY Connector + **redirect to an ACLEDA‑hosted payment page** (`paymentPage.jsp`). Not a modern REST+JSON+Bearer API.
- **Auth:** `HMAC‑SHA512( merchantID + loginId + password + txid , sharedSecretKey )` → uppercase HEX. **Server-only secrets.**
- **Methods worth using for EduKids:** **KHQR** (`operationType = 3`) first; **card/MPGS** (`operationType = 1`) optional.
- **Confirm the result server-side** with `getTxnStatus` + the async **callback** — never trust the browser redirect alone.
- **Onboarding / docs access:** email **onlinebanking@acledabank.com.kh** (technical) or **inquiry@acledabank.com.kh** to request a merchant account + full API Spec + UAT credentials.

## Status

- 🔬 **Research + a live sandbox harness.** [`scripts/toanchet-sandbox.ts`](../../scripts/toanchet-sandbox.ts) really calls the UAT `openSessionV2` endpoint. See [04](./04-sandbox-test.md) for results.
- ✅ **Confirmed by testing:** endpoint URL, JSON content-type (form-encoding → 415), request body shape, response envelope, and the merchant path is **`XPAYTEST2024`** (uppercase loginId).
- ⛔ **Blocked on ACLEDA:** every request to the matched merchant returns a generic `-99 "Please contact bank!"` (even an empty body), so we need the **shared secret key** (and/or sandbox-merchant activation) before a session can open. See [04](./04-sandbox-test.md#what-to-ask-acleda).
- 🧱 [03](./03-edukids-integration-plan.md) (app wiring) is still a proposed design — don't build it until the sandbox returns a real `sessionId`.
- ⚠️ Billing in EduKids is currently **stubbed** (`getUserSubscription()` always returns `isActive: true`). This integration is the path to replace that with real payments.
