// pages/registration-complete.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppSkeleton } from '@/components/LoadingStates';

export default function RegistrationComplete() {
  const [bookingDetails, setBookingDetails] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const details = sessionStorage.getItem('bookingDetails');
    if (!details) {
      router.push('/login');
      return;
    }
    setBookingDetails(JSON.parse(details));
  }, [router]);

  if (!bookingDetails) {
  return <AppSkeleton />;
}

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Thank You for Registering!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your EPT test is scheduled for:
          </p>
          <p className="mt-1 text-lg font-semibold text-indigo-600">
            {bookingDetails.selectedDate}
          </p>
          <div className="mt-8 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Please return on your test date to access your test materials. The test portal will be available on the day of your test.
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-8 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
