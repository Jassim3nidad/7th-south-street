import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: '7Th South Street', template: '%s | 7Th South Street' },
  description: 'Premium underground streetwear. Minimalist. Dark. Unapologetic.',
  keywords: ['streetwear', 'fashion', 'caps', 'hoodies', 'Philippines', '7SS'],
  openGraph: {
    type: 'website',
    siteName: '7Th South Street',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body
        className="antialiased"
        style={{ fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1614',
              color: '#F5F2EE',
              border: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'var(--font-body), sans-serif',
              fontSize: '13px',
              letterSpacing: '0.02em',
            },
            success: { iconTheme: { primary: '#C9A96E', secondary: '#080808' } },
          }}
        />
      </body>
    </html>
  )
}
