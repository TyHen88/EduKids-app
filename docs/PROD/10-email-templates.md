# 10 · Email Templates (Clerk)

Branded **EduKids** (cosmic / indigo) versions of Clerk's transactional emails. They use Clerk's `<re-*>` markup and keep every Clerk variable (`{{otp_code}}`, `{{app.name}}`, `{{requested_from}}`, `{{requested_at}}`, `{{current_year}}`, `{{> app_logo}}`) so you can paste them in as-is.

## Where to set them in Clerk

**Clerk Dashboard → Customize → Emails** → pick a template → switch the editor to **HTML / markup** mode → replace the contents → **Save**. Send yourself a test.

This app sends two code emails:
- **Verification code** — sign-up email verification.
- **Reset password code** — forgot-password flow.

(Customize the others — Invitation, Magic link, etc. — the same way if you enable them.)

## Brand tokens used

| Token | Value |
|-------|-------|
| Primary (indigo-600) | `#4f46e5` |
| Indigo-50 (code box) | `#eef2ff` |
| Ink (headings) | `#111827` |
| Muted text | `#64748b` / `#94a3b8` |
| Page background | `#f8fafc` |
| Divider | `#e2e8f0` |

> **Logo:** the header uses a text logo (`🚀 {{app.name}}`) so it always renders. After you upload a brand logo in **Clerk → Customize → Branding**, you can swap the header `<re-text>` for `{{> app_logo}}`.

---

## Template 1 — Verification code

```html
<re-html>
<re-head>
    <re-title>{{otp_code}} is your {{app.name}} verification code</re-title>
</re-head>
<re-body background-color="#f8fafc" padding="40px 16px 40px 16px">
    <re-preheader>
        Your {{app.name}} verification code is {{otp_code}}
    </re-preheader>

    <re-main background-color="#ffffff" border-radius="24px">
        <re-header padding="32px 32px 0px 32px">
            <re-text font-size="22px" font-weight="bold" line-height="28px" color="#4f46e5" align="center">
                🚀 {{app.name}}
            </re-text>
        </re-header>

        <re-block align="center" padding="24px 32px 40px 32px" background-color="#ffffff">
            <re-heading level="h1" align="center" color="#111827" font-size="24px" line-height="32px" margin="0">
                Blast off! Here's your code
            </re-heading>

            <re-text margin="16px 0px 0px 0px" align="center" font-size="15px" line-height="22px" color="#64748b">
                Enter this verification code to launch into your {{app.name}} adventure:
            </re-text>

            <re-block background-color="#eef2ff" border-radius="16px" padding="20px 24px 20px 24px" margin="24px 0px 24px 0px" align="center">
                <re-text font-size="40px" font-weight="bold" line-height="44px" color="#4f46e5" align="center" margin="0">
                    {{otp_code}}
                </re-text>
            </re-block>

            <re-text margin="0px 0px 0px 0px" align="center" font-size="13px" line-height="20px" color="#94a3b8">
                This code expires soon. To keep your account safe, never share it with anyone.
            </re-text>

            <re-divider background-color="#e2e8f0" height="1px"></re-divider>

            <re-text margin="24px 0px 0px 0px" align="center" color="#94a3b8" font-size="13px">
                <b>Didn't request this?</b>
            </re-text>
            <re-text font-size="13px" align="center" margin="4px 0px 0px 0px" color="#94a3b8">
                This code was requested from <b>{{requested_from}}</b> at <b>{{requested_at}}</b>. If this wasn't you, you can safely ignore this email.
            </re-text>
        </re-block>
    </re-main>

    <re-footer padding="24px 32px 32px 32px">
        <re-text align="center" font-size="12px" color="#94a3b8" margin="0">
            © {{current_year}} {{app.name}} · Learn among the stars 🌟
        </re-text>
    </re-footer>
</re-body>
</re-html>
```

---

## Template 2 — Reset password code

```html
<re-html>
<re-head>
    <re-title>{{otp_code}} is your {{app.name}} password reset code</re-title>
</re-head>
<re-body background-color="#f8fafc" padding="40px 16px 40px 16px">
    <re-preheader>
        Your {{app.name}} password reset code is {{otp_code}}
    </re-preheader>

    <re-main background-color="#ffffff" border-radius="24px">
        <re-header padding="32px 32px 0px 32px">
            <re-text font-size="22px" font-weight="bold" line-height="28px" color="#4f46e5" align="center">
                🚀 {{app.name}}
            </re-text>
        </re-header>

        <re-block align="center" padding="24px 32px 40px 32px" background-color="#ffffff">
            <re-heading level="h1" align="center" color="#111827" font-size="24px" line-height="32px" margin="0">
                Reset your password 🔑
            </re-heading>

            <re-text margin="16px 0px 0px 0px" align="center" font-size="15px" line-height="22px" color="#64748b">
                Use this code to set a new password for your {{app.name}} account:
            </re-text>

            <re-block background-color="#eef2ff" border-radius="16px" padding="20px 24px 20px 24px" margin="24px 0px 24px 0px" align="center">
                <re-text font-size="40px" font-weight="bold" line-height="44px" color="#4f46e5" align="center" margin="0">
                    {{otp_code}}
                </re-text>
            </re-block>

            <re-text margin="0px 0px 0px 0px" align="center" font-size="13px" line-height="20px" color="#94a3b8">
                This code expires soon. For your security, never share it with anyone.
            </re-text>

            <re-divider background-color="#e2e8f0" height="1px"></re-divider>

            <re-text margin="24px 0px 0px 0px" align="center" color="#94a3b8" font-size="13px">
                <b>Didn't request a reset?</b>
            </re-text>
            <re-text font-size="13px" align="center" margin="4px 0px 0px 0px" color="#94a3b8">
                This request came from <b>{{requested_from}}</b> at <b>{{requested_at}}</b>. If this wasn't you, your password is still safe — just ignore this email.
            </re-text>
        </re-block>
    </re-main>

    <re-footer padding="24px 32px 32px 32px">
        <re-text align="center" font-size="12px" color="#94a3b8" margin="0">
            © {{current_year}} {{app.name}} · Learn among the stars 🌟
        </re-text>
    </re-footer>
</re-body>
</re-html>
```

---

## Notes & compatibility

- **Subject line:** in Clerk, the subject is a separate field on the template — set it to something like `{{otp_code}} is your {{app.name}} verification code` (it isn't taken from `<re-title>`).
- **Nested `<re-block>`:** the indigo code box is a `<re-block>` nested inside the content block. Clerk's editor supports this; if your editor rejects it, remove the inner `<re-block …>`/`</re-block>` wrapper and keep just the big `<re-text>{{otp_code}}</re-text>` (you lose the colored box but the code still stands out).
- **Variables are case/spelling-sensitive** — don't rename `{{otp_code}}`, `{{requested_from}}`, etc.
- **Keep it parent-readable:** kids' accounts often use a parent's inbox, so the copy stays warm but clear about security.
- **Test rendering** across Gmail / Apple Mail / Outlook via Clerk's "Send test" before launch.
- Update `{{app.name}}` by setting the **Application name** in Clerk → Settings (so it shows "EduKids" everywhere).
