'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

// Page titles mapping
const pageTitles: Record<string, { title: string; description?: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Overview of your AI fashion extraction analytics',
  },
  '/analytics': {
    title: 'Analytics',
    description: 'Detailed insights and performance metrics',
  },
  '/category-workflow': {
    title: 'Category Workflow',
    description: 'AI-powered fashion attribute extraction workflow',
  },
  '/batch': {
    title: 'Batch Processing',
    description: 'Process multiple images simultaneously',
  },
  '/upload': {
    title: 'Image Upload',
    description: 'Upload and analyze fashion images',
  },
  '/rich-tables': {
    title: 'Rich Tables',
    description: 'Advanced data tables with filtering and sorting',
  },
  '/discovery': {
    title: 'Discovery',
    description: 'Explore and discover fashion attributes',
  },
  '/categories': {
    title: 'Categories',
    description: 'Manage fashion categories and attributes',
  },
  '/admin': {
    title: 'Admin',
    description: 'System administration and management',
  },
  '/settings': {
    title: 'Settings',
    description: 'Application configuration and preferences',
  },
}

export function Header() {
  const pathname = usePathname()
  const currentPage = pageTitles[pathname] || { title: 'AI Fashion Extractor' }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-4 h-6" />
        </div>

        {/* Page Title */}
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{currentPage.title}</h1>
          {currentPage.description && (
            <p className="text-sm text-muted-foreground">{currentPage.description}</p>
          )}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="w-64 pl-10"
            />
          </div>

          {/* Mobile search button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/user.jpg" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Fashion AI User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    user@fashionai.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                Keyboard shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
