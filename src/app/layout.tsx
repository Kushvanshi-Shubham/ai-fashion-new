import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Fashion Extractor',
  description: 'Extract fashion attributes from images using advanced AI',
  keywords: ['AI', 'fashion', 'attribute extraction', 'image analysis'],
  authors: [{ name: 'Fashion AI Team' }],
  creator: 'Fashion AI Team',
  publisher: 'Fashion AI Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'AI Fashion Extractor',
    description: 'Extract fashion attributes from images using advanced AI',
    url: 'http://localhost:3000',
    siteName: 'AI Fashion Extractor',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Fashion Extractor',
    description: 'Extract fashion attributes from images using advanced AI',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
          {children}
        </div>
      </body>
    </html>
  )
}
