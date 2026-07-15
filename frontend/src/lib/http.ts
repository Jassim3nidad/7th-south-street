import { NextResponse } from 'next/server'
import { AuthorizationError } from '@/lib/supabase/admin'

export function success<T>(
  data: T,
  message = 'OK',
  status = 200,
  meta?: Record<string, unknown>,
) {
  return NextResponse.json(
    { data, message, ...(meta ? { meta } : {}) },
    { status },
  )
}

export function failure(message: string, status = 400) {
  return NextResponse.json({ message }, { status })
}

const safeDatabaseMessages = [
  /administrator access required/i,
  /authentication required/i,
  /product not found/i,
  /order not found/i,
  /event not found/i,
  /requested product variant is unavailable/i,
  /insufficient stock/i,
  /idempotency key is required/i,
  /order must contain/i,
  /every item requires/i,
  /shipping details are required/i,
  /unsupported payment method/i,
  /notes are too long/i,
  /event is not accepting/i,
  /event is fully booked/i,
  /valid name and email/i,
  /valid email address/i,
]

export function handleRouteError(error: unknown, fallback = 'Request failed') {
  if (error instanceof SyntaxError) {
    return failure('Invalid JSON request body')
  }

  if (error instanceof AuthorizationError) {
    return failure(error.message, error.status)
  }

  const message =
    typeof error === 'object' && error && 'message' in error
      ? String(error.message)
      : ''

  const safeMessage = safeDatabaseMessages.some((pattern) => pattern.test(message))
    ? message
    : fallback

  return failure(safeMessage, safeMessage === fallback ? 500 : 400)
}
