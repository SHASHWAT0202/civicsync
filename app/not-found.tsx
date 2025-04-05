import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '@/components/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
          <div className="w-16 h-1 bg-blue-600 mx-auto my-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or may have been moved. 
            Don't worry, you can return to the dashboard or home page.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Return to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home Page
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 