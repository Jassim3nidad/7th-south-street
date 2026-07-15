import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error('Hosted concurrency test requires the local Supabase environment variables')
}

const service = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const anonymous = createClient(url, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const suffix = randomUUID().replaceAll('-', '').slice(0, 12)
const slug = `qa-concurrency-${suffix}`
const sku = `QA-CONC-${suffix.toUpperCase()}`
let productId
let variantId
const orderIds = []

async function cleanup() {
  if (variantId) {
    await service.from('inventory_movements').delete().eq('variant_id', variantId)
  }
  if (orderIds.length > 0) {
    await service.from('orders').delete().in('id', orderIds)
  }
  if (variantId) {
    await service.from('product_variants').delete().eq('id', variantId)
  }
  if (productId) {
    await service.from('products').delete().eq('id', productId)
  }
}

try {
  const { data: product, error: productError } = await service
    .from('products')
    .insert({ name: `QA Concurrency ${suffix}`, slug, status: 'available', has_sizes: false })
    .select('id')
    .single()
  if (productError) throw productError
  productId = product.id

  const { data: variant, error: variantError } = await service
    .from('product_variants')
    .insert({
      product_id: productId,
      sku,
      size: 'OS',
      color: '',
      price: 123.45,
      stock_quantity: 1,
      is_active: true,
    })
    .select('id')
    .single()
  if (variantError) throw variantError
  variantId = variant.id

  const orderInput = (idempotencyKey) => ({
    p_items: [{ variant_id: variantId, quantity: 1, unit_price: 0, order_total: 0 }],
    p_customer_information: {
      first_name: 'QA',
      last_name: 'Concurrency',
      email: 'qa-concurrency@example.com',
    },
    p_shipping_information: {
      name: 'QA Concurrency',
      email: 'qa-concurrency@example.com',
      phone: '09170000000',
      address: 'QA Test Address',
      city: 'Manila',
      country: 'Philippines',
    },
    p_payment_method: 'cod',
    p_notes: 'Automated hosted concurrency test; safe to delete',
    p_idempotency_key: idempotencyKey,
  })

  const results = await Promise.all([
    anonymous.rpc('create_order', orderInput(randomUUID())),
    anonymous.rpc('create_order', orderInput(randomUUID())),
  ])
  const successful = results.filter((result) => !result.error)
  const rejected = results.filter((result) => result.error)

  for (const result of successful) {
    orderIds.push(Number(result.data.order_id))
    assert.equal(Number(result.data.total), 273.45, 'database price and shipping total must be trusted')
  }
  assert.equal(successful.length, 1, 'exactly one concurrent checkout must succeed')
  assert.equal(rejected.length, 1, 'exactly one concurrent checkout must be rejected')
  assert.match(rejected[0].error.message, /insufficient stock/i)

  const [{ data: stock, error: stockError }, { data: movements, error: movementError }] = await Promise.all([
    service.from('product_variants').select('stock_quantity').eq('id', variantId).single(),
    service
      .from('inventory_movements')
      .select('quantity_delta,movement_type')
      .eq('variant_id', variantId),
  ])
  if (stockError) throw stockError
  if (movementError) throw movementError
  assert.equal(stock.stock_quantity, 0, 'stock must decrement exactly once')
  assert.equal(movements.length, 1, 'exactly one sale movement must be recorded')
  assert.equal(movements[0].movement_type, 'sale')
  assert.equal(movements[0].quantity_delta, -1)

  console.log('hosted concurrency: PASS')
} finally {
  await cleanup()
  if (productId) {
    const { count } = await service
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('id', productId)
    assert.equal(count, 0, 'QA product cleanup failed')
  }
}
