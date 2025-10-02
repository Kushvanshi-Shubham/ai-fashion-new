'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Palette, BarChart3, Settings, Database, Sparkles, Menu, Zap } from 'lucide-react'
import { ThemeToggleCompact } from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Header() {
  return (
    <motion.header 
      className="sticky top-0 z-50 w-full glass-effect border-b border-border/50" 
      role="banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between safe-px">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center space-x-3 group" aria-label="Go to home">
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-soft relative overflow-hidden" aria-hidden="true">
              <Sparkles className="w-4 h-4 text-primary-foreground relative z-10" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground leading-none">Fashion AI</span>
              <span className="text-xs text-muted-foreground leading-none">Professional Analysis</span>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1 gradient-soft border-0 text-primary font-medium" aria-label="Pro tier">
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
        <div className="flex items-center space-x-3">
          <ThemeToggleCompact />
          <Button variant="ghost" size="sm" className="md:hidden glass-effect border-border/40" aria-label="Open navigation menu">
            <Menu className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div 
        className="md:hidden border-t border-border/50 glass-effect" 
        role="navigation" 
        aria-label="Mobile navigation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <nav className="grid grid-cols-4 gap-1 px-4 py-3">
          <MobileNavLink href="/" icon={Palette} label="Extract" />
          <MobileNavLink href="/analytics" icon={BarChart3} label="Analytics" />
          <MobileNavLink href="/rich-tables" icon={Database} label="Tables" />
          <MobileNavLink href="/admin" icon={Settings} label="Admin" />
        </nav>
      </motion.div>
    </motion.header>
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
    <Link href={href} aria-label={label}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button 
          variant="ghost" 
          size="sm" 
          className={`
            flex items-center space-x-2 nav-pill
            ${variant === 'muted' ? 'text-muted-foreground' : ''}
          `}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium">{label}</span>
        </Button>
      </motion.div>
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
    <Link href={href} aria-label={label}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button variant="ghost" size="sm" className="flex flex-col items-center space-y-1 h-auto py-2 surface-muted">
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      </motion.div>
    </Link>
  )
}