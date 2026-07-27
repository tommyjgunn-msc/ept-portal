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
    <div className="min-h-screen bg-ftm-night py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-ftm-card border border-white/[.08] rounded-[10px] overflow-hidden">
          <div className="px-4 py-5 border-b border-white/[.07] sm:px-6 bg-ftm-up">
            <h2 className="font-grotesk text-2xl font-bold text-ftm-ink">
              Your Futurimi results
            </h2>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {['reading', 'writing', 'listening'].map((type) => {
                const testResult = results[type];
                return (
                  <div key={type} className="border-b border-white/[.07] pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-ftm-ink capitalize">
                        {type} Test
                      </h3>
                      {testResult && testResult.attempts > 1 && (
                        <span className="text-sm text-ftm-dim">
                          {testResult.attempts} attempts
                        </span>
                      )}
                    </div>
                    {testResult ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-ftm-mut">Score:</span>
                          <span className="font-medium text-ftm-ink">
                            {type === 'writing' 
                              ? 'Pending Review'
                              : `${testResult.score} / ${testResult.total_points}`
                            }
                          </span>
                        </div>
                        {type !== 'writing' && (
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-ftm-green rounded-full h-2"
                              style={{ 
                                width: `${(testResult.score / testResult.total_points) * 100}%` 
                              }}
                            />
                          </div>
                        )}
                        <div className="flex justify-between text-sm text-ftm-dim">
                          <span>Completed:</span>
                          <span>
                            {new Date(testResult.submission_date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-ftm-dim">
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