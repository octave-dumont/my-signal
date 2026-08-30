import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: '500', style: 'italic', variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'my-signal',
  description: 'Signal share of the day',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'my-signal' },
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#131316' },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body className={`${geist.className} ${serif.variable}`}>{children}</body>
    </html>
  )
}
