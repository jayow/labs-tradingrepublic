# Auth email templates

## 1. Brand the invite email (the body)

1. Supabase dashboard → **Authentication → Email Templates → "Invite user"**.
2. **Subject:** `You're invited to write for Trading Republic Labs`
3. **Message body:** paste the contents of [`invite.html`](invite.html).
4. Save. Send yourself a test invite from `/admin/authors` to preview it.

The invite link (`{{ .ConfirmationURL }}`) is already wired to land on our own
branded `/accept-invite` page, so the whole flow is on-brand after this.

## 2. Make it come "from Trading Republic Labs" (custom SMTP)

The built-in Supabase sender can't be renamed and is rate-limited (~a few/hour,
testing only). To send from your domain with a "Trading Republic Labs" name,
configure custom SMTP. Example with **Resend** (free tier is plenty for a team):

1. Create a Resend account → **Domains → Add** `tradingrepublic.io`.
2. Add the **DNS records** Resend shows (SPF + DKIM, a few `TXT`/`CNAME` records)
   at your DNS provider for `tradingrepublic.io`. Wait for "Verified".
3. Resend → **API Keys** → create one (this is your SMTP password).
4. Supabase dashboard → **Authentication → Emails → SMTP Settings → Enable custom SMTP:**
   - **Sender name:** `Trading Republic Labs`
   - **Sender email:** `noreply@tradingrepublic.io` (or `labs@tradingrepublic.io`)
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** your Resend API key
5. Save. Now invites send from `Trading Republic Labs <noreply@tradingrepublic.io>`,
   un-throttled, with good deliverability.

> Until custom SMTP is set up, invites still work but arrive from Supabase's
> address and are rate-limited — fine for testing, not for launch.
