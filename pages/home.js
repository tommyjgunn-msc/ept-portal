// pages/home.js — Enhanced dashboard with richer layout
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../components/ToastContext';

// Reusable stat card
function StatCard({ icon, label, value, color = 'emerald' }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const testSections = [
    {
      name: 'Reading',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      duration: '60 min',
      description: 'Comprehension passages with multiple choice questions',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      name: 'Writing',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      duration: '45 min',
      description: 'Essay response to a given prompt',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      name: 'Listening',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      duration: '30 min',
      description: 'Audio-based comprehension with questions',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {userData.name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 mt-1">Here's an overview of your EPT progress</p>
        </div>

        {/* Stat cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            color="emerald"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            label="EPT ID"
            value={userData.eptId}
          />
          <StatCard
            color="indigo"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            label="Test Date"
            value={bookingDetails?.selectedDate || 'Not booked'}
          />
          <StatCard
            color="amber"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            label="Sections"
            value="3 Total"
          />
          <StatCard
            color="purple"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Status"
            value={hasCompletedTests ? 'Completed' : bookingDetails ? 'Registered' : 'Pending'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area — 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary action card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {!bookingDetails ? (
                    <>
                      <h2 className="text-2xl font-bold mb-2">Book Your Test Date</h2>
                      <p className="text-emerald-100 mb-5 max-w-md">
                        You haven't registered for a test date yet. Choose a date and time that works for you.
                      </p>
                      <button
                        onClick={() => router.push('/booking')}
                        className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
                      >
                        Book Now
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </>
                  ) : hasCompletedTests ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-6 h-6 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-emerald-200 font-medium text-sm uppercase tracking-wider">Tests Completed</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Great Work!</h2>
                      <p className="text-emerald-100 mb-5 max-w-md">
                        You've completed all test sections. Your results will be reviewed and made available soon.
                      </p>
                      <button
                        onClick={() => router.push('/test-complete')}
                        className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
                      >
                        View Progress
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                        <span className="text-emerald-200 font-medium text-sm uppercase tracking-wider">Registered</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Your Test Awaits</h2>
                      <p className="text-emerald-100 mb-5 max-w-md">
                        You're booked for <span className="font-semibold text-white">{bookingDetails.selectedDate}</span>. Access the test portal on your test day at 10:00 AM.
                      </p>
                      <button
                        onClick={() => router.push('/test-portal')}
                        className="inline-flex items-center gap-2 bg-white text-emerald-700 font-semibold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
                      >
                        Go to Test Portal
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                {/* Decorative icon */}
                <div className="hidden sm:block opacity-20 ml-4">
                  <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Test sections overview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Sections</h3>
              <div className="space-y-3">
                {testSections.map((section) => (
                  <div
                    key={section.name}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${section.color}`}>
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{section.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{section.description}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                      {section.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar — 1 col */}
          <div className="space-y-6">
            {/* Your Details card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
                <h3 className="font-semibold text-white">Your Profile</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <span className="text-emerald-700 font-bold text-sm">
                      {userData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{userData.name}</p>
                    <p className="text-sm text-gray-500">{userData.email}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">EPT ID</span>
                    <span className="font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{userData.eptId}</span>
                  </div>
                  {bookingDetails && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Test Date</span>
                        <span className="font-medium text-gray-900">{bookingDetails.selectedDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Laptop</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          bookingDetails.hasLaptop ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {bookingDetails.hasLaptop ? 'Bringing Own' : 'Using Provided'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                {bookingDetails && !hasCompletedTests && (
                  <button
                    onClick={() => router.push('/test-portal')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Test Portal
                  </button>
                )}
                {!bookingDetails && (
                  <button
                    onClick={() => router.push('/booking')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Test Date
                  </button>
                )}
                <button
                  onClick={() => window.open('mailto:thewritingcentre@alueducation.com')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </button>
              </div>
            </div>

            {/* Important notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Important</p>
                  <p className="text-sm text-amber-700 mt-1">
                    The test portal opens at 10:00 AM on your scheduled test day. Ensure you have a stable internet connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
