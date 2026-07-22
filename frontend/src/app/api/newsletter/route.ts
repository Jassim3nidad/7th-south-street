import { createHash } from 'crypto'
import { failure, handleRouteError, success } from '@/lib/http'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Bot protection: if honeypot is filled, quietly succeed without subscribing
    if (typeof body?.website === 'string' && body.website.length > 0) {
      return success(null, 'If the address is eligible, the subscription is active.', 202)
    }

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email) return failure('A valid email address is required')

    const source = typeof body?.source === 'string' ? body.source : 'unknown'

    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const requestIdentity = forwardedFor || request.headers.get('x-real-ip') || 'unknown'
    const salt = process.env.NEWSLETTER_RATE_LIMIT_SALT || process.env.NEXT_PUBLIC_SITE_URL || '7ss-newsletter'
    const requestHash = createHash('sha256').update(`${salt}:${requestIdentity}`).digest('hex')
    const supabase = createServiceClient()
    const { error } = await supabase.rpc('subscribe_newsletter', {
      p_email: email,
      p_name: typeof body.name === 'string' ? body.name : null,
      p_source: source,
      p_request_hash: requestHash,
    })
    if (error) throw error

    return success(null, 'If the address is eligible, the subscription is active.', 202)
  } catch (error) {
    return handleRouteError(error, 'Unable to process subscription')
  }
}
