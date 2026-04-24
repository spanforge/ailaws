# Email Setup

This project already supports real email sending for:

- account verification emails
- workspace creation confirmation emails
- workspace invite emails
- regulatory alert emails

Email delivery uses Resend. The `RESEND_API_KEY` is required for real sending, but this document focuses on the URL and sender values you asked about.

## Required URL

### `NEXTAUTH_URL`

Set this to the full public base URL where users will access the app.

Examples:

- local development: `http://localhost:3000`
- production subdomain: `https://compass.yourdomain.com`
- production root domain: `https://yourdomain.com`

This value is used for:

- email verification links
- workspace invite links
- join links such as `/join?token=...`
- auth redirect and callback handling

### Local development example

```env
NEXTAUTH_URL=http://localhost:3000
```

### Production example

```env
NEXTAUTH_URL=https://compass.yourdomain.com
```

## Sender Email Values

These are not URLs. They are verified sender email identities used by Resend.

### Minimum sender value

```env
AUTH_VERIFICATION_FROM_EMAIL=Spanforge Compass <auth@yourdomain.com>
```

This is enough to start because other mail flows can fall back to it.

### Optional recommended sender values

```env
AUTH_WORKSPACE_FROM_EMAIL=Spanforge Compass <workspace@yourdomain.com>
AUTH_ALERTS_FROM_EMAIL=Spanforge Compass Alerts <alerts@yourdomain.com>
```

Behavior:

- workspace emails fall back to `AUTH_VERIFICATION_FROM_EMAIL` if `AUTH_WORKSPACE_FROM_EMAIL` is not set
- alert emails fall back to `AUTH_VERIFICATION_FROM_EMAIL` if `AUTH_ALERTS_FROM_EMAIL` is not set

## Minimal Working Configuration

For a minimal setup, these are the key values:

```env
NEXTAUTH_URL=http://localhost:3000
AUTH_VERIFICATION_FROM_EMAIL=Spanforge Compass <auth@yourdomain.com>
```

You will also need:

```env
RESEND_API_KEY=your_resend_api_key
```

## Recommended Full Configuration

```env
NEXTAUTH_URL=https://compass.yourcompany.com
AUTH_VERIFICATION_FROM_EMAIL=Spanforge Compass <auth@yourcompany.com>
AUTH_WORKSPACE_FROM_EMAIL=Spanforge Compass <workspace@yourcompany.com>
AUTH_ALERTS_FROM_EMAIL=Spanforge Compass Alerts <alerts@yourcompany.com>
RESEND_API_KEY=your_resend_api_key
```

## Important Notes

- In local development, keep `NEXTAUTH_URL` as `http://localhost:3000`
- In production, `NEXTAUTH_URL` must be the exact public HTTPS URL users open in the browser
- The sender email addresses must be verified in Resend before real mail will send
- If `NEXTAUTH_URL` is wrong, verification and invite links will point to the wrong place

## Current Email Flows In This Repo

- account verification: handled from `app/api/auth/register/route.ts`
- resend verification: handled from `app/api/auth/resend-verification/route.ts`
- workspace created email: handled from `app/api/organizations/route.ts`
- workspace invite email: handled from `app/api/organizations/[id]/invites/route.ts`
- invite acceptance link target: `app/join/page.tsx`

## Suggested Local `.env.local`

```env
NEXTAUTH_URL=http://localhost:3000
AUTH_VERIFICATION_FROM_EMAIL=Spanforge Compass <auth@yourdomain.com>
AUTH_WORKSPACE_FROM_EMAIL=Spanforge Compass <workspace@yourdomain.com>
AUTH_ALERTS_FROM_EMAIL=Spanforge Compass Alerts <alerts@yourdomain.com>
RESEND_API_KEY=your_resend_api_key
```