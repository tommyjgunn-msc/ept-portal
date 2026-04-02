// pages/test-complete.js — Enhanced test progress/completion page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Badge, Alert } from '../components/UIDesignSystem';

export default function TestComplete() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const storedUserData = sessionStorage.getItem('userData');
        const storedBookingDetails = sessionStorage.getItem('bookingDetails');

        if (!storedUserData || !storedBookingDetails) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(storedUserData);
        const parsedBookingDetails = JSON.parse(storedBookingDetails);

        if (!userData.eptId) { router.push('/login'); return; }

        setBookingDetails(parsedBookingDetails);
        const response = await fetch(`/api/test-results?student_id=${userData.eptId}`);
        if (!response.ok) throw new Error('Failed to fetch results');

        setResults(await response.json());
      } catch (error) {
        setError(error.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="w-12 h-12 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your results...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.push('/home')} className="w-full">Return to Home</Button>
        </Card>
      </div>
    );
  }

  const testTypes = ['reading', 'writing', 'listening'];

  const getTestStatus = (type) => {
    if (!results?.[type]) return { status: 'not_started', label: 'Not Started', variant: 'default' };
    const t = results[type];
    const hasResponses = t.responses && Object.keys(t.responses).length > 0;

    if (type === 'writing' && hasResponses && t.score === null) {
      return { status: 'pending', label: 'Pending Review', variant: 'warning' };
    }
    if (t.completed && hasResponses) {
      return { status: 'completed', label: t.score !== null ? `${t.score}/${t.total_points}` : 'Submitted', variant: 'success' };
    }
    if (hasResponses) return { status: 'incomplete', label: 'Incomplete', variant: 'warning' };
    return { status: 'not_started', label: 'Not Started', variant: 'default' };
  };

  const allCompleted = testTypes.every(t => {
    const s = getTestStatus(t);
    return s.status === 'completed' || s.status === 'pending';
  });

  const completedCount = testTypes.filter(t => {
    const s = getTestStatus(t);
    return s.status === 'completed' || s.status === 'pending';
  }).length;

  const TEST_ICONS = {
    reading: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    writing: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />,
    listening: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {allCompleted ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tests Complete</h1>
              <p className="text-gray-600">Your results will be available after review.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Progress</h1>
              <p className="text-gray-600">{completedCount} of {testTypes.length} sections completed</p>
            </>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / testTypes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Test cards */}
        <div className="space-y-4">
          {testTypes.map((type, idx) => {
            const status = getTestStatus(type);
            const testData = results?.[type];

            return (
              <Card key={type} className="p-5" hover={false}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      status.status === 'completed' ? 'bg-green-100 text-green-600' :
                      status.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {TEST_ICONS[type]}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">{type} Test</h3>
                      {testData?.submission_date && (
                        <p className="text-xs text-gray-500">
                          {new Date(testData.submission_date).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={status.variant} size="md">{status.label}</Badge>
                </div>

                {status.status === 'completed' && testData?.score !== null && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full h-2 transition-all duration-700"
                        style={{ width: `${testData.total_points > 0 ? (testData.score / testData.total_points) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1 text-right">
                      {testData.score} / {testData.total_points} points
                    </p>
                  </div>
                )}

                {status.status === 'pending' && (
                  <div className="mt-3 bg-amber-50 rounded-lg p-3">
                    <p className="text-sm text-amber-700">Your writing is being reviewed. Results will be available soon.</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-3">
          <Button variant="secondary" onClick={() => router.push('/home')}>Back to Dashboard</Button>
          {allCompleted && (
            <Button variant="primary" onClick={() => router.push('/test-result')}>View Full Results</Button>
          )}
        </div>
      </div>
    </div>
  );
}
