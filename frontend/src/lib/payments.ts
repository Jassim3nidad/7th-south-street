export type PaymentProcessingResult = 
  | { type: 'manual'; order: any }
  | { type: 'redirect'; order: any; checkoutUrl: string }
  | { type: 'error'; message: string }

/**
 * Standardized payment abstraction that can support future gateways.
 * 
 * @param orderData The order object returned from the database creation RPC
 * @param method The payment method selected by the user (e.g., 'cod', 'gcash', 'paymongo')
 * @returns PaymentProcessingResult which tells the frontend how to proceed
 */
export async function processPayment(orderData: any, method: string): Promise<PaymentProcessingResult> {
  try {
    // In the future, if method === 'paymongo', you would call the PayMongo API here
    // const checkoutUrl = await createPayMongoCheckout(orderData)
    // return { type: 'redirect', order: orderData, checkoutUrl }

    // Currently, all existing methods are manual flows
    if (['cod', 'gcash', 'bank_transfer'].includes(method)) {
      return { type: 'manual', order: orderData }
    }

    // Default fallback to manual if method is unrecognized but passed DB constraints
    return { type: 'manual', order: orderData }
  } catch (error: any) {
    console.error('Payment processing error:', error)
    return { type: 'error', message: error.message || 'Failed to process payment integration.' }
  }
}
