"use client"

import Link from 'next/link'
import { BarChart3, Settings, Database, Sparkles, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">Fashion AI</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" role="navigation" aria-label="Main navigation">
            <Link href="/" className="nav-link" aria-label="Go to extraction page">
              Extraction
            </Link>
            <Link href="/analytics" className="nav-link" aria-label="View analytics dashboard">
              <BarChart3 className="w-4 h-4" aria-hidden="true" />
              Analytics
            </Link>
            <Link href="/rich-tables" className="nav-link" aria-label="Browse data tables">
              <Database className="w-4 h-4" aria-hidden="true" />
              Tables
            </Link>
            <Link href="/admin" className="nav-link text-subtle" aria-label="Access admin panel">
              <Settings className="w-4 h-4" aria-hidden="true" />
              Admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            aria-label="Open mobile menu"
            aria-expanded="false"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
