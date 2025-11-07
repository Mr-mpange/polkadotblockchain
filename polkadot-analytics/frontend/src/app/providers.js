'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiBarChart2, FiDollarSign, FiGrid, FiActivity } from 'react-icons/fi';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }));

  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: FiHome },
    { href: '/dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { href: '/tvl', label: 'TVL', icon: FiDollarSign },
    { href: '/parachains', label: 'Parachains', icon: FiGrid },
    { href: '/activity', label: 'Activity', icon: FiActivity },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-background">
          {/* Navigation */}
          {pathname !== '/' && (
            <nav className="bg-card border-b border-border sticky top-0 z-50">
              <div className="container mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg"></div>
                    <span className="font-bold text-xl text-foreground">Polkadot Analytics</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
          )}

          {/* Main Content */}
          <main>{children}</main>

          {/* Footer */}
          {pathname !== '/' && (
            <footer className="bg-card border-t border-border mt-12">
              <div className="container mx-auto px-6 py-8">
                <div className="text-center text-muted-foreground text-sm">
                  <p> 2025 Polkadot Analytics Platform. All rights reserved.</p>
                  <p className="mt-2">Real-time insights for the Polkadot ecosystem</p>
                </div>
              </div>
            </footer>
          )}
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
