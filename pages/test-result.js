// pages/test-results.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TestResults() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const userData = sessionStorage.getItem('userData');
        if (!userData) {
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/test-results?student_id=${JSON.parse(userData).eptId}`);
        if (!response.ok) throw new Error('Failed to fetch results');
        
        const data = await response.json();
        setResults(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

  if (loading) return <div>Loading your results...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your EPT Results
            </h2>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {['reading', 'writing', 'listening'].map((type) => {
                const testResult = results[type];
                return (
                  <div key={type} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {type} Test
                      </h3>
                      {testResult && (
                        <span className="text-sm text-gray-500">
                          Attempt {testResult.submission_count}
                        </span>
                      )}
                    </div>
                    {testResult ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-medium">
                            {type === 'writing' 
                              ? 'Pending Review'
                              : `${testResult.score} / ${testResult.total_points}`
                            }
                          </span>
                        </div>
                        {type !== 'writing' && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 rounded-full h-2"
                              style={{ 
                                width: `${(testResult.score / testResult.total_points) * 100}%` 
                              }}
                            />
                          </div>
                        )}
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Completed:</span>
                          <span>
                            {new Date(testResult.submission_date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No results available
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}