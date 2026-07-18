import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GENERIC_RECOVERY_MESSAGE,
  GENERIC_SIGNUP_MESSAGE,
  getAuthErrorMessage,
  getAuthLinkErrorMessage,
  getAuthStatusMessage,
  getPasswordIssues,
  getSafeReturnPath,
  hasRecoveryIntent,
  isDuplicateSignupError,
  isNetworkAuthError,
  normalizeEmail,
  validateCreateAccount,
  validatePasswordReset,
} from './customer-auth'

test('allows only same-site return paths', () => {
  assert.equal(getSafeReturnPath('/account'), '/account')
  assert.equal(getSafeReturnPath('/checkout?from=login#shipping'), '/checkout?from=login#shipping')
  assert.equal(getSafeReturnPath('https://evil.example/steal'), '/account')
  assert.equal(getSafeReturnPath('//evil.example/steal'), '/account')
  assert.equal(getSafeReturnPath('/..//evil.example/steal'), '/account')
  assert.equal(getSafeReturnPath('/%2e%2e//evil.example/steal'), '/account')
  assert.equal(getSafeReturnPath('/safe/..//evil.example/steal'), '/account')
  assert.equal(getSafeReturnPath('/\\evil.example/steal'), '/account')
  assert.equal(getSafeReturnPath('javascript:alert(1)'), '/account')
  assert.equal(getSafeReturnPath('/account\u0000bad'), '/account')
  assert.equal(getSafeReturnPath(undefined, '/shop'), '/shop')
  assert.equal(getSafeReturnPath(undefined, '//evil.example'), '/account')
  assert.equal(getSafeReturnPath(undefined, '/..//evil.example'), '/account')
})

test('normalizes email without changing password-like values', () => {
  assert.equal(normalizeEmail('  Customer@Example.COM '), 'customer@example.com')
})

test('requires a recovery intent tied to the current Auth user', () => {
  assert.equal(hasRecoveryIntent('user-a', 'user-a'), true)
  assert.equal(hasRecoveryIntent('user-a', 'user-b'), false)
  assert.equal(hasRecoveryIntent(undefined, 'user-a'), false)
  assert.equal(hasRecoveryIntent('user-a', undefined), false)
})

test('password policy requires length, a letter, and a number', () => {
  assert.deepEqual(getPasswordIssues(''), [
    'Use at least 8 characters.',
    'Include at least one letter.',
    'Include at least one number.',
  ])
  assert.deepEqual(getPasswordIssues('streetwear7'), [])
  assert.deepEqual(getPasswordIssues('12345678'), ['Include at least one letter.'])
})

test('create-account validation rejects malformed and mismatched fields', () => {
  const errors = validateCreateAccount({
    firstName: ' ',
    lastName: '',
    email: 'not-an-email',
    password: 'short',
    confirmPassword: 'different',
  })

  assert.equal(errors.firstName, 'Enter your first name.')
  assert.equal(errors.lastName, 'Enter your last name.')
  assert.equal(errors.email, 'Enter a valid email address.')
  assert.match(errors.password ?? '', /at least 8 characters/)
  assert.equal(errors.confirmPassword, 'Passwords do not match.')

  assert.deepEqual(validateCreateAccount({
    firstName: 'Jade',
    lastName: 'Santos',
    email: 'jade@example.com',
    password: 'streetwear7',
    confirmPassword: 'streetwear7',
  }), {})
})

test('reset validation applies strength and confirmation checks', () => {
  assert.deepEqual(validatePasswordReset('streetwear7', 'streetwear7'), {})
  assert.equal(validatePasswordReset('short', 'other').confirmPassword, 'Passwords do not match.')
})

test('auth errors are mapped to safe actionable messages', () => {
  assert.equal(
    getAuthErrorMessage({ message: 'Invalid login credentials', status: 400 }, 'login'),
    'Email or password is incorrect.',
  )
  assert.match(getAuthErrorMessage({ code: 'email_not_confirmed' }, 'login'), /Verify your email/)
  assert.match(getAuthErrorMessage({ code: 'otp_expired' }, 'reset'), /invalid or has expired/)
  assert.match(getAuthErrorMessage({ code: 'over_email_send_rate_limit', status: 429 }, 'resend'), /Too many attempts/)
  assert.equal(getAuthErrorMessage({ message: 'User already registered' }, 'register'), GENERIC_SIGNUP_MESSAGE)
  assert.equal(getAuthErrorMessage({ message: 'Unknown user' }, 'recovery'), GENERIC_RECOVERY_MESSAGE)
  assert.match(getAuthErrorMessage({ message: 'Unexpected provider failure', status: 500 }, 'recovery'), /Unable to send/)
})

test('network and duplicate errors can be handled without account enumeration', () => {
  assert.equal(isNetworkAuthError({ message: 'Failed to fetch', status: 0 }), true)
  assert.equal(isNetworkAuthError({ message: 'Invalid login credentials', status: 400 }), false)
  assert.equal(isDuplicateSignupError({ code: 'user_already_exists' }), true)
})

test('query-string auth states expose only controlled messages', () => {
  assert.match(getAuthLinkErrorMessage('otp_expired') ?? '', /expired/)
  assert.match(getAuthLinkErrorMessage('recovery') ?? '', /reset link/)
  assert.equal(getAuthLinkErrorMessage(undefined), null)
  assert.match(getAuthStatusMessage('verified') ?? '', /email is verified/i)
  assert.match(getAuthStatusMessage('password-updated') ?? '', /password has been updated/i)
  assert.equal(getAuthStatusMessage('untrusted text'), null)
})
