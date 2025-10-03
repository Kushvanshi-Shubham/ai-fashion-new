'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard as the main landing page
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-2">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-muted/60 rounded mx-auto" />
        </div>
      </div>
    </div>
  )
}
