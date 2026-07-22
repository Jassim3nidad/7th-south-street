'use client'

import { motion } from 'framer-motion'
import { TrackedOrder } from '@/app/actions/orders'

const TIMELINE_STEPS = [
  { status: 'pending', label: 'Order Placed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' }
]

export default function OrderDetails({ order, isImmediateConfirmation = false }: { order: TrackedOrder, isImmediateConfirmation?: boolean }) {
  const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.status === order.status)
  
  // If cancelled or refunded, we handle it specially
  const isTerminalFailure = ['cancelled', 'refunded'].includes(order.status)
  
  const activeStep = isTerminalFailure ? -1 : (currentStepIndex >= 0 ? currentStepIndex : 0)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        {isImmediateConfirmation && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full border border-[#C9A96E]/30 flex items-center justify-center bg-[#C9A96E]/10">
              <svg className="w-8 h-8 text-[#C9A96E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
        )}
        <h1 className="text-white font-light text-4xl sm:text-5xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {isImmediateConfirmation ? 'Thank You for Your Order' : 'Order Details'}
        </h1>
        <p className="text-white/50 font-mono tracking-wider">ORDER #{order.order_number}</p>
        <p className="text-white/40 text-sm">{new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Timeline */}
      <div className="neo-panel p-8">
        <h3 className="text-white/60 uppercase tracking-widest text-xs mb-8">Status</h3>
        {isTerminalFailure ? (
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded text-red-400 text-center">
            This order has been {order.status}.
          </div>
        ) : (
          <div className="relative flex justify-between items-center max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-white/10 z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#C9A96E] z-0 transition-all duration-1000" 
              style={{ width: `${(activeStep / (TIMELINE_STEPS.length - 1)) * 100}%` }}
            />
            {TIMELINE_STEPS.map((step, idx) => {
              const isCompleted = idx <= activeStep
              const isCurrent = idx === activeStep
              return (
                <div key={step.status} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-4 h-4 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-[#C9A96E] shadow-[0_0_10px_rgba(201,169,110,0.5)]' : 'bg-[#111] border border-white/20'}`} />
                  <span className={`text-xs uppercase tracking-wider ${isCurrent ? 'text-[#C9A96E]' : isCompleted ? 'text-white/80' : 'text-white/40'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="neo-panel p-8 space-y-6">
            <h3 className="text-white/60 uppercase tracking-widest text-xs">Items</h3>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4 pb-4 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm">{item.product_name}</p>
                    <p className="text-white/40 text-xs mt-1">
                      {item.size} {item.color ? `| ${item.color}` : ''}
                    </p>
                    <p className="text-white/40 text-xs mt-1">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-white/80 text-sm font-mono tracking-tighter">
                    ₱{item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="neo-panel p-8 space-y-4">
            <h3 className="text-white/60 uppercase tracking-widest text-xs mb-6">Summary</h3>
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span className="font-mono">₱{order.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Shipping</span>
              <span className="font-mono">{order.shipping_fee === 0 ? 'Free' : `₱${order.shipping_fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span>
            </div>
            <div className="flex justify-between text-base text-white pt-4 border-t border-white/10">
              <span>Total</span>
              <span className="font-mono text-[#C9A96E]">₱{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="neo-panel p-8 space-y-6">
            <h3 className="text-white/60 uppercase tracking-widest text-xs">Customer Details</h3>
            <div>
              <p className="text-white text-sm">{order.shipping_name}</p>
              <p className="text-white/60 text-sm">{order.shipping_email}</p>
              <p className="text-white/60 text-sm">{order.shipping_phone}</p>
            </div>
          </div>

          <div className="neo-panel p-8 space-y-6">
            <h3 className="text-white/60 uppercase tracking-widest text-xs">Shipping Address</h3>
            <div className="text-white/80 text-sm leading-relaxed">
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}{order.shipping_province ? `, ${order.shipping_province}` : ''} {order.shipping_postal}</p>
              <p className="text-white/50">{order.shipping_country}</p>
            </div>
          </div>

          <div className="neo-panel p-8 space-y-6">
            <h3 className="text-white/60 uppercase tracking-widest text-xs">Payment</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm uppercase tracking-wider">{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.replace('_', ' ')}</p>
                <p className="text-white/40 text-xs mt-1 capitalize">Status: {order.payment_status}</p>
              </div>
            </div>
            
            {order.payment_status === 'unpaid' && !isTerminalFailure && (
              <div className="pt-4 border-t border-white/5 space-y-3">
                <p className="text-white/80 text-sm font-medium">Payment Instructions</p>
                {order.payment_method === 'gcash' && (
                  <div className="text-sm text-white/60 leading-relaxed bg-white/5 p-4 rounded">
                    <p>1. Open GCash and send <strong>₱{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to:</p>
                    <p className="font-mono text-white mt-1 mb-2">0917-123-4567 (7TH SOUTH STREET)</p>
                    <p>2. Take a screenshot of the successful transfer.</p>
                    <p>3. Reply to your order confirmation email with the screenshot attached.</p>
                  </div>
                )}
                {order.payment_method === 'bank_transfer' && (
                  <div className="text-sm text-white/60 leading-relaxed bg-white/5 p-4 rounded">
                    <p>1. Transfer <strong>₱{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to our BDO Account:</p>
                    <p className="font-mono text-white mt-1">Bank: BDO Unibank</p>
                    <p className="font-mono text-white">Account Name: 7TH SOUTH STREET</p>
                    <p className="font-mono text-white mb-2">Account Number: 1234567890</p>
                    <p>2. Take a screenshot of the deposit slip or successful transfer screen.</p>
                    <p>3. Reply to your order confirmation email with the screenshot attached.</p>
                  </div>
                )}
                {order.payment_method === 'cod' && (
                  <div className="text-sm text-white/60 leading-relaxed bg-white/5 p-4 rounded">
                    <p>Please prepare the exact amount of <strong>₱{order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> for the courier upon delivery.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Steps & Support */}
      <div className="text-center space-y-4 pt-12 pb-8 border-t border-white/5">
        <h4 className="text-white/80 font-medium">What's Next?</h4>
        <p className="text-white/40 text-sm max-w-lg mx-auto leading-relaxed">
          {activeStep === 0 && 'We are currently preparing your order. You will receive an email notification once it ships.'}
          {activeStep === 1 && 'Your order is being processed and packaged.'}
          {activeStep === 2 && 'Your order is on the way! It will arrive shortly.'}
          {activeStep === 3 && 'Your order has been delivered. Enjoy.'}
          {isTerminalFailure && 'If you have questions about this status, please contact us.'}
        </p>
        <p className="text-white/40 text-sm pt-4">
          Need help? Contact <a href="mailto:support@7thsouthstreet.com" className="text-[#C9A96E] hover:underline">support@7thsouthstreet.com</a>
        </p>
      </div>
    </div>
  )
}
