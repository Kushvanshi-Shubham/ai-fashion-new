'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  BarChart3,
  Bot,
  Camera,
  Database,
  FolderOpen,
  Home,
  Settings,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'

// Menu items for the sidebar
const menuItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
      },
      {
        title: 'Analytics',
        url: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      {
        title: 'Category Workflow',
        url: '/category-workflow',
        icon: Workflow,
      },
      {
        title: 'Batch Processing',
        url: '/batch',
        icon: Bot,
      },
      {
        title: 'Image Upload',
        url: '/upload',
        icon: Camera,
      },
    ],
  },
  {
    title: 'Data',
    items: [
      {
        title: 'Rich Tables',
        url: '/rich-tables',
        icon: Database,
      },
      {
        title: 'Discovery',
        url: '/discovery',
        icon: Sparkles,
      },
      {
        title: 'Categories',
        url: '/categories',
        icon: FolderOpen,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Admin',
        url: '/admin',
        icon: Users,
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">AI Fashion</span>
            <span className="truncate text-xs text-muted-foreground">
              Attribute Extraction
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          'group/item relative overflow-hidden transition-all hover:bg-accent/50',
                          isActive && 'bg-accent text-accent-foreground font-medium'
                        )}
                      >
                        <Link href={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                          {isActive && (
                            <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
