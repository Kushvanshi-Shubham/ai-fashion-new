'use client'

import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const themes = [
    { key: 'light' as const, label: 'Light', icon: Sun },
    { key: 'dark' as const, label: 'Dark', icon: Moon },
    { key: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {themes.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={theme === key ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme(key)}
          className="flex items-center gap-2"
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}

export function ThemeToggleCompact({ className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const themes = [
    { key: 'light' as const, label: 'Light', icon: Sun },
    { key: 'dark' as const, label: 'Dark', icon: Moon },
    { key: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <div className={`flex items-center bg-muted rounded-lg p-1 ${className}`}>
      {themes.map(({ key, label, icon: Icon }) => (
        <Button
          key={key}
          variant={theme === key ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme(key)}
          className="h-7 w-7 p-0"
        >
          <Icon className="w-3 h-3" />
          <span className="sr-only">{label}</span>
        </Button>
      ))}
    </div>
  )
}
