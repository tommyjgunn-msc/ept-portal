import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TestComplete() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      console.log('Starting fetchResults...');
      try {
        // Get and validate session data
        const storedUserData = sessionStorage.getItem('userData');
        const storedBookingDetails = sessionStorage.getItem('bookingDetails');
        
        if (!storedUserData || !storedBookingDetails) {
          console.log('Missing session data, redirecting to login');
          router.push('/login');
          return;
        }

        let userData, parsedBookingDetails;
        try {
          userData = JSON.parse(storedUserData);
          parsedBookingDetails = JSON.parse(storedBookingDetails);
          console.log('Session data parsed successfully');
        } catch (e) {
          console.error('Error parsing session data:', e);
          router.push('/login');
          return;
        }

        if (!userData.eptId) {
          console.error('Invalid user data: missing eptId');
          router.push('/login');
          return;
        }

        setBookingDetails(parsedBookingDetails);
        
        // Fetch test results
        console.log('Fetching results for eptId:', userData.eptId);
        const response = await fetch(`/api/test-results?student_id=${userData.eptId}`);
        console.log('API response status:', response.status);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.error('Error response from API:', errorData);
          } catch (e) {
            console.error('Could not parse error response:', e);
            throw new Error('Invalid response from server');
          }
          throw new Error(errorData.message || 'Failed to fetch results');
        }

        const data = await response.json();
        console.log('Results retrieved successfully:', data);
        setResults(data);
      } catch (error) {
        console.error('Error in fetchResults:', error);
        setError(error.message || 'An unexpected error occurred');
      } finally {
        console.log('Setting loading state to false');
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

  const isTestTimeValid = () => {
    if (!bookingDetails?.selectedDate) return false;
    const testDate = new Date(bookingDetails.selectedDate);
    const now = new Date();
    const is10AM = now.getHours() >= 10;
    
    return testDate.getDate() === now.getDate() &&
           testDate.getMonth() === now.getMonth() &&
           testDate.getFullYear() === now.getFullYear() &&
           is10AM;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-medium text-gray-600">Loading your results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-medium text-red-600 mb-4">Error Loading Results</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const testTypes = ['reading', 'writing', 'listening'];
  const getTestStatus = (type) => {
    if (!results || !results[type]) {
      return { status: 'not_started', message: 'Not Started' };
    }

    const testData = results[type];
    
    // Check if test data actually has responses
    const hasResponses = testData.responses && 
                        Object.keys(testData.responses).length > 0;
    
    // For writing test
    if (type === 'writing') {
      if (!hasResponses) {
        return { status: 'not_started', message: 'Not Started' };
      }
      if (testData.score === null) {
        return { status: 'pending', message: 'Pending Review' };
      }
    }

    // For reading and listening tests
    if (type === 'reading' || type === 'listening') {
      if (!hasResponses) {
        return { status: 'not_started', message: 'Not Started' };
      }
    }

    if (testData.completed && hasResponses) {
      return { 
        status: 'completed', 
        message: testData.score !== null ? `${testData.score}/${testData.total_points}` : 'Pending'
      };
    }

    // If we have data but no responses, it's incomplete
    return { status: 'incomplete', message: 'Incomplete' };
  };

  const allTestsCompleted = testTypes.every(type => {
    const status = getTestStatus(type);
    return status.status === 'completed' || status.status === 'pending';
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Test Progress
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {allTestsCompleted 
                ? 'All tests completed. Your results will be available here.'
                : 'You have incomplete tests. Please complete all sections when available.'}
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {testTypes.map(type => {
                const status = getTestStatus(type);
                const testData = results?.[type];

                return (
                  <div key={type} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {type} Test
                      </h3>
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        status.status === 'completed' ? 'bg-green-100 text-green-800' :
                        status.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {status.message}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {testData && (
                        <>
                          {status.status === 'completed' && (
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 rounded-full h-2"
                                style={{ 
                                  width: `${(testData.score / testData.total_points) * 100}%` 
                                }}
                              />
                            </div>
                          )}

                          {testData.submission_date && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Completed:</span>
                              <span className="text-gray-900">
                                {formatDate(testData.submission_date)}
                              </span>
                            </div>
                          )}

                          {status.status === 'pending' && (
                            <div className="mt-2 bg-yellow-50 p-3 rounded-md">
                              <p className="text-sm text-yellow-700">
                                Your writing test is being reviewed. Results will be available soon.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {status.status === 'not_started' && isTestTimeValid() && (
                        <div className="mt-4">
                          <button
                            onClick={() => router.push('/test-portal')}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm"
                          >
                            Start Test
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!allTestsCompleted && !isTestTimeValid() && bookingDetails?.selectedDate && (
              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700">
                  Remaining tests will be available at 10 AM on your scheduled test date: {bookingDetails.selectedDate}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}