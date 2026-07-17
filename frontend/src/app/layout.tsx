import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans, DM_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { getThemeInitScript, themeMetaColors } from '@/lib/theme'
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: '7Th South Street', template: '%s | 7Th South Street' },
  description: 'Premium underground streetwear. Minimalist. Dark. Unapologetic.',
  keywords: ['streetwear', 'fashion', 'caps', 'hoodies', 'Philippines', '7SS'],
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    siteName: '7Th South Street',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content={themeMetaColors.light} />
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: 'var(--font-body), DM Sans, system-ui, sans-serif' }}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--neo-surface-strong)',
                color: 'var(--neo-text)',
                border: '1px solid var(--neo-border)',
                borderRadius: '16px',
                boxShadow: 'var(--neo-shadow-raised-sm)',
                fontFamily: 'var(--font-body), sans-serif',
                fontSize: '13px',
                letterSpacing: '0.02em',
              },
              success: { iconTheme: { primary: 'var(--neo-accent)', secondary: 'var(--neo-surface-strong)' } },
              error: { iconTheme: { primary: 'var(--neo-error)', secondary: 'var(--neo-surface-strong)' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
