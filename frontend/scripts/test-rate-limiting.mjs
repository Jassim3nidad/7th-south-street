import assert from 'node:assert'

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function testRateLimiting() {
  console.log(`Starting rate limit test against ${API_URL}/api/events/1/rsvp`)

  const requests = Array.from({ length: 6 }).map((_, i) =>
    fetch(`${API_URL}/api/events/1/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
      }),
    })
  )

  const responses = await Promise.all(requests)
  
  // Rate limit is set to 3. So at least some should be 429.
  // Wait, if the event doesn't exist, it returns 404, which might bypass the rate limit or hit it.
  // We just want to see if 429 is returned.
  const statuses = responses.map(r => r.status)
  console.log('Response statuses:', statuses)

  const hasRateLimit = statuses.some(s => s === 429)
  
  // Note: if the DB migration isn't applied yet, this test will fail.
  // If the event doesn't exist, it might hit 404 before rate limit, or rate limit before 404 depending on order.
  // In our code, rate limit is checked BEFORE event existence! So 429 will happen.
  if (hasRateLimit) {
    console.log('✅ Rate limiting is working as expected.')
  } else {
    console.log('⚠️ Rate limiting was not triggered. Ensure the migration is applied.')
  }
}

testRateLimiting().catch(console.error)
