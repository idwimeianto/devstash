# Auth Security Review

**Last audit:** 2026-11-02
**Scope:** NextAuth config and proxy (`src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`), `src/app/api/auth/**` (NextAuth handler, `register`, `verify-email`), `src/actions/auth.ts`, `src/actions/profile.ts`, `src/lib/password.ts`, `src/lib/validations/auth.ts`, `src/lib/email.ts`, `src/lib/email-verification.ts`, `src/lib/app-url.ts`, `src/lib/db/users.ts`, `src/lib/db/verification-tokens.ts`, `src/app/(auth)/**`, `src/components/auth/**`, `src/app/profile/**`, `src/components/profile/**`, `src/components/dashboard/SidebarUser.tsx`, `src/emails/**`, `prisma/schema.prisma`, plus `context/current-feature.md` for deferred items.

## Summary

| Severity | Count |
| -------- | ----- |
| 🔴 Critical | 0 |
| 🟠 High | 1 |
| 🟡 Medium | 4 |
| 🔵 Low | 2 |

## Findings

### 🔴 Critical

None found.

### 🟠 High

#### 1. No rate limiting on any auth endpoint **(Known / Deferred)**

- **File:** `src/auth.ts:17` (`authorize`), `src/actions/auth.ts:49` (`signInWithCredentials`), `src/actions/auth.ts:95` (`requestPasswordReset`), `src/actions/auth.ts:131` (`resetPassword`), `src/actions/profile.ts:16` (`changePassword`), `src/app/api/auth/register/route.ts:11`
- **Issue:** A search of the repo finds no throttling, lockout or CAPTCHA anywhere. Sign-in, register, forgot password, reset password and change password can be called without limit. The history in `context/current-feature.md` lists rate limiting as deferred.
- **Attack scenario:**
  - An attacker runs a password-guessing or credential-stuffing list against `/sign-in`. Every attempt gets the same "Invalid email or password." response, so nothing slows them down.
  - A hijacked session can brute-force the current password through `changePassword`.
  - The attacker posts to `/api/auth/register` or `requestPasswordReset` in a loop to flood a victim's inbox. Each call sends a Resend email, which also burns the sending quota and reputation.
  - Each request runs bcrypt at cost 12, so floods are also a CPU cost. `resetPassword` hashes the new password before it checks the token (`src/actions/auth.ts:151`).
- **Fix:** Add per-IP and per-email limits, for example Upstash Ratelimit or a small table in Postgres. Suggested limits: sign-in 5 per 15 minutes per email+IP, forgot password 3 per hour per email, register 5 per hour per IP. Check the reset token before calling `hashPassword`.

### 🟡 Medium

#### 1. Account enumeration through the register endpoint

- **File:** `src/app/api/auth/register/route.ts:28-33`
- **Issue:**
  ```ts
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists" },
      { status: 409 },
    );
  }
  ```
  An unknown email returns 201 and a known email returns 409 with an explicit message. This is not listed in the deferred items. The forgot-password flow was built to avoid this leak, but register undoes it.
- **Attack scenario:** An attacker posts any email to `/api/auth/register` with a valid dummy password and learns whether that person has a DevStash account. They can use this for targeted phishing or credential stuffing. Without rate limiting they can do it at scale. Each unknown email they test also creates a real unverified user and sends an email.
- **Fix:** If you accept this trade-off, document it. The stricter option is to return the same "check your email" response for existing emails and send a "you already have an account" email instead. That needs a code change in the route and in `RegisterForm`.

#### 2. Timing differences reveal registered emails **(Known / Deferred)**

- **File:** `src/auth.ts:33`, `src/actions/auth.ts:116-122`
- **Issue:**
  - `authorize` returns right away when the user or password is missing (`if (!user?.password) return null;`). bcrypt only runs for existing password users, at about 250 ms for cost 12.
  - `requestPasswordReset` only creates a token and sends an email for existing password users, so its responses are slower for registered emails.
  - The history file records "constant-time responses" as deferred.
