// pages/test-portal.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isTestDay } from '../utils/dateUtils';

export default function TestPortal() {
  const [testLinks, setTestLinks] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAccessAndFetchLinks() {
      // Get booking details from session storage
      const bookingDetails = sessionStorage.getItem('bookingDetails');
      if (!bookingDetails) {
        router.push('/login');
        return;
      }

      const { selectedDate } = JSON.parse(bookingDetails);
      
      // Check if it's test day
      if (!isTestDay(selectedDate)) {
        setError('Test links are only available on your scheduled test day.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/test-links');
        if (!response.ok) {
          throw new Error('Failed to fetch test links');
        }
        const data = await response.json();
        setTestLinks(data);
      } catch (error) {
        setError('Failed to load test links. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    checkAccessAndFetchLinks();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-indigo-600 hover:text-indigo-500"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">EPT Test Portal</h1>
        
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Component
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Link
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testLinks && Object.entries(testLinks).map(([type, link]) => (
                <tr key={type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                    {type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-800"
                    >
                      Test Link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-100 rounded-md p-4">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">Important Instructions</h2>
          <ul className="list-disc pl-5 text-yellow-700 space-y-2">
            <li>Ensure you have a stable internet connection</li>
            <li>Keep your EPT ID handy - you'll need it for the tests</li>
            <li>Complete all sections in order</li>
            <li>Contact support immediately if you encounter any technical issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}