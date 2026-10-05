import { escapeHtml } from "./template";

/** Public URL of the app, used for the logo image in emails. */
export function appUrl(req: Request) {
  return (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, "");
}

/**
 * Wrap a plain-text message in PrimeTEK SSC's branded email layout (logo header, footer).
 * Table-based with inline styles so it renders consistently in Gmail, Outlook and Apple Mail.
 */
export function brandedEmail({ text, baseUrl, preheader = "" }: { text: string; baseUrl: string; preheader?: string }) {
  const body = escapeHtml(text).replace(/\r?\n/g, "<br>");
  const logo = `${baseUrl}/logo-dark.png`;
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>PrimeTEK SSC</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
        <tr><td style="height:4px;background:#ef5b00;background-image:linear-gradient(90deg,#f68b08,#ef5b00);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td style="padding:28px 40px 20px 40px;border-bottom:1px solid #f0f0f1;">
            <a href="https://primetekssc.ng" style="text-decoration:none;">
              <img src="${logo}" width="150" alt="PrimeTEK Safety &amp; Security Consultants" style="display:block;width:150px;max-width:150px;height:auto;border:0;outline:none;">
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 36px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#27272a;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#fafafa;border-top:1px solid #f0f0f1;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#71717a;">
            <strong style="color:#3f3f46;">PrimeTEK Safety &amp; Security Consultants</strong><br>
            <a href="https://primetekssc.ng" style="color:#ef5b00;text-decoration:none;">primetekssc.ng</a>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a1a1aa;">© ${year} PrimeTEK SSC. All rights reserved.</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}
