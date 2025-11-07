'use client';

import Link from 'next/link';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="text-9xl font-bold text-gray-200 dark:text-gray-700">
          404
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <FiHome className="h-5 w-5" />
            <span>Go to Homepage</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
