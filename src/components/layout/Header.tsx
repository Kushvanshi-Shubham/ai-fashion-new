'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Palette, BarChart3, Settings, Database, Sparkles, Menu, Zap } from 'lucide-react'
import { ThemeToggleCompact } from '../ThemeToggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function Header() {
  return (
    <motion.header 
      className="sticky top-0 z-50 w-full glass-effect border-b border-border/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70" 
      role="banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between safe-px gap-4">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-soft">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground">Fashion AI</span>
              <span className="text-xs text-muted-foreground">Professional Analysis</span>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              <Zap className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-1">
          <NavLink href="/" icon={Palette} label="Extraction" />
          <NavLink href="/analytics" icon={BarChart3} label="Analytics" />
          <NavLink href="/rich-tables" icon={Database} label="Tables" />
          <Separator orientation="vertical" className="h-6 mx-2" />
          <NavLink href="/admin" icon={Settings} label="Admin" variant="muted" />
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggleCompact />
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
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
    <Link href={href}>
      <Button 
        variant="ghost" 
        size="sm" 
        className={`gap-2 px-3 py-2 h-auto font-medium transition-all duration-200 ${
          variant === 'muted' ? 'text-muted-foreground hover:text-foreground' : ''
        }`}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden lg:inline">{label}</span>
      </Button>
    </Link>
  )
}