- **Attack scenario:** An attacker measures response times on `/sign-in` or `/forgot-password` and finds which emails are registered, even though the messages are identical.
- **Fix:** On `authorize`, run `verifyPassword` against a fixed dummy bcrypt hash when the user is not found. On forgot-password, do the token and email work after the response, for example with `after()` from `next/server`.

#### 3. Existing JWT sessions survive password reset, password change and account deletion **(Known / Deferred)**

- **File:** `src/lib/db/verification-tokens.ts:118-137`, `src/actions/profile.ts:48-51`, `src/actions/profile.ts:83`
- **Issue:**
  - The sessions are stateless JWTs (`session: { strategy: "jwt" }`). `getSessionUserId()` trusts `token.id` without checking the database.
  - After a reset or change, only the password column is updated, and other JWTs stay valid until they expire (NextAuth default is 30 days).
  - `deleteAccount` signs out only the current browser.
  - Both gaps are listed as deferred in the history.
- **Attack scenario:** An attacker with a stolen session cookie (shared computer, malware) keeps access after the victim resets or changes the password. The attack works because the victim's cleanup does not remove the attacker's session.
- **Fix:** Add a `sessionVersion` (or `passwordChangedAt`) column to `User`. Put it in the JWT in the `jwt` callback and compare it on each request. A cheap check in the Node-runtime `auth.ts` `jwt` callback is enough, since the proxy only needs the cookie. Increase the value in `resetPasswordWithToken`, `changePassword` and `deleteAccount`. Also reduce `session.maxAge`.

#### 4. Every signed-in user sees the demo user's data on `/dashboard`

- **File:** `src/lib/db/users.ts:15-23`, used by `src/components/dashboard/{PinnedItems,RecentItems,RecentCollections,StatsCards,SidebarTypes,SidebarCollections}.tsx`
- **Issue:** `getCurrentUserId()` still resolves `demo@devstash.io` and ignores the session:
  ```ts
  // Temporary until Auth.js is in place: every request acts as the seeded demo user.
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL }, ... });
  ```
  The history file records that dashboard data still comes from the demo user, but it does not list this as a deferred security item.
- **Attack scenario:** Anyone can register, since email verification can be turned off and registration is open, and sign in. They then read all items and collections that belong to the demo account. Today those are seed data, so the impact is limited. If anyone stores real content under the demo account, or when real item features (create, edit) are added on top of this helper, this becomes cross-user read and write.
- **Fix:** Replace `getCurrentUserId()` with `getSessionUserId()` in these components before shipping any feature that writes data. Do not deploy the seed demo user to production.

### 🔵 Low

#### 1. Password length limit counts characters, but bcrypt truncates at 72 bytes

- **File:** `src/lib/validations/auth.ts:12-15`
- **Issue:** `.max(72, ...)` counts UTF-16 code units. bcryptjs 3.0.3 silently uses only the first 72 UTF-8 bytes (its own `truncates()` helper confirms this). A 72-character password with multi-byte characters is accepted but only partly used.
- **Attack scenario:** No direct bypass exists. A user with a long passphrase of non-ASCII characters gets less effective strength than they expect, because anything after byte 72 is ignored.
- **Fix:** Reject by byte length: `.refine((v) => new TextEncoder().encode(v).length <= 72, "Password must be at most 72 bytes")`. Alternatively, pre-hash with SHA-256 before bcrypt.

#### 2. Account deletion needs only a live session **(Known / Deferred)**

- **File:** `src/actions/profile.ts:60-85`, `src/components/profile/DeleteAccountDialog.tsx`
- **Issue:** `deleteAccount` has no password re-check, and the dialog has no typed confirmation. The history lists typed-email confirmation as deferred.
- **Attack scenario:** Someone with brief access to a signed-in browser, or a stolen session cookie, permanently deletes the account and all data in one click.
- **Fix:** For password users, require the current password (verify it in the action). For GitHub-only users, require typing the email.

## Needs Manual Verification

