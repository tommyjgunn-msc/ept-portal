// pages/home.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isTestDay } from '../utils/dateUtils';

export default function Home() {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const details = sessionStorage.getItem('bookingDetails');
    if (!details) {
      router.push('/login');
      return;
    }
    setBookingDetails(JSON.parse(details));
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const testDate = new Date(bookingDetails.selectedDate);
  const today = new Date();
  const testHasPassed = testDate < today;
  const isToday = isTestDay(bookingDetails.selectedDate);
  const currentTime = today.getHours();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow px-8 py-6">
          <h1 className="text-3xl font-bold text-center mb-8">Welcome to EPT Portal</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md">
              <h2 className="text-lg font-medium text-blue-800">Your Test Details</h2>
              <p className="mt-2 text-blue-700">
                You are registered for: <span className="font-semibold">{bookingDetails.selectedDate}</span>
              </p>
            </div>

            {testHasPassed ? (
              <div className="bg-yellow-50 p-4 rounded-md">
                <h2 className="text-lg font-medium text-yellow-800">Test Status</h2>
                <p className="mt-2 text-yellow-700">
                  Your test date has passed! If you successfully finished the test, please wait and you'll 
                  receive your results. Otherwise, reach out to thewritingcentre@alueducation.com for support.
                </p>
              </div>
            ) : isToday ? (
              <div className="bg-green-50 p-4 rounded-md">
                <h2 className="text-lg font-medium text-green-800">Test Day Information</h2>
                {currentTime < 10 ? (
                  <p className="mt-2 text-green-700">
                    Your test begins today at 10 AM. Please return at that time to access your test materials.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-green-700">
                      Your test is now available!
                    </p>
                    <button
                      onClick={() => router.push('/test-portal')}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                    >
                      Access Test Portal
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-700">
                  Please return on your scheduled test date. The test portal will be available at 10 AM.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}