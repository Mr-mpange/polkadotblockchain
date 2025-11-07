'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiAlertTriangle, FiHome, FiRefreshCw } from 'react-icons/fi';

export default function Error({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    console.error('An error occurred:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
            <FiAlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Something went wrong!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <FiRefreshCw className="h-5 w-5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <FiHome className="h-5 w-5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
