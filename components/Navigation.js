// components/Navigation.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';

export default function Navigation() {
  const [userData, setUserData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isTestTime, setIsTestTime] = useState(false);
  const router = useRouter();
  const { getCurrentTime, isTestMode } = useTestMode();

  const isHomePage = router.pathname === '/home';
  const isLoginPage = router.pathname === '/login';

  useEffect(() => {
    const checkUserData = async () => {
      const storedUserData = sessionStorage.getItem('userData');
      const storedBookingDetails = sessionStorage.getItem('bookingDetails');

      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
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
  }, [router.pathname]);

  useEffect(() => {
    if (bookingDetails?.selectedDate) {
      if (isTestMode) {
        setIsTestTime(true);
        return;
      }
      
      const now = getCurrentTime();
      const is10AM = now.getHours() >= 10;
      
      const [, day, month] = bookingDetails.selectedDate.match(/(\d+)\s+(\w+)/);
      const testDate = new Date(`${month} ${day}, 2025`);
      
      const isSameDay = testDate.getDate() === now.getDate() &&
                       testDate.getMonth() === now.getMonth() &&
                       testDate.getFullYear() === now.getFullYear();

      setIsTestTime(isSameDay && is10AM);
    }
  }, [bookingDetails, isTestMode, getCurrentTime]);

  const shouldShowTestLink = isHomePage && bookingDetails;
  const isTestActive = isTestTime || isTestMode;

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
              <span className="text-gray-600">
                Welcome, {userData.name}
              </span>

              {shouldShowTestLink && (
                <Link
                  href="/test-portal"
                  className={`ml-4 px-3 py-2 rounded-md text-sm font-medium ${
                    isTestActive
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                      : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                  }`}
                  onClick={e => !isTestActive && e.preventDefault()}
                >
                  {isTestActive ? 'Access Test' : `Test Available on ${bookingDetails.selectedDate}`}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}