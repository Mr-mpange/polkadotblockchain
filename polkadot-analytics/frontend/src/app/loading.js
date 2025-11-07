export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-900 dark:text-white text-lg font-medium">Loading...</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Please wait while we prepare your dashboard</p>
      </div>
    </div>
  );
}
