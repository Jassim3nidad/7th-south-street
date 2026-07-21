import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin setup

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConcurrency() {
  console.log('--- Setting up concurrency test ---')
  
  // Find a product variant to use
  const { data: variant, error: varError } = await supabase
    .from('product_variants')
    .select('id, stock_quantity')
    .limit(1)
    .single()
    
  if (varError || !variant) {
    console.error('Failed to get variant', varError)
    return
  }

  const variantId = variant.id
  console.log(`Using variant ID ${variantId}.`)

  // Step 1: Set stock to exactly 1 using admin adjustment
  const { error: adjustError } = await supabase.rpc('admin_adjust_inventory', {
    p_variant_id: variantId,
    p_stock_quantity: 1,
    p_reason: 'Concurrency test setup'
  })

  if (adjustError) {
    console.error('Failed to adjust inventory', adjustError)
    return
  }
  console.log('Stock set to exactly 1.')

  // Step 2: Fire 5 simultaneous checkout requests via REST/RPC
  console.log('Firing 5 simultaneous orders...')
  
  const requests = Array.from({ length: 5 }).map((_, idx) => {
    return supabase.rpc('create_order', {
      p_items: [{ variant_id: variantId, quantity: 1 }],
      p_customer_information: {},
      p_shipping_information: {
        name: `Racer ${idx}`,
        email: `racer${idx}@example.com`,
        phone: '09170000000',
        address: 'Race Street',
        city: 'Manila'
      },
      p_payment_method: 'cod',
      p_notes: `Race request ${idx}`,
      p_idempotency_key: crypto.randomUUID()
    })
  })

  const results = await Promise.allSettled(requests)
  
  let successes = 0
  let failures = 0
  
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      if (res.value.error) {
        failures++
        console.log(`Request ${i} failed cleanly: ${res.value.error.message}`)
      } else {
        successes++
        console.log(`Request ${i} SUCCEEDED. Order ID: ${res.value.data.order_id}`)
      }
    } else {
      failures++
      console.log(`Request ${i} failed unexpectedly: ${res.reason}`)
    }
  })

  // Verify exactly 1 succeeded
  if (successes !== 1) {
    console.error(`❌ Concurrency test failed! Expected exactly 1 success, got ${successes}`)
  } else {
    console.log(`✅ Concurrency test passed! 1 success, ${failures} clean rejections.`)
  }

  // Verify final stock is 0
  const { data: finalStock } = await supabase
    .from('product_variants')
    .select('stock_quantity')
    .eq('id', variantId)
    .single()

  console.log(`Final stock quantity: ${finalStock?.stock_quantity}`)
  if (finalStock?.stock_quantity !== 0) {
    console.error('❌ Final stock is not 0!')
  } else {
    console.log('✅ Final stock is exactly 0.')
  }
}

testConcurrency().catch(console.error)
