import './globals.css'
import React from 'react'

export const metadata = { title: 'App' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <div className="p-4 max-w-5xl mx-auto">
          {children}
        </div>
      </body>
    </html>
  )
}