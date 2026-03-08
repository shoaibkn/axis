This project is a Next.js + Convex app for Axis (task and approvals management).

## Setup

1. Install dependencies.

```bash
bun install
```

2. Run Convex locally.

```bash
npx convex dev
```

3. Set required Convex deployment environment values.

```bash
npx convex env set BETTER_AUTH_SECRET "<generate-a-random-secret>"
npx convex env set SITE_URL "http://localhost:3000"
npx convex env set RESEND_API_KEY "<your-resend-api-key>"
npx convex env set RESEND_TEST_MODE "true"
npx convex env set RESEND_FROM_EMAIL "Axis <onboarding@resend.dev>"
npx convex env set R2_ACCOUNT_ID "<cloudflare-account-id>"
npx convex env set R2_ACCESS_KEY_ID "<r2-access-key-id>"
npx convex env set R2_SECRET_ACCESS_KEY "<r2-secret-access-key>"
npx convex env set R2_BUCKET "<r2-bucket-name>"
npx convex env set R2_PUBLIC_BASE_URL "https://<public-domain-or-r2-dev-url>"
```

4. Add local frontend env values to `.env.local`.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Getting Started

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

Core flow currently implemented:

- Better Auth email/password auth with verification and reset password
- Organization onboarding with plan metadata
- Department creation
- Team invitations via Resend with 7 day expiry links
- Settings tabs for organization, users, and departments
- Cloudflare R2 integration for organization image uploads
