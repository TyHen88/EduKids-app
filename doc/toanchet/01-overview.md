# 01 — Toanchet Pay Overview

## What it is

**ACLEDA Toanchet Pay** (ទាន់ចិត្ត, "Toanchet") is ACLEDA Bank's merchant
payment / e‑commerce acquiring platform. It lets a registered business accept
payments across multiple channels and gives merchants a portal for transaction
reporting, refunds, and downloadable settlement reports.

It is ACLEDA's equivalent of ABA PayWay — a bank-operated payment gateway for
Cambodian merchants, with KHQR (Bakong) at its core plus card acquiring and
cross-border QR.

## Payment methods supported

| Method | Notes |
|--------|-------|
| **KHQR** | Cambodia's national QR standard (Bakong-interoperable). Primary method. |
| **Cross-border QR** | PromptPay (Thailand), VietQR (Vietnam), LAPNet, DuitNow (Malaysia), JPQR (Japan), Roam QR, **WeChat Pay** |
| **Cards (MPGS)** | Mastercard Payment Gateway Services — Visa, Mastercard, JCB, UnionPay, Amex, Diners, Discover. Domestic & international. |
| **POS terminals** | Card + KHQR/QR push & pull |
| **Payment links** | Hosted link generation |
| **Direct debit / account-wallet** | Pull from an ACLEDA account/wallet |

## Who can use it

- **Business partners / merchants** — register to accept payments (full features).
- **General customers** — can use basic functions without registration.
- Both **domestic and international** card processing.

## Merchant onboarding

- Register as a partner via the **AC Super App** or an ACLEDA branch.
- A **virtual merchant for testing (UAT)** can be self-created for development.
- Manage everything (transactions, refunds, reports) through the merchant **Portal**.

The public pages do **not** list fees (MDR), settlement timing, or required
onboarding documents — request these directly from ACLEDA.

## Merchant portal capabilities

- Summary + per-transaction sales detail
- **Refunds** — full or partial
- Downloadable reports (annual / monthly / daily)
- Real-time exchange rates

## Environments & URLs

| Purpose | URL |
|---------|-----|
| Developer docs (API Spec, Plugins, Sandbox, Demo flow) | `https://toanchetpay.acledabank.com.kh/toanchetpay` |
| **UAT** connector base | `https://epaymentuat.acledabank.com.kh/{MERCHANTNAME}/...` |
| **UAT** merchant portal | `https://epaymentuat.acledabank.com.kh:8443/acledaMerchant` |
| **Production** merchant portal | `https://epaymentportal.acledabank.com.kh/acledaMerchant` |
| Product page | `https://www.acledabank.com.kh/kh/eng/ps_toanchetpay` |

> `{MERCHANTNAME}` is a per-merchant path segment assigned to you at onboarding;
> it appears in every connector URL.

## Developer resources advertised

- **API Spec** documentation (gated PDF)
- **Plugins** for e-commerce platforms (distributed to registered merchants — no
  public GitHub repo or WordPress-directory listing was found)
- **Sandbox** + **Demo payment flow** walkthrough
- Self-service **UAT virtual merchant** creation

## Contacts

| Need | Contact |
|------|---------|
| Technical / API integration | **onlinebanking@acledabank.com.kh** |
| General / merchant onboarding | **inquiry@acledabank.com.kh** · +855 (0)15 800 182 · 015 700 111 · 015 800 444 |

## Sources

- [ACLEDA Toanchet Pay — product page](https://www.acledabank.com.kh/kh/eng/ps_toanchetpay)
- [Toanchet Pay — API Integration (Introduction)](https://toanchetpay.acledabank.com.kh/toanchetpay/api-integration)
- [Toanchet Pay — KHQR Integration](https://toanchetpay.acledabank.com.kh/toanchetpay/khqr-integration)
- [Toanchet Pay — MPGS / Card Integration](https://toanchetpay.acledabank.com.kh/toanchetpay/mpgs-integration)
- [Toanchet Pay — Sandbox](https://toanchetpay.acledabank.com.kh/toanchetpay/sandbox)
- [Bakong KHQR Payment Integration spec (NBC) — background on the QR standard](https://bakong.nbc.gov.kh/download/KHQR/integration/QR%20Payment%20Integration.pdf)

> Docs are SPA/login-gated; treat exact field lists as "confirm against the official API Spec."
