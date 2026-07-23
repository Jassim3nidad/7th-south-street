import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  isValidEmail,
  getPasswordIssues,
  validateCreateAccount,
} from '../../lib/auth/customer-auth'

describe('Unit: Customer Auth Validation', () => {
  it('isValidEmail should reject invalid emails', () => {
    assert.strictEqual(isValidEmail('not-an-email'), false)
    assert.strictEqual(isValidEmail('no-domain@'), false)
    assert.strictEqual(isValidEmail('spaces in@domain.com'), false)
  })

  it('isValidEmail should accept valid emails', () => {
    assert.strictEqual(isValidEmail('test@example.com'), true)
    assert.strictEqual(isValidEmail('  TEST@example.com  '), true)
  })

  it('getPasswordIssues should return issues for weak passwords', () => {
    const issues1 = getPasswordIssues('short')
    assert.ok(issues1.includes('Use at least 8 characters.'))

    const issues2 = getPasswordIssues('nouppercaseornumbers')
    assert.ok(issues2.includes('Include at least one number.'))
  })

  it('getPasswordIssues should return empty array for strong passwords', () => {
    const issues = getPasswordIssues('SuperSecret123')
    assert.strictEqual(issues.length, 0)
  })

  it('validateCreateAccount should flag missing fields', () => {
    const values = {
      firstName: '',
      lastName: '',
      email: 'bad',
      password: 'short',
      confirmPassword: 'not',
    }
    const errors = validateCreateAccount(values)
    
    assert.ok(errors.firstName)
    assert.ok(errors.lastName)
    assert.ok(errors.email)
    assert.ok(errors.password)
    assert.ok(errors.confirmPassword)
  })
})
