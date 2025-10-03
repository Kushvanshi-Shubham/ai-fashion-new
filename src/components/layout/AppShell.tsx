'use client';

import { ReactNode, useState } from 'react';

import Header from './Header';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content Area */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-out",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <Header />
        
        <main className={cn(
          "flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}