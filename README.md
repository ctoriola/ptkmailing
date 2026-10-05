# PTK Mailing

Mailing dashboard for Primetek SSC staff (`mailing.primetekssc.ng`). Add customer email addresses, attach files for each one, and write a default email with `{{placeholders}}`, plus optional custom emails per recipient. Then send them all at once.

Built with Next.js, deployed on Vercel. Uses [Resend](https://resend.com) for sending and Vercel Blob for attachment uploads.

## Features
- Sign in by magic link, limited to `@primetekssc.ng` addresses (no database needed)
- Default subject and body with placeholders (`{{name}}`, `{{company}}`, any custom field, `{{email}}`)
- Per-recipient files and an optional per-recipient custom email
- Bulk import of recipients from CSV
- Preview for each recipient, with warnings for missing values
- Results for each recipient after sending; failed ones stay in the list so you can retry
- The unsent draft is saved in the browser

## Local development
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

## Deploying to Vercel with mailing.primetekssc.ng
1. Import this repo into Vercel.
2. **Storage → Create → Blob**, then connect it to the project. This adds `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY` (older stores add `BLOB_READ_WRITE_TOKEN` instead; both work). Uploads default to a private store; if yours is public, set `NEXT_PUBLIC_BLOB_ACCESS=public`.
3. Set the env vars from `.env.example` (`RESEND_API_KEY`, `MAIL_FROM`, `AUTH_SECRET`, `ALLOWED_EMAIL_DOMAIN`).
4. **Settings → Domains → Add** `mailing.primetekssc.ng`. At your DNS provider, add a CNAME: `mailing` → `cname.vercel-dns.com`.
5. In Resend, add the domain `primetekssc.ng` and create the SPF/DKIM DNS records it lists. A DMARC record is recommended too. Without these, mail will land in spam.

## Limits
- Each file can be up to 25 MB, and Resend allows about 40 MB per email in total.
- Sends are paced at about 2 per second to stay under Resend's default rate limit, and a send request can run for up to 60 seconds. Keep each batch to about 100 recipients (or raise `maxDuration` in `app/api/send/route.ts` on a paid Vercel plan).
- After an email is sent, its attachment files are deleted from Blob storage.

## Troubleshooting
- Errors appear in the app with a hint and a short **Reference** code. Search for that code in Vercel → Project → **Logs** to find the full server error.
- Open `/api/auth/health` to see which required environment variables are set. It shows only true/false, never the values. After changing env vars in Vercel, redeploy.
