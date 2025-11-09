'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try direct connection to backend
        const response = await fetch('http://localhost:3001/api/dashboard');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error connecting to the API</p>
        <p>{error}</p>
        <p className="mt-2">Please make sure your backend server is running on http://localhost:3001</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
        <p className="font-bold">Successfully connected to the API!</p>
        <p>Backend URL: http://localhost:3001/api/dashboard</p>
      </div>
      
      <div className="bg-white shadow-md rounded p-4">
        <h2 className="text-xl font-semibold mb-3">Response Data:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>If you see data above, your API connection is working correctly!</li>
          <li>You can now update your components to use the API endpoints.</li>
          <li>Example fetch: 
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">
              fetch('http://localhost:3001/api/dashboard')
            </code>
          </li>
        </ol>
      </div>
    </div>
  );
}