- **`AUTH_TRUST_HOST` / `AUTH_URL` in production:** NextAuth builds its redirect base URL from the request host when `trustHost` is on. The deployment platform is not in the repo, so I could not confirm that production pins `AUTH_URL` or is behind a proxy that sets the host. I did not report it as a finding.

## Passed Checks

- ✅ Password hashing uses bcryptjs at cost 12 on every write path: register, reset and change (`src/lib/password.ts`, `src/app/api/auth/register/route.ts`, `src/actions/auth.ts`, `src/actions/profile.ts`).
- ✅ Password comparison uses `bcrypt.compare` (`src/lib/password.ts`).
- ✅ The password hash is never sent to the client or returned by any API. `getUserProfile` strips it and returns only `hasPassword` (`src/lib/db/users.ts`). The register route selects only id, name and email. `authorize` returns a user object without the password.
- ✅ `authorize` validates input with Zod, rejects OAuth-only users without a password, and checks `emailVerified` only after the password is correct, so it does not reveal verification status to guessers (`src/auth.ts`).
- ✅ Email verification can't be turned off by accident. It stays on unless `EMAIL_VERIFICATION_ENABLED` is exactly `false` (`src/lib/email-verification.ts`).
- ✅ Tokens come from `crypto.randomBytes(32)` (256 bits). Only the SHA-256 hash is stored, and lookup is by hash (`src/lib/db/verification-tokens.ts`).
- ✅ Expiry is compared on use for both verification and reset tokens (24 hours and 1 hour). Expired tokens are deleted (`src/lib/db/verification-tokens.ts`).
- ✅ Older tokens are replaced when a new one is issued (`issueToken` deletes then creates in one transaction).
- ✅ Verification and reset tokens are separated by the `password-reset:` identifier prefix. `verifyEmailToken` excludes it, and `findPasswordResetRecord` requires it. Registered emails can't contain `:` under Zod's email check, so the prefix can't be spoofed (`src/lib/db/verification-tokens.ts`, `src/lib/validations/auth.ts`).
- ✅ Reset is single-use and atomic. The token is deleted first inside an interactive transaction, and `count === 0` stops a concurrent request. The password update is in the same transaction (`resetPasswordWithToken`).
- ✅ Forgot password gives the same response for known and unknown emails, and send errors are only logged (`src/actions/auth.ts`).
- ✅ New passwords use the same shared `newPassword` rule for register, reset and change (`src/lib/validations/auth.ts`).
- ✅ Email links use `APP_URL`, never the Host header, and production throws if it is unset (`src/lib/app-url.ts`).
- ✅ The link URL in emails is HTML-escaped, and no user-supplied text such as name is rendered into the templates (`src/emails/layout.ts`).
- ✅ No open redirect. `getRedirectTo` accepts only paths starting with `/` and rejects `//` and `/\`. NextAuth's redirect callback also prefixes the base URL. The proxy and profile page build their redirects from fixed or internal values (`src/actions/auth.ts`, `src/proxy.ts`, `src/app/profile/page.tsx`).
- ✅ Every action and route validates with Zod on the server: sign-in, forgot, reset, change, register (`src/actions/*.ts`, `src/app/api/auth/register/route.ts`).
- ✅ Profile actions take the user id from the session only (`getSessionUserId()`) and check the session themselves. No user id appears in form data or hidden fields (`src/actions/profile.ts`).
- ✅ Change password verifies the current password and handles OAuth-only users (`src/actions/profile.ts`).
- ✅ Delete account requires a session, removes the user (cascades to related data) and tokens in one transaction, and signs out the current browser (`src/actions/profile.ts`).
- ✅ The verify-email route redirects only to a fixed path on its own origin (`src/app/api/auth/verify-email/route.ts`).
- ✅ Registration rolls back the new user and its tokens when the verification email can't be sent (`src/app/api/auth/register/route.ts`).
- ✅ No `$queryRawUnsafe` or `$executeRawUnsafe` calls in application code, and no `dangerouslySetInnerHTML` in the audited files.
- ✅ GitHub account linking by email is not enabled (`allowDangerousEmailAccountLinking` is absent in `src/auth.config.ts`).
