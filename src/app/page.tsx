'use client'

// Simplified home page layout (lightweight hero + concise value props + CTA)
// Previous, more elaborate marketing blocks (stats, multi-section workflow) removed for focus & speed.
// If you need the old version, check git history prior to this commit.

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Tags, Brain, Zap, Database, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Container } from '@/components/ui/container'
import { PageSection } from '@/components/ui/page-section'

type MiniMetric = { icon: React.ReactNode; label: string; value: string }
type Feature = { icon: React.ReactNode; title: string; body: string }

export default function HomePage() {
  const metrics: MiniMetric[] = [
    { icon: <Tags className="w-4 h-4" />, label: 'Categories', value: '283' },
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Attributes', value: '80+' },
    { icon: <Brain className="w-4 h-4" />, label: 'Accuracy', value: '95%+' }
  ]

  const features: Feature[] = [
    {
      icon: <Tags className="w-5 h-5 text-primary" />,
      title: 'Structured Extraction',
      body: 'Category hierarchy drives which attributes are inferred—no noisy extras.'
    },
    {
      icon: <Brain className="w-5 h-5 text-accent" />,
      title: 'Vision + Language',
      body: 'Combines GPT-4 Vision reasoning with curated fashion taxonomies.'
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: 'Fast Turnaround',
      body: 'Batch process images in seconds with parallel inference + caching.'
    },
    {
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      title: 'Rich Export',
      body: 'Download JSON / CSV / XLSX with confidence scoring & provenance.'
    }
  ]

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <PageSection bleed className="relative overflow-hidden text-center py-24 md:py-28">
        <Container className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 motion-fade-in motion-rise">
            <Badge variant="soft" className="px-4 py-1.5 shadow-soft">
              <Sparkles className="w-4 h-4 mr-2" /> GPT-4 Vision Powered
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 text-balance motion-fade-in motion-rise [animation-delay:60ms]">
            Fashion Attribute Intelligence
            <span className="block mt-2 text-gradient">Built for real retail workflows</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 text-pretty motion-fade-in motion-rise [animation-delay:120ms]">
            Upload product imagery, select its category path, and receive clean, validated fashion attributes with confidence scoring—ready for enrichment and analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2 mb-14 motion-fade-in motion-rise [animation-delay:180ms]">
            <Link href="/category-workflow">
              <Button size="lg" variant="premium" className="group">
                Start Analysis <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/rich-tables">
              <Button variant="outline" size="lg" className="group">
                View Data <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Metrics Bar */}
          <div className="motion-fade-in [animation-delay:240ms] mt-4">
            <div className="mx-auto max-w-3xl rounded-2xl border border-border/50 bg-muted/40 backdrop-blur-sm px-4 py-3 flex divide-x divide-border/50 shadow-sm">
              {metrics.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center text-center px-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground leading-none mb-1">
                    {m.icon}
                    <span>{m.value}</span>
                  </div>
                  <span className="text-[10px] tracking-wide uppercase text-muted-foreground/80">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Added larger breathing room below metrics */}
          <div className="mt-16" />
        </Container>
        {/* subtle backdrop shapes */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/10 blur-3xl rounded-full" />
        </div>
      </PageSection>

      {/* Feature Grid */}
      <PageSection subdued borderTop>
        <Container className="max-w-5xl mx-auto">
          <div className="mb-14 text-center">
            <h2 className="text-3xl md:text-[2.6rem] font-bold tracking-tight mb-5 leading-tight">Why it works better</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty text-sm md:text-base leading-relaxed">
              Precision-first extraction pipeline grounded in curated attribute schemas and adaptive reasoning.
            </p>
          </div>
          <ul className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch" aria-label="Key capabilities">
            {features.map(f => (
              <li key={f.title} className="rounded-xl border bg-card/70 shadow-sm hover:shadow-md transition flex flex-col p-5 motion-fade-in motion-rise">
                <div className="w-10 h-10 rounded-md bg-muted/70 ring-1 ring-border/40 flex items-center justify-center mb-2">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold leading-tight mb-2 flex-none">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-grow">{f.body}</p>
                <div className="mt-4 h-px bg-border/40 w-full opacity-0 group-hover:opacity-100 transition" aria-hidden="true" />
              </li>
            ))}
          </ul>
        </Container>
      </PageSection>

      {/* Single CTA */}
      <PageSection subdued borderTop className="relative overflow-hidden pt-28">
        <Container className="max-w-4xl mx-auto text-center motion-fade-in motion-rise">
          <div className="inline-flex items-center gap-2 mb-5">
            <Badge variant="soft" className="px-3 py-1 text-[11px] font-medium tracking-wide">Get Started</Badge>
          </div>
          <h2 className="text-2xl md:text-[1.9rem] font-semibold mb-5 leading-tight">Ready to enrich your catalog?</h2>
            <p className="text-muted-foreground mb-10 text-pretty max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Start a guided extraction session now—no lengthy setup or model training cycle required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/category-workflow">
                <Button size="lg" variant="premium" className="group">
                  Launch Workflow <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/analytics">
                <Button size="lg" variant="outline">View Analytics</Button>
              </Link>
            </div>
        </Container>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] rounded-full bg-primary/5 blur-3xl" />
        </div>
      </PageSection>

      <footer className="mt-auto border-t border-border/60 py-10 text-center text-xs text-muted-foreground">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="w-4 h-4 text-primary" /> Fashion AI Platform
          </div>
          <p className="opacity-70">© 2025 • Built with structured vision intelligence</p>
        </Container>
      </footer>
    </main>
  )
}