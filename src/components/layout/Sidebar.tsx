'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Layers3, 
  Database, 
  BarChart3, 
  Settings,
  HelpCircle,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

const navigationSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
      { name: 'Category Workflow', href: '/category-workflow', icon: Layers3, badge: 'Primary' },
      { name: 'Rich Tables', href: '/rich-tables', icon: Database, badge: null },
      { name: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'Beta' },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Admin Panel', href: '/admin', icon: Settings, badge: null },
      { name: 'Help & Support', href: '/help', icon: HelpCircle, badge: null },
    ],
  },
];

export function Sidebar({ open, collapsed, onToggleCollapse, onClose }: SidebarProps) {
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <AnimatePresence>
          {!collapsed && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Fashion AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Extractor v2.0
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200",
            collapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h3 className="mb-2 px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        "hover:bg-gray-100 dark:hover:bg-gray-800",
                        isActive 
                          ? "bg-primary/10 text-primary border-r-2 border-primary shadow-sm" 
                          : "text-gray-700 dark:text-gray-300"
                      )}
                      onClick={() => onClose()}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                        isActive 
                          ? "text-primary" 
                          : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                      )} />
                      
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.div 
                            className="flex items-center justify-between flex-1"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <Badge 
                                variant={item.badge === 'Primary' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>All systems operational</span>
            </motion.div>
          ) : (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30",
        "bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        "transition-all duration-300 ease-out shadow-sm",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 lg:hidden shadow-xl"
            initial={{ x: -264 }}
            animate={{ x: 0 }}
            exit={{ x: -264 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}