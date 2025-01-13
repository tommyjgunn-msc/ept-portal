// components/Navigation.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const [userData, setUserData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isTestTime, setIsTestTime] = useState(false);
  const router = useRouter();

  // Only show test link on home page
  const isHomePage = router.pathname === '/home';
  const isLoginPage = router.pathname === '/login';

  // Single useEffect to handle all session storage and user data
  useEffect(() => {
    const checkUserData = async () => {
      const storedUserData = sessionStorage.getItem('userData');
      const storedBookingDetails = sessionStorage.getItem('bookingDetails');

      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          
          // Only fetch user details if we have an EPTID
          if (parsedUserData.eptId) {
            const response = await fetch('/api/auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ eptId: parsedUserData.eptId })
            });
            
            if (response.ok) {
              const data = await response.json();
              setUserData(data);
            }
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      if (storedBookingDetails) {
        setBookingDetails(JSON.parse(storedBookingDetails));
      }
    };

    checkUserData();
  }, [router.pathname]); // Re-run when route changes

  // Check if it's test day and after 10 AM
  useEffect(() => {
    if (bookingDetails?.selectedDate) {
      const testDate = new Date(bookingDetails.selectedDate);
      const now = new Date();
      const is10AM = now.getHours() >= 10;
      
      const isSameDay = testDate.getDate() === now.getDate() &&
                       testDate.getMonth() === now.getMonth() &&
                       testDate.getFullYear() === now.getFullYear();

      setIsTestTime(isSameDay && is10AM);
    }
  }, [bookingDetails]);

  // Don't show any navigation elements on login page
  if (isLoginPage) {
    return (
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <span className="flex-shrink-0 flex items-center text-2xl font-bold text-indigo-600">
                EPT Portal
              </span>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-indigo-600">EPT Portal</span>
            </Link>
          </div>

          {userData?.name && (
            <div className="flex items-center space-x-4">
              {/* Welcome message - show on all pages except login when user is logged in */}
              <span className="text-gray-600">
                Welcome, {userData.name}
              </span>

              {/* Test link - only show on home page if registered */}
              {isHomePage && bookingDetails && (
                <Link
                  href="/test-portal"
                  className={`ml-4 px-3 py-2 rounded-md text-sm font-medium ${
                    isTestTime
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                  onClick={e => !isTestTime && e.preventDefault()}
                >
                  {isTestTime ? 'Access Test' : `Test Available on ${bookingDetails.selectedDate}`}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}