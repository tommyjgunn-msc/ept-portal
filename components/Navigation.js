// components/Navigation.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';
import { FuturimiWordmark, AluMark } from './Futurimi';

const StatusBadge = ({ status, children, className = "" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const statusClasses = {
    active: "bg-ftm-green/[.14] text-ftm-green",
    pending: "bg-ftm-amber/[.14] text-ftm-amber",
    inactive: "bg-ftm-slate/[.14] text-ftm-slate"
  };
  return (
    <span className={`${baseClasses} ${statusClasses[status]} ${className}`}>
      {children}
    </span>
  );
};

const NavigationSkeleton = () => (
  <nav className="bg-ftm-bar border-b border-white/[.08]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center">
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse"></div>
          <div className="h-8 w-20 bg-white/10 rounded animate-pulse"></div>
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

  const isLoginPage = useMemo(() => router.pathname === '/login', [router.pathname]);
  const isHomePage = useMemo(() => router.pathname === '/home', [router.pathname]);
  const isTestPortal = useMemo(() => router.pathname === '/test-portal', [router.pathname]);

  // Load user data from sessionStorage + verify via /api/me
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const storedUserData = sessionStorage.getItem('userData');
        const storedBookingDetails = sessionStorage.getItem('bookingDetails');

        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
        }
        if (storedBookingDetails) {
          setBookingDetails(JSON.parse(storedBookingDetails));
        }

        // Verify session is still valid via cookie (non-blocking)
        // Don't redirect on failure — let individual API calls handle auth.
        // This prevents redirect loops right after login.
        if (storedUserData && !isLoginPage) {
          try {
            const meRes = await fetch('/api/me');
            if (meRes.ok) {
              const meData = await meRes.json();
              // Refresh CSRF token
              if (meData.csrfToken) {
                sessionStorage.setItem('csrfToken', meData.csrfToken);
              }
            } else if (meRes.status === 401) {
              // Session truly expired — clear and redirect
              sessionStorage.removeItem('userData');
              sessionStorage.removeItem('bookingDetails');
              sessionStorage.removeItem('csrfToken');
              setUserData(null);
              setBookingDetails(null);
              router.push('/login');
            }
            // For other errors (network, 500, etc.) — keep local data, don't redirect
          } catch {
            // Network error — keep local data
          }
        }
      } catch {
        // Network error — keep local data for now
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router.pathname]);

  // Test time calculation
  const testTimeCalculation = useMemo(() => {
    if (!bookingDetails?.selectedDate) return { isTestTime: false, isTestActive: false };
    if (isTestMode) return { isTestTime: true, isTestActive: true };

    try {
      const now = getCurrentTime();
      const is10AM = now.getHours() >= 10;
      const [, day, month] = bookingDetails.selectedDate.match(/(\d+)\s+(\w+)/);
      const testDate = new Date(`${month} ${day}, ${now.getFullYear()}`);
      const isSameDay = testDate.getDate() === now.getDate() &&
                       testDate.getMonth() === now.getMonth() &&
                       testDate.getFullYear() === now.getFullYear();
      const calculatedIsTestTime = isSameDay && is10AM;
      return { isTestTime: calculatedIsTestTime, isTestActive: calculatedIsTestTime || isTestMode };
    } catch {
      return { isTestTime: false, isTestActive: false };
    }
  }, [bookingDetails?.selectedDate, isTestMode, getCurrentTime]);

  useEffect(() => {
    setIsTestTime(testTimeCalculation.isTestTime);
  }, [testTimeCalculation.isTestTime]);

  // Sign out — destroy server session + clear local
  const handleSignOut = useCallback(async () => {
    try {
      const csrfToken = sessionStorage.getItem('csrfToken');
      await fetch('/api/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
      });
    } catch {
      // Best-effort — clear local state regardless
    }
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('bookingDetails');
    sessionStorage.removeItem('csrfToken');
    setUserData(null);
    setBookingDetails(null);
    router.push('/login');
  }, [router]);

  // Close menu on route change / outside click
  useEffect(() => { setUserMenuOpen(false); }, [router.pathname]);
  useEffect(() => {
    if (!userMenuOpen || typeof document === 'undefined') return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  const shouldShowTestLink = useMemo(() => isHomePage && bookingDetails, [isHomePage, bookingDetails]);
  const isTestActive = testTimeCalculation.isTestActive;

  if (isLoading && !isLoginPage) return <NavigationSkeleton />;

  // No separate navigation on login — the login page handles its own header
  if (isLoginPage) {
    return null;
  }

  return (
    <nav className="bg-ftm-bar border-b border-white/[.08] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/home" className="flex-shrink-0 flex items-center gap-2.5 group">
              <AluMark height={14} opacity={0.5} />
              <FuturimiWordmark size={15} ink="#F3F0EA" diamond="#E0273F" />
            </Link>

            {isTestPortal && (
              <div className="ml-6 flex items-center space-x-2">
                <div className="w-2 h-2 bg-ftm-green rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-ftm-slate">Test in Progress</span>
              </div>
            )}
          </div>

          {userData?.name && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-ftm-ink">
                    Welcome, {userData.name}
                  </p>
                  {bookingDetails?.selectedDate && (
                    <p className="text-xs text-ftm-dim">
                      Test: {bookingDetails.selectedDate}
                    </p>
                  )}
                </div>
              </div>

              {shouldShowTestLink && (
                <div className="relative">
                  <Link
                    href="/test-portal"
                    className={`
                      relative overflow-hidden px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200
                      ${isTestActive
                        ? 'text-white bg-ftm-red hover:bg-[#C51F35] shadow-redglow'
                        : 'text-ftm-dim bg-ftm-slate/[.12] cursor-not-allowed'
                      }
                    `}
                    onClick={e => !isTestActive && e.preventDefault()}
                  >
                    <span className="relative">
                      {isTestActive ? (
                        <>
                          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                          Access Test
                        </>
                      ) : (
                        `Test: ${bookingDetails.selectedDate}`
                      )}
                    </span>
                  </Link>
                  {isTestActive && (
                    <StatusBadge status="active" className="absolute -top-2 -right-2">Live</StatusBadge>
                  )}
                </div>
              )}

              <div className="relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center p-2 rounded-full text-ftm-dim hover:text-ftm-slate hover:bg-white/5 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-ftm-slate/[.14] rounded-full flex items-center justify-center">
                    <span className="text-ftm-slate text-sm font-bold font-grotesk">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-ftm-up rounded-lg shadow-lg border border-white/[.08] z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-white/[.07]">
                        <p className="text-sm font-medium text-ftm-ink">{userData.name}</p>
                        <p className="text-xs text-ftm-dim">EPT ID: {userData.eptId}</p>
                      </div>
                      {bookingDetails && (
                        <div className="px-4 py-2 border-b border-white/[.07]">
                          <p className="text-xs text-ftm-dim">Test Date</p>
                          <p className="text-sm font-medium text-ftm-ink">{bookingDetails.selectedDate}</p>
                        </div>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-ftm-red hover:bg-ftm-red/10 transition-colors"
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

      {userData?.name && (
        <div className="sm:hidden bg-ftm-night border-t border-white/[.07] px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ftm-ink">{userData.name}</p>
              {bookingDetails?.selectedDate && (
                <p className="text-xs text-ftm-dim">Test: {bookingDetails.selectedDate}</p>
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
