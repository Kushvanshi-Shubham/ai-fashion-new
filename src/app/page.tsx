import React from 'react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Fashion App</h1>
      <p className="text-sm text-gray-600">Simplified interface. Navigate to start:</p>
      <ul className="list-disc list-inside space-y-1">
        <li><Link className="text-blue-600 underline" href="/category-workflow">Category Workflow</Link></li>
        <li><Link className="text-blue-600 underline" href="/dashboard">Dashboard (legacy simplified)</Link></li>
      </ul>
    </div>
  )
}