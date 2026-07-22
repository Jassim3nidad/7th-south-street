import nodemailer from 'nodemailer'
import { createServiceClient } from '@/lib/supabase/service'

export type EmailSendParams = {
  idempotencyKey: string
  to: string
  subject: string
  templateName: string
  html: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter
  
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '465')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('SMTP configuration is missing. Transactional emails will not be sent.')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })
  
  return transporter
}

export async function sendTransactionalEmail(params: EmailSendParams) {
  const { idempotencyKey, to, subject, templateName, html } = params
  const supabase = createServiceClient()

  // 1. Check idempotency
  const { data: logCheck, error: logError } = await supabase.rpc('log_transactional_email', {
    p_idempotency_key: idempotencyKey,
    p_recipient_email: to,
    p_template_name: templateName,
    p_subject: subject
  })

  if (logError) {
    console.error('Failed to log email request:', logError)
    return { success: false, reason: 'Log check failed' }
  }

  // @ts-ignore - The RPC returns a json object directly
  const logCheckData = logCheck as { allowed: boolean, reason?: string, log_id: string }

  if (!logCheckData.allowed) {
    console.log(`Email blocked by idempotency check: ${logCheckData.reason}`)
    return { success: true, cached: true }
  }

  const logId = logCheckData.log_id
  const mailer = getTransporter()

  if (!mailer) {
    await supabase.rpc('update_transactional_email_status', {
      p_log_id: logId,
      p_status: 'failed',
      p_error_message: 'SMTP not configured'
    })
    return { success: false, reason: 'SMTP not configured' }
  }

  // 2. Send Email
  const senderEmail = process.env.SMTP_SENDER_EMAIL || 'noreply@7thsouthstreet.com'
  const senderName = process.env.SMTP_SENDER_NAME || '7TH SOUTH STREET'

  try {
    await mailer.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html
    })

    // 3. Update Status
    await supabase.rpc('update_transactional_email_status', {
      p_log_id: logId,
      p_status: 'sent',
      p_error_message: undefined
    })

    return { success: true }
  } catch (err: any) {
    console.error('Failed to send email:', err)
    await supabase.rpc('update_transactional_email_status', {
      p_log_id: logId,
      p_status: 'failed',
      p_error_message: err.message
    })
    return { success: false, reason: err.message }
  }
}
