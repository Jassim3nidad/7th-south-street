export const GENERIC_SIGNUP_MESSAGE =
  'If this email can be registered, we sent a verification link. Check your inbox and spam folder.'

export const GENERIC_RECOVERY_MESSAGE =
  'If an account exists for that email, a password reset link is on its way. Check your inbox and spam folder.'

export const GENERIC_RESEND_MESSAGE =
  'If the account is waiting for verification, a new link is on its way. Check your inbox and spam folder.'

export type AuthOperation = 'login' | 'register' | 'recovery' | 'reset' | 'resend' | 'logout'

export type CreateAccountValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export type CreateAccountField = keyof CreateAccountValues
export type CreateAccountErrors = Partial<Record<CreateAccountField, string>>

export type PasswordResetErrors = Partial<Record<'password' | 'confirmPassword', string>>

type AuthErrorLike = {
  code?: unknown
  message?: unknown
  status?: unknown
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SAFE_PATH_BASE = 'https://7thsouthstreet.invalid'

function isSafeInternalPath(value: string) {
  if (!value.startsWith('/') || value.startsWith('//')) return false
  if (value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return false

  try {
    return new URL(value, SAFE_PATH_BASE).origin === SAFE_PATH_BASE
  } catch {
    return false
  }
}

function normalizeSafeInternalPath(value: string) {
  const candidate = value.trim()
  if (!isSafeInternalPath(candidate)) return null

  const parsed = new URL(candidate, SAFE_PATH_BASE)
  const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`

  // URL parsing removes dot segments. Revalidate the normalized result because
  // an input such as `/..//evil.example` otherwise becomes `//evil.example`.
  return isSafeInternalPath(normalized) ? normalized : null
}

/**
 * Keeps post-authentication navigation on this site. In particular, a leading
 * `//` is rejected because browsers interpret it as a protocol-relative URL.
 */
export function getSafeReturnPath(value: unknown, fallback = '/account') {
  const safeFallback = normalizeSafeInternalPath(fallback) ?? '/account'
  if (typeof value !== 'string') return safeFallback

  return normalizeSafeInternalPath(value) ?? safeFallback
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function hasRecoveryIntent(cookieValue: string | undefined, userId: string | undefined) {
  return Boolean(userId && cookieValue === userId)
}

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(normalizeEmail(value))
}

export function getPasswordIssues(password: string) {
  const issues: string[] = []

  if (password.length < 8) issues.push('Use at least 8 characters.')
  if (password.length > 128) issues.push('Use no more than 128 characters.')
  if (!/[A-Za-z]/.test(password)) issues.push('Include at least one letter.')
  if (!/\d/.test(password)) issues.push('Include at least one number.')

  return issues
}

export function validateCreateAccount(values: CreateAccountValues): CreateAccountErrors {
  const errors: CreateAccountErrors = {}
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()

  if (!firstName) errors.firstName = 'Enter your first name.'
  else if (firstName.length > 80) errors.firstName = 'First name must be 80 characters or fewer.'

  if (!lastName) errors.lastName = 'Enter your last name.'
  else if (lastName.length > 80) errors.lastName = 'Last name must be 80 characters or fewer.'

  if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address.'

  const passwordIssues = getPasswordIssues(values.password)
  if (passwordIssues.length) errors.password = passwordIssues.join(' ')

  if (!values.confirmPassword) errors.confirmPassword = 'Confirm your password.'
  else if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

export function validatePasswordReset(password: string, confirmPassword: string): PasswordResetErrors {
  const errors: PasswordResetErrors = {}
  const passwordIssues = getPasswordIssues(password)

  if (passwordIssues.length) errors.password = passwordIssues.join(' ')
  if (!confirmPassword) errors.confirmPassword = 'Confirm your new password.'
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'

  return errors
}

function getErrorDetails(error: unknown) {
  const source = typeof error === 'object' && error ? error as AuthErrorLike : {}
  const message = typeof source.message === 'string'
    ? source.message
    : typeof error === 'string'
      ? error
      : ''
  const code = typeof source.code === 'string' ? source.code : ''
  const status = typeof source.status === 'number' ? source.status : 0

  return {
    code: code.toLowerCase(),
    message: message.toLowerCase(),
    status,
  }
}

export function isNetworkAuthError(error: unknown) {
  const { code, message, status } = getErrorDetails(error)
  return status === 0 && (
    code.includes('retryable_fetch') ||
    /failed to fetch|fetch failed|network request failed|networkerror|load failed/.test(message)
  )
}

export function isRateLimitAuthError(error: unknown) {
  const { code, message, status } = getErrorDetails(error)
  return status === 429 || code.includes('rate_limit') || /rate limit|too many requests|security purposes/.test(message)
}

export function isDuplicateSignupError(error: unknown) {
  const { code, message } = getErrorDetails(error)
  return code.includes('user_already_exists') || /already registered|already exists|duplicate/.test(message)
}

export function getAuthErrorMessage(error: unknown, operation: AuthOperation) {
  const { code, message } = getErrorDetails(error)
  const details = `${code} ${message}`

  if (isNetworkAuthError(error)) return 'We could not reach the authentication service. Check your connection and try again.'
  if (isRateLimitAuthError(error)) return 'Too many attempts. Wait a moment before trying again.'

  if (/otp_expired|expired|invalid.*(token|link)|token.*invalid/.test(details)) {
    return 'This authentication link is invalid or has expired. Request a new link and try again.'
  }

  if (/email_not_confirmed|email.*not.*confirm/.test(details)) {
    return 'Verify your email before signing in. Use the link in your inbox or request a new one.'
  }

  if (/weak_password|password.*(weak|short)|same_password/.test(details)) {
    return operation === 'reset'
      ? 'Choose a stronger new password that you have not used for this account.'
      : 'Choose a stronger password with at least 8 characters, one letter, and one number.'
  }

  if (operation === 'login' && /invalid.*(credential|login)|invalid_grant|user.*not.*found/.test(details)) {
    return 'Email or password is incorrect.'
  }

  if (operation === 'register' && isDuplicateSignupError(error)) return GENERIC_SIGNUP_MESSAGE
  if (
    operation === 'recovery'
    && /user_not_found|email_not_found|unknown user|user.*not.*found|account.*not.*found/.test(details)
  ) {
    return GENERIC_RECOVERY_MESSAGE
  }
  if (operation === 'resend') return GENERIC_RESEND_MESSAGE
  if (operation === 'logout') return 'Unable to sign out. Check your connection and try again.'
  if (operation === 'reset') return 'Unable to update your password. Request a new reset link and try again.'
  if (operation === 'recovery') return 'Unable to send a password reset email right now. Please try again.'
  if (operation === 'register') return 'Unable to create your account right now. Please try again.'

  return 'Unable to sign in right now. Please try again.'
}

export function getAuthLinkErrorMessage(value: unknown) {
  if (typeof value !== 'string' || !value) return null
  const normalized = value.toLowerCase()

  if (/expired|otp_expired/.test(normalized)) {
    return 'This authentication link has expired. Request a new link and try again.'
  }
  if (/recovery|reset/.test(normalized)) {
    return 'This password reset link is invalid or has expired. Request a new one and try again.'
  }
  return 'We could not verify that authentication link. Request a new link and try again.'
}

export function getAuthStatusMessage(value: unknown) {
  if (typeof value !== 'string') return null

  switch (value.toLowerCase()) {
    case 'verified':
    case 'email-verified':
      return 'Your email is verified. You can now sign in.'
    case 'password-updated':
    case 'password_updated':
      return 'Your password has been updated. Sign in with your new password.'
    case 'signed-out':
      return 'You have been signed out.'
    default:
      return null
  }
}
