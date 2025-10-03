'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CTASectionProps {
  title: string
  description: string
  primaryCTA: {
    label: string
    href: string
  }
  secondaryCTA?: {
    label: string
    href: string
  }
}

export function CTASection({ title, description, primaryCTA, secondaryCTA }: CTASectionProps) {
  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={primaryCTA.href}>
            <Button size="lg" className="w-full sm:w-auto">
              {primaryCTA.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          {secondaryCTA && (
            <Link href={secondaryCTA.href}>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {secondaryCTA.label}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
