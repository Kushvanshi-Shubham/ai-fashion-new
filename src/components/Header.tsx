"use client"

import Link from 'next/link'
import { Palette, BarChart3, Settings, Database, Sparkles, Menu, Zap } from 'lucide-react'
import { ThemeToggleCompact } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full glass-effect border-b border-border/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 motion-safe:transition-colors"
      role="banner"
    >
      <a href="#main" className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-[100] bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm shadow-soft">Skip to main content</a>
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between safe-px gap-4">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-3 group" aria-label="Go to home">
          <div className="relative transition-transform duration-300 ease-out will-change-transform group-hover:scale-105 active:scale-95">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-soft relative overflow-hidden" aria-hidden="true">
              <Sparkles className="w-4 h-4 text-primary-foreground relative z-10 drop-shadow" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground leading-tight">Fashion AI</span>
              <span className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wide">Professional Analysis</span>
            </div>
            <Badge variant="secondary" className="text-[10px] px-2 py-1 gradient-soft border-0 text-primary font-semibold tracking-wide uppercase" aria-label="Pro tier">
              <Zap className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
          <NavLink href="/" icon={Palette} label="Extraction" />
          <NavLink href="/analytics" icon={BarChart3} label="Analytics" />
          <NavLink href="/rich-tables" icon={Database} label="Tables" />
          <Separator orientation="vertical" className="h-6 mx-2 bg-border/60" />
          <NavLink href="/admin" icon={Settings} label="Admin" variant="muted" />
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <ThemeToggleCompact />
          <Button variant="ghost" size="sm" className="md:hidden glass-effect border border-border/40 hover:bg-muted/60" aria-label="Open navigation menu">
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className="md:hidden border-t border-border/50 glass-effect motion-fade-in"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <nav className="grid grid-cols-4 gap-1 px-4 py-3">
          <MobileNavLink href="/" icon={Palette} label="Extract" />
          <MobileNavLink href="/analytics" icon={BarChart3} label="Analytics" />
          <MobileNavLink href="/rich-tables" icon={Database} label="Tables" />
          <MobileNavLink href="/admin" icon={Settings} label="Admin" />
        </nav>
      </div>
    </header>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  variant?: 'default' | 'muted'
}

function NavLink({ href, icon: Icon, label, variant = 'default' }: NavLinkProps) {
  return (
    <Link href={href} aria-label={label} className="group focus:outline-none">
      <Button
        variant="ghost"
        size="sm"
        className={`nav-pill px-4 py-2 h-9 transition-transform duration-200 group-hover:scale-[1.02] active:scale-95 ${variant === 'muted' ? 'text-muted-foreground hover:text-foreground' : ''}`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </Button>
    </Link>
  )
}

interface MobileNavLinkProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

function MobileNavLink({ href, icon: Icon, label }: MobileNavLinkProps) {
  return (
    <Link href={href} aria-label={label} className="group">
      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center space-y-1 h-auto py-2 surface-muted hover:bg-muted/70 transition-transform duration-200 group-active:scale-95"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
      </Button>
    </Link>
  )
}