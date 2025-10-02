
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata: Metadata = {
  title: {
    default: 'AI Fashion Extractor',
    template: '%s | AI Fashion Extractor'
  },
  description: 'Advanced AI-powered fashion attribute extraction system with computer vision capabilities',
  keywords: [
    'AI fashion',
    'attribute extraction',
    'computer vision',
    'fashion analysis',
    'GPT-4 Vision',
    'machine learning',
    'fashion technology'
  ],
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
    type: 'website',
    locale: 'en_US',
    url: 'https://ai-fashion-extractor.vercel.app',
    title: 'AI Fashion Extractor - Advanced Fashion Analysis',
    description: 'Extract fashion attributes from images using advanced AI with 95%+ accuracy',
    siteName: 'AI Fashion Extractor',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AI Fashion Extractor - Advanced Fashion Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Fashion Extractor - Advanced Fashion Analysis',
    description: 'Extract fashion attributes from images using advanced AI with 95%+ accuracy',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.openai.com" />
      </head>
      <body 
        className="min-h-screen bg-white antialiased" 
        suppressHydrationWarning
      >
        <Providers>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}