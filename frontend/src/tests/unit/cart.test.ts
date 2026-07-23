import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import { useCart } from '../../store/cart'

describe('Unit: Cart Operations', () => {
  beforeEach(() => {
    // Clear cart before each test
    useCart.getState().clearCart()
  })

  it('addItem should add a new item to the cart', () => {
    useCart.getState().addItem({
      id: 1,
      variant_id: 101,
      name: 'Test Shirt',
      price: 1500,
      size: 'M',
      image: '',
      quantity: 1,
      sku: 'TS-001',
    })

    const state = useCart.getState()
    assert.strictEqual(state.items.length, 1)
    assert.strictEqual(state.items[0].name, 'Test Shirt')
    assert.strictEqual(state.count(), 1)
    assert.strictEqual(state.total(), 1500)
  })

  it('addItem should increment quantity if item already exists', () => {
    const item = {
      id: 1,
      variant_id: 101,
      name: 'Test Shirt',
      price: 1500,
      size: 'M',
      image: '',
      quantity: 1,
      sku: 'TS-001',
    }
    
    useCart.getState().addItem(item)
    useCart.getState().addItem(item)

    const state = useCart.getState()
    assert.strictEqual(state.items.length, 1)
    assert.strictEqual(state.items[0].quantity, 2)
    assert.strictEqual(state.count(), 2)
    assert.strictEqual(state.total(), 3000)
  })

  it('removeItem should remove the specified item', () => {
    useCart.getState().addItem({
      id: 1,
      variant_id: 101,
      name: 'Test Shirt',
      price: 1500,
      size: 'M',
      image: '',
      quantity: 1,
      sku: 'TS-001',
    })

    useCart.getState().removeItem(1, 'M')

    assert.strictEqual(useCart.getState().items.length, 0)
    assert.strictEqual(useCart.getState().count(), 0)
  })

  it('updateQty should change the quantity of an item', () => {
    useCart.getState().addItem({
      id: 1,
      variant_id: 101,
      name: 'Test Shirt',
      price: 1500,
      size: 'M',
      image: '',
      quantity: 1,
      sku: 'TS-001',
    })

    useCart.getState().updateQty(1, 'M', 5)

    assert.strictEqual(useCart.getState().items[0].quantity, 5)
    assert.strictEqual(useCart.getState().total(), 7500)
  })

  it('updateQty should remove item if quantity is less than 1', () => {
    useCart.getState().addItem({
      id: 1,
      variant_id: 101,
      name: 'Test Shirt',
      price: 1500,
      size: 'M',
      image: '',
      quantity: 1,
      sku: 'TS-001',
    })

    useCart.getState().updateQty(1, 'M', 0)

    assert.strictEqual(useCart.getState().items.length, 0)
  })
})
