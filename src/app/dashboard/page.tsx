'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Activity, 
  ArrowUpRight, 
  Bot, 
  Camera, 
  Clock, 
  Database, 
  Download, 
  Eye, 
  Plus,
  TrendingUp 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

// Preserve the original business logic for dashboard stats
const summary = [
  { 
    label: 'Total Extractions', 
    value: '1,247',
    description: '+12% from last month',
    trend: 'up',
    icon: Database,
    color: 'text-blue-600'
  },
  { 
    label: 'Success Rate', 
    value: '94.7%',
    description: '+2.1% from last month',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-green-600'
  },
  { 
    label: 'Categories', 
    value: '283',
    description: '+15 new categories',
    trend: 'up',
    icon: Bot,
    color: 'text-purple-600'
  },
  { 
    label: 'Avg. Processing', 
    value: '2.4s',
    description: '-0.3s improvement',
    trend: 'up',
    icon: Clock,
    color: 'text-orange-600'
  }
]

// Preserve the original business logic for recent activity
const recentActivity = [
  { id: 1, name: 'summer_dress_1.jpg', status: 'completed', time: '1 min ago', confidence: 96 },
  { id: 2, name: 'winter_coat_2.jpg', status: 'completed', time: '2 min ago', confidence: 94 },
  { id: 3, name: 'casual_shirt_3.jpg', status: 'processing', time: '3 min ago', confidence: null },
  { id: 4, name: 'formal_pants_4.jpg', status: 'completed', time: '4 min ago', confidence: 91 },
  { id: 5, name: 'sports_shoes_5.jpg', status: 'completed', time: '5 min ago', confidence: 98 }
]

const quickActions = [
  {
    title: 'Start New Extraction',
    description: 'Upload images and begin AI processing',
    href: '/category-workflow',
    icon: Plus,
    variant: 'default' as const
  },
  {
    title: 'View All Results',
    description: 'Browse extraction history and results',
    href: '/rich-tables',
    icon: Eye,
    variant: 'secondary' as const
  },
  {
    title: 'Export Data',
    description: 'Download reports and analytics',
    href: '/analytics',
    icon: Download,
    variant: 'outline' as const
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Stats Grid */}
      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={itemVariants}
      >
        {summary.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                  <span>{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <motion.div className="lg:col-span-2" variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest extraction jobs and their status
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/rich-tables">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Camera className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={item.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                        {item.confidence && (
                          <span className="text-xs text-muted-foreground">
                            {item.confidence}% confidence
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                    {item.status === 'processing' && (
                      <Progress value={65} className="mt-1 w-16" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="space-y-6" variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.title}
                    variant={action.variant}
                    className="w-full justify-start h-auto p-4"
                    asChild
                  >
                    <Link href={action.href}>
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{action.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {action.description}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>API Health</span>
                  <Badge variant="default" className="bg-green-500 text-white">
                    Operational
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Queue</span>
                  <span className="text-muted-foreground">3 jobs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span className="text-muted-foreground">2.1 GB / 10 GB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
