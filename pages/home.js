// pages/home.js — Futurimi campus-night dashboard
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../components/ToastContext';
import { AluMark } from '../components/Futurimi';

// Stat card: neutral by default; `live` flags the one "live" data point with a
// red-tinted border (the rest stay neutral — no rainbow cards).
function StatCard({ label, value, live = false }) {
  return (
    <div className={`bg-ftm-card border rounded-lg p-4 ${live ? 'border-ftm-red/30' : 'border-white/[.08]'}`}>
      <span className={`font-inter font-semibold text-[10px] tracking-[.08em] uppercase ${live ? 'text-ftm-red' : 'text-ftm-dim'}`}>
        {label}
      </span>
      <div className="font-grotesk font-bold text-[17px] text-ftm-ink mt-1.5">{value}</div>
    </div>
  );
}

const sectionIcons = {
  Reading: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93A4AE" strokeWidth="1.6">
      <rect x="4" y="3" width="16" height="18" rx="2"></rect>
      <line x1="8" y1="8" x2="16" y2="8"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
      <line x1="8" y1="16" x2="13" y2="16"></line>
    </svg>
  ),
  Writing: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93A4AE" strokeWidth="1.6">
      <line x1="6" y1="18" x2="15" y2="9"></line>
      <rect x="14" y="7" width="3" height="3"></rect>
      <line x1="6" y1="18" x2="4" y2="20"></line>
    </svg>
  ),
  Listening: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93A4AE" strokeWidth="1.6">
      <rect x="5" y="10" width="3" height="6"></rect>
      <rect x="10.5" y="6" width="3" height="14"></rect>
      <rect x="16" y="9" width="3" height="8"></rect>
    </svg>
  ),
};

