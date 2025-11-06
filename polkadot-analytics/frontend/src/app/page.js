'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBarChart2, FiDollarSign, FiActivity, FiGrid, FiTrendingUp } from 'react-icons/fi';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  const pages = [
    {
      title: 'Dashboard',
      description: 'Overview of all metrics and analytics',
      href: '/dashboard',
      icon: FiBarChart2,
      color: 'bg-blue-500'
    },
    {
      title: 'TVL Analytics',
      description: 'Total Value Locked across parachains',
      href: '/tvl',
      icon: FiDollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Parachains',
      description: 'Explore all Polkadot parachains',
      href: '/parachains',
      icon: FiGrid,
      color: 'bg-purple-500'
    },
    {
      title: 'Activity',
      description: 'User activity and transactions',
      href: '/activity',
      icon: FiActivity,
      color: 'bg-orange-500'
    }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <FiTrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Polkadot Analytics Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time insights into Polkadot parachains, TVL, transactions, and cross-chain flows
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 ${page.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <page.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {page.description}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-blue-500">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Real-time</div>
              <p className="text-gray-600">Live data updates every 30 seconds</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">AI-Powered</div>
              <p className="text-gray-600">Machine learning predictions and insights</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">Comprehensive</div>
              <p className="text-gray-600">Track all parachains in one place</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
