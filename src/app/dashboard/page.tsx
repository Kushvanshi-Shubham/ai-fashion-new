import React from 'react'

export default function DashboardPage() {
  const summary = [
    { label: 'Total Extractions', value: '1,247' },
    { label: 'Success Rate', value: '94.7%' },
    { label: 'Categories', value: '283' },
    { label: 'Avg. Processing', value: '2.4s' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Your analytics snapshot will appear here.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summary.map(card => (
          <div key={card.label} className="rounded-lg border bg-background p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{card.label}</div>
            <div className="text-2xl font-semibold">{card.value}</div>
          </div>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>summer_dress_{i}.jpg processed</span>
              <span className="text-muted-foreground">{i} min ago</span>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <button className="w-full rounded-md border p-3 text-left hover:bg-muted/50">Start New Extraction</button>
          <button className="w-full rounded-md border p-3 text-left hover:bg-muted/50">View All Results</button>
          <button className="w-full rounded-md border p-3 text-left hover:bg-muted/50">Export Data</button>
        </div>
      </section>
    </div>
  )
}
