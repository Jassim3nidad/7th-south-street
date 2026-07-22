export type EmailTemplateParams = {
  subject: string
  preheader?: string
  headline: string
  bodyHtml: string
  ctaText?: string
  ctaUrl?: string
}

export function getBaseTemplate({
  subject,
  preheader,
  headline,
  bodyHtml,
  ctaText,
  ctaUrl,
}: EmailTemplateParams) {
  const baseHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #080808;
      color: #F5F2EE;
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      text-align: center;
    }
    .header {
      margin-bottom: 40px;
    }
    .logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 24px;
      letter-spacing: 2px;
      color: #F5F2EE;
      text-decoration: none;
      text-transform: uppercase;
    }
    .headline {
      font-family: 'Cormorant Garamond', serif;
      font-size: 28px;
      font-weight: normal;
      color: #C9A96E;
      margin-bottom: 24px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .content {
      font-size: 14px;
      line-height: 1.6;
      color: #A0A0A0;
      margin-bottom: 32px;
      text-align: left;
    }
    .cta-container {
      margin-top: 32px;
      margin-bottom: 32px;
    }
    .cta-button {
      display: inline-block;
      background-color: #C9A96E;
      color: #080808 !important;
      text-decoration: none;
      padding: 14px 28px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1.5px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}
  <div class="container">
    <div class="header">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://7thsouthstreet.com'}" class="logo">7TH SOUTH STREET</a>
    </div>
    
    <h1 class="headline">${headline}</h1>
    
    <div class="content">
      ${bodyHtml}
    </div>

    ${ctaText && ctaUrl ? `
      <div class="cta-container">
        <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
      </div>
    ` : ''}

    <div class="footer">
      <p>Premium underground streetwear.<br>Minimalist by design. Nonchalant by nature.</p>
      <p>© ${new Date().getFullYear()} 7TH SOUTH STREET. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return baseHtml
}

// Order Confirmation
export function getOrderConfirmationTemplate(orderNumber: string, customerName: string, itemsHtml: string, total: string, url: string) {
  return getBaseTemplate({
    subject: `Order Confirmed - ${orderNumber}`,
    preheader: 'Your 7SS order has been successfully placed.',
    headline: 'Order Confirmed',
    bodyHtml: `
      <p style="margin-bottom: 24px;">Hi ${customerName},</p>
      <p style="margin-bottom: 24px;">Your order <strong>${orderNumber}</strong> has been confirmed and is currently being processed. You will receive another notification when it ships.</p>
      <div style="background-color: rgba(255,255,255,0.03); padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #F5F2EE; margin-top: 0; margin-bottom: 16px;">Order Summary</h3>
        ${itemsHtml}
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); text-align: right; color: #C9A96E;">
          <strong>Total: ${total}</strong>
        </div>
      </div>
    `,
    ctaText: 'View Order Status',
    ctaUrl: url
  })
}

// RSVP Confirmation
export function getRSVPConfirmationTemplate(eventName: string, customerName: string, date: string, location: string, url: string) {
  return getBaseTemplate({
    subject: `You're on the list - ${eventName}`,
    preheader: 'Your RSVP for the upcoming 7SS event is confirmed.',
    headline: "You're on the list",
    bodyHtml: `
      <p style="margin-bottom: 24px;">Hi ${customerName},</p>
      <p style="margin-bottom: 24px;">Your RSVP for <strong>${eventName}</strong> is confirmed.</p>
      <div style="background-color: rgba(255,255,255,0.03); padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${date}</p>
        <p style="margin: 0;"><strong>Location:</strong> ${location}</p>
      </div>
      <p>Space is strictly limited. If you can no longer attend, please let us know.</p>
    `,
    ctaText: 'View Event Details',
    ctaUrl: url
  })
}
