// components/Navigation.js
//
// The top bar carries the imigongo register on its top edge — the one place a
// page announces itself. Status is a square swatch plus a word, never a tinted
// pill and never colour on its own.
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';
import { FuturimiWordmark, FuturimiRegister, AluMark } from './Futurimi';

const StatusBadge = ({ status, children, className = "" }) => {
  const statusClasses = {
    active: "text-ftm-green",
    pending: "text-ftm-ochre",
    inactive: "text-ftm-slate"
  };
  return (
    <span className={`ftm-status font-semibold ${statusClasses[status]} ${className}`}>
      {children}
    </span>
  );
};

const NavigationSkeleton = () => (
  <nav className="bg-ftm-bar border-b border-ftm-line">
    <FuturimiRegister />
    <div className="max-w-shell mx-auto px-6 sm:px-10">
      <div className="flex justify-between items-center h-bar" aria-busy="true">
        <div className="ftm-skeleton h-5 w-32" />
        <div className="flex items-center gap-4">
          <div className="ftm-skeleton h-3.5 w-24" />
          <div className="ftm-skeleton h-8 w-8" />
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

  // Login and the exam both own their whole screen. The exam in particular has
  // its own status band; stacking the app nav above it gave a candidate two
  // header bars, a "welcome" greeting and a sign-out link at the exact moment
  // they should be looking at one passage and nothing else.
  if (isLoginPage || isTestPortal) {
    return null;
  }

  if (isLoading) return <NavigationSkeleton />;

  return (
    <nav className="bg-ftm-bar border-b border-ftm-line sticky top-0 z-40">
      <FuturimiRegister />
      <div className="max-w-shell mx-auto px-6 sm:px-10">
        <div className="flex justify-between items-center h-bar gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <Link href="/home" className="flex-shrink-0 flex items-center gap-3">
              <AluMark height={14} opacity={0.5} />
              <FuturimiWordmark size={15} ink="#F4F1EC" diamond="#C5132D" />
            </Link>

            {isTestPortal && (
              <StatusBadge status="active">Test in progress</StatusBadge>
            )}
          </div>

          {userData?.name && (
            <div className="flex items-center gap-5">
              <div className="hidden sm:block text-right">
                <p className="font-inter text-[13px] font-semibold text-ftm-ink leading-tight">
                  {userData.name}
                </p>
                {bookingDetails?.selectedDate && (
                  <p className="font-inter text-[12px] text-ftm-dim leading-tight mt-0.5">
                    {bookingDetails.selectedDate}
                  </p>
                )}
              </div>

              {shouldShowTestLink && (
                <Link
                  href="/test-portal"
                  aria-disabled={!isTestActive}
                  className={`font-inter text-[13px] font-bold px-4 py-2.5 transition-colors
                    ${isTestActive
                      ? 'text-white bg-ftm-crimson hover:bg-ftm-crimsondeep'
                      : 'text-ftm-dim border border-ftm-line cursor-not-allowed'
                    }`}
                  onClick={e => !isTestActive && e.preventDefault()}
                >
                  {isTestActive ? 'Open the test' : `Opens ${bookingDetails.selectedDate}`}
                </Link>
              )}

              <div className="relative user-menu">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label={`Account menu for ${userData.name}`}
                  className="flex items-center justify-center w-9 h-9 bg-ftm-up hover:bg-ftm-card border border-ftm-line transition-colors"
                >
                  <span className="font-grotesk text-[14px] font-bold text-ftm-mut">
                    {userData.name.charAt(0).toUpperCase()}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-ftm-up border border-ftm-line2 z-50">
                    <div className="px-4 py-3 border-b border-ftm-line">
                      <p className="font-inter text-[13px] font-semibold text-ftm-ink">{userData.name}</p>
                      <p className="font-inter text-[12px] text-ftm-dim mt-0.5" data-figure>{userData.eptId}</p>
                    </div>
                    {bookingDetails && (
                      <div className="px-4 py-3 border-b border-ftm-line">
                        <p className="font-inter text-[11px] tracking-[.12em] uppercase text-ftm-dim">Test date</p>
                        <p className="font-inter text-[13px] font-semibold text-ftm-ink mt-1">{bookingDetails.selectedDate}</p>
                      </div>
                    )}
                    <Link
                      href="/privacy"
                      className="block px-4 py-2.5 font-inter text-[13px] text-ftm-mut hover:text-ftm-ink hover:bg-ftm-card transition-colors"
                    >
                      What the exam records
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 font-inter text-[13px] font-semibold text-ftm-ink hover:bg-ftm-card transition-colors border-t border-ftm-line"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {userData?.name && (
        <div className="sm:hidden bg-ftm-night border-t border-ftm-line px-6 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-inter text-[13px] font-semibold text-ftm-ink truncate">{userData.name}</p>
              {bookingDetails?.selectedDate && (
                <p className="font-inter text-[12px] text-ftm-dim">{bookingDetails.selectedDate}</p>
              )}
            </div>
            {shouldShowTestLink && isTestActive && (
              <StatusBadge status="active">Open now</StatusBadge>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
