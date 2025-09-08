// components/Navigation.js - V4 Enhanced Navigation
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';

const StatusBadge = ({ status, children, className = "" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const statusClasses = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800", 
    inactive: "bg-gray-100 text-gray-800"
  };
  
  return (
    <span className={`${baseClasses} ${statusClasses[status]} ${className}`}>
      {children}
    </span>
  );
};

const NavigationSkeleton = () => (
  <nav className="bg-white shadow-sm border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  </nav>
);

export default function Navigation() {
  const [userData, setUserData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isTestTime, setIsTestTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const router = useRouter();
  const { getCurrentTime, isTestMode } = useTestMode();

  const isHomePage = router.pathname === '/home';
  const isLoginPage = router.pathname === '/login';
  const isTestPortal = router.pathname === '/test-portal';

  useEffect(() => {
    const checkUserData = async () => {
      setIsLoading(true);
      
      try {
        const storedUserData = sessionStorage.getItem('userData');
        const storedBookingDetails = sessionStorage.getItem('bookingDetails');

        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          if (parsedUserData.eptId) {
            const response = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eptId: parsedUserData.eptId })
            });
            
            if (response.ok) {
              const data = await response.json();
              setUserData(data);
            } else {
              setUserData(null);
            }
          }
        }

        if (storedBookingDetails) {
          setBookingDetails(JSON.parse(storedBookingDetails));
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setUserData(null);
      } finally {
        setIsLoading(false);
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

  const handleSignOut = () => {
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('bookingDetails');
    router.push('/login');
  };

  const shouldShowTestLink = isHomePage && bookingDetails;
  const isTestActive = isTestTime || isTestMode;

  // Show skeleton loader while loading
  if (isLoading && !isLoginPage) {
    return <NavigationSkeleton />;
  }

  // Simplified navigation for login page
  if (isLoginPage) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  EPT Portal
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-700 group-hover:to-purple-700 transition-all duration-200">
                EPT Portal
              </span>
            </Link>
            
            {/* Test Status Indicator */}
            {isTestPortal && (
              <div className="ml-6 flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">Test in Progress</span>
                </div>
              </div>
            )}
          </div>

          {/* User Section */}
          {userData?.name && (
            <div className="flex items-center space-x-4">
              {/* Welcome Message */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Welcome back, {userData.name}
                  </p>
                  {bookingDetails?.selectedDate && (
                    <p className="text-xs text-gray-500">
                      Test: {bookingDetails.selectedDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Test Access Button */}
              {shouldShowTestLink && (
                <div className="relative">
                  <Link
                    href="/test-portal"
                    className={`
                      relative overflow-hidden px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                      ${isTestActive
                        ? 'text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                        : 'text-gray-500 bg-gray-100 cursor-not-allowed'
                      }
                    `}
                    onClick={e => !isTestActive && e.preventDefault()}
                  >
                    {isTestActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-pulse opacity-20"></div>
                    )}
                    <span className="relative">
                      {isTestActive ? (
                        <>
                          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                          Access Test
                        </>
                      ) : (
                        `Test Available ${bookingDetails.selectedDate}`
                      )}
                    </span>
                  </Link>
                  
                  {isTestActive && (
                    <StatusBadge status="active" className="absolute -top-2 -right-2">
                      Live
                    </StatusBadge>
                  )}
                </div>
              )}

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                        <p className="text-xs text-gray-500">EPT ID: {userData.eptId}</p>
                      </div>
                      
                      {bookingDetails && (
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs text-gray-500">Test Date</p>
                          <p className="text-sm font-medium">{bookingDetails.selectedDate}</p>
                        </div>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-900 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile-friendly user info bar */}
      {userData?.name && (
        <div className="sm:hidden bg-gray-50 border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{userData.name}</p>
              {bookingDetails?.selectedDate && (
                <p className="text-xs text-gray-500">Test: {bookingDetails.selectedDate}</p>
              )}
            </div>
            {shouldShowTestLink && isTestActive && (
              <StatusBadge status="active">Test Available</StatusBadge>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