const chevron = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E7A82" strokeWidth="2">
    <polyline points="9 6 15 12 9 18"></polyline>
  </svg>
);

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [hasCompletedTests, setHasCompletedTests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const storedUserData = sessionStorage.getItem('userData');
    if (!storedUserData) {
      router.push('/login');
      return;
    }

    const parsedUserData = JSON.parse(storedUserData);
    setUserData(parsedUserData);
    checkRegistration(parsedUserData.eptId);
  }, [router]);

  const checkRegistration = async (eptId) => {
    try {
      const csrfToken = sessionStorage.getItem('csrfToken');
      const response = await fetch('/api/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({ eptId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasRegistration) {
          setBookingDetails(data.registration);
          sessionStorage.setItem('bookingDetails', JSON.stringify(data.registration));
        }
        setHasCompletedTests(data.hasCompletedTests);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to check registration status. Please refresh the page.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ftm-night flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-ftm-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-ftm-mut font-medium">Loading your dashboard&hellip;</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const testSections = [
    { name: 'Reading', duration: '60 min', description: 'Comprehension passages, multiple choice' },
    { name: 'Writing', duration: '45 min', description: 'Essay response to a given prompt' },
    { name: 'Listening', duration: '30 min', description: 'Audio comprehension with questions' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const status = hasCompletedTests ? 'Completed' : bookingDetails ? 'Registered' : 'Pending';

  return (
    <div className="min-h-screen bg-ftm-night">
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-[26px]">
          <div>
            <h1 className="font-grotesk font-bold text-[26px] text-ftm-ink mb-1">
              {getGreeting()}, {userData.name.split(' ')[0]}
            </h1>
            <p className="font-inter text-sm text-ftm-mut">
              Here&rsquo;s where things stand with your <span className="font-semibold text-ftm-ink">Futurimi</span>.
            </p>
          </div>
          <AluMark height={16} opacity={0.4} className="hidden sm:block" />
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-[26px]">
          <StatCard label="EPT ID" value={userData.eptId} />
          <StatCard label="Test Date" value={bookingDetails?.selectedDate || 'Not booked'} />
          <StatCard label="Sections" value="3 Total" />
          <StatCard label="Status" value={status} live />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-[22px]">
            {/* Primary action card */}
            <div
              className="border border-white/[.07] rounded-[10px] p-7 text-white"
              style={{ background: 'linear-gradient(155deg,#20282D,#181F24)' }}
            >
              {!bookingDetails ? (
                <>
                  <span className="font-inter font-bold text-[10.5px] tracking-[.1em] uppercase text-ftm-redsoft">Not booked</span>
                  <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink my-2">Book your test date</h2>
                  <p className="font-inter text-sm leading-relaxed text-[#9BA6AD] mb-[18px] max-w-[460px]">
                    You haven&rsquo;t registered for a Futurimi date yet. Choose a date and time that works for you.
                  </p>
                  <button
                    onClick={() => router.push('/booking')}
                    className="font-inter font-semibold text-[13.5px] text-white bg-ftm-red hover:bg-[#C51F35] rounded-md px-5 py-3 shadow-redglow transition-colors"
                  >
                    Book Now
                  </button>
                </>
              ) : hasCompletedTests ? (
                <>
                  <span className="font-inter font-bold text-[10.5px] tracking-[.1em] uppercase text-ftm-green">Tests completed</span>
                  <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink my-2">Great work!</h2>
                  <p className="font-inter text-sm leading-relaxed text-[#9BA6AD] mb-[18px] max-w-[460px]">
                    You&rsquo;ve completed all test sections. Your results will be reviewed and made available soon.
                  </p>
                  <button
                    onClick={() => router.push('/test-complete')}
                    className="font-inter font-semibold text-[13.5px] text-white bg-ftm-red hover:bg-[#C51F35] rounded-md px-5 py-3 shadow-redglow transition-colors"
                  >
                    View Progress
                  </button>
                </>
              ) : (
                <>
                  <span className="font-inter font-bold text-[10.5px] tracking-[.1em] uppercase text-ftm-redsoft">Registered</span>
                  <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink my-2">Your test awaits</h2>
                  <p className="font-inter text-sm leading-relaxed text-[#9BA6AD] mb-[18px] max-w-[460px]">
                    You&rsquo;re booked for <strong className="text-ftm-ink">{bookingDetails.selectedDate}, 10:00 AM</strong> at ALU Kigali. The portal unlocks on your test day.
                  </p>
                  <button
                    onClick={() => router.push('/test-portal')}
                    className="font-inter font-semibold text-[13.5px] text-white bg-ftm-red hover:bg-[#C51F35] rounded-md px-5 py-3 shadow-redglow transition-colors"
                  >
                    Go to Test Portal
                  </button>
                </>
              )}
            </div>

            {/* Test sections */}
            <div>
              <h3 className="font-grotesk font-semibold text-[15px] text-ftm-ink mb-3">Test sections</h3>
              <div className="space-y-2.5">
                {testSections.map((section) => (
                  <div
                    key={section.name}
                    className="flex items-center gap-3.5 bg-ftm-card border border-white/[.08] rounded-lg px-4 py-3.5"
                  >
                    <div className="w-[38px] h-[38px] rounded-lg bg-ftm-slate/[.12] flex items-center justify-center flex-none">
                      {sectionIcons[section.name]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-inter font-semibold text-sm text-ftm-ink">{section.name}</div>
                      <div className="font-inter text-[12.5px] text-ftm-mut truncate">{section.description}</div>
                    </div>
                    <span className="font-inter font-semibold text-[12.5px] text-ftm-dim whitespace-nowrap">
                      {section.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-[18px]">
            {/* Profile card */}
            <div className="bg-ftm-card border border-white/[.08] rounded-[10px] overflow-hidden">
              <div className="bg-ftm-up px-[18px] py-3">
                <span className="font-inter font-semibold text-[13px] text-ftm-ink">Your profile</span>
              </div>
              <div className="p-[18px]">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-full bg-ftm-slate/[.14] flex items-center justify-center flex-none">
                    <span className="font-grotesk font-bold text-[13px] text-ftm-slate">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-inter font-semibold text-[13.5px] text-ftm-ink truncate">{userData.name}</div>
                    <div className="font-inter text-xs text-ftm-mut truncate">{userData.email}</div>
                  </div>
                </div>
                <div className="border-t border-white/[.07] pt-3 space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-inter text-[12.5px] text-ftm-mut">EPT ID</span>
                    <span className="font-grotesk font-semibold text-xs text-ftm-ink bg-ftm-slate/[.14] px-[7px] py-0.5 rounded">{userData.eptId}</span>
                  </div>
                  {bookingDetails && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-inter text-[12.5px] text-ftm-mut">Test date</span>
                        <span className="font-inter font-semibold text-[12.5px] text-ftm-ink">{bookingDetails.selectedDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-inter text-[12.5px] text-ftm-mut">Laptop</span>
                        <span className="font-inter font-semibold text-[11px] text-ftm-slate bg-ftm-slate/[.14] px-2 py-[3px] rounded-full">
                          {bookingDetails.hasLaptop ? 'Bringing own' : 'Using provided'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-ftm-card border border-white/[.08] rounded-[10px] p-[18px]">
              <span className="font-inter font-semibold text-[13px] text-ftm-ink">Quick links</span>
              <div className="flex flex-col mt-2.5">
                {bookingDetails && !hasCompletedTests && (
                  <button
                    onClick={() => router.push('/test-portal')}
                    className="flex items-center justify-between py-[9px] px-0.5 text-left group"
                  >
                    <span className="font-inter font-medium text-[13px] text-ftm-link group-hover:text-ftm-ink transition-colors">Test portal</span>
                    {chevron}
                  </button>
                )}
                {!bookingDetails && (
                  <button
                    onClick={() => router.push('/booking')}
                    className="flex items-center justify-between py-[9px] px-0.5 text-left group"
                  >
                    <span className="font-inter font-medium text-[13px] text-ftm-link group-hover:text-ftm-ink transition-colors">Book test date</span>
                    {chevron}
                  </button>
                )}
                <button
                  onClick={() => window.open('mailto:thewritingcentre@alueducation.com')}
                  className="flex items-center justify-between py-[9px] px-0.5 text-left group"
                >
                  <span className="font-inter font-medium text-[13px] text-ftm-link group-hover:text-ftm-ink transition-colors">Contact support</span>
                  {chevron}
                </button>
              </div>
            </div>

            {/* Important notice */}
            <div className="bg-ftm-amber/10 border border-ftm-amber/30 rounded-[10px] p-4">
              <span className="font-inter font-semibold text-[13px] text-ftm-amber">Important</span>
              <p className="font-inter text-[12.5px] leading-[1.55] text-ftm-amberdim mt-1.5">
                The portal opens at 10:00 AM on your scheduled day. Make sure your connection is stable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
