import assert from 'node:assert/strict'
import test from 'node:test'
import { hasValidImageSignature, isValidProductImagePath } from './upload-validation'

test('accepts supported image signatures', () => {
  assert.equal(hasValidImageSignature('image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), true)
  assert.equal(
    hasValidImageSignature(
      'image/png',
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    true,
  )
  assert.equal(
    hasValidImageSignature(
      'image/webp',
      Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
    ),
    true,
  )
})

test('rejects truncated, mismatched, and unsupported signatures', () => {
  assert.equal(hasValidImageSignature('image/jpeg', Uint8Array.from([0xff, 0xd8])), false)
  assert.equal(hasValidImageSignature('image/png', Uint8Array.from([0x89, 0x50])), false)
  assert.equal(
    hasValidImageSignature(
      'image/webp',
      Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x4e, 0x4f, 0x50, 0x45]),
    ),
    false,
  )
  assert.equal(hasValidImageSignature('image/svg+xml', Uint8Array.from([0x3c, 0x73, 0x76, 0x67])), false)
})

test('accepts scoped product paths and rejects traversal or unsafe names', () => {
  assert.equal(isValidProductImagePath('products/42/550e8400-e29b-41d4-a716-446655440000.webp'), true)
  assert.equal(isValidProductImagePath('products/42/image.png'), true)
  assert.equal(isValidProductImagePath('products/../secrets.png'), false)
  assert.equal(isValidProductImagePath('events/42/image.png'), false)
  assert.equal(isValidProductImagePath('products/42/image.svg'), false)
  assert.equal(isValidProductImagePath('products/42/image name.png'), false)
})
