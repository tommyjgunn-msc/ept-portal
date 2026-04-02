// pages/login.js — Green illustrated login with split layout
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../components/ToastContext';

// SVG illustration of students/education scene
function CampusIllustration() {
  return (
    <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-md mx-auto">
      {/* Background elements */}
      <circle cx="250" cy="260" r="180" fill="#D1FAE5" opacity="0.5" />
      <circle cx="350" cy="180" r="80" fill="#A7F3D0" opacity="0.4" />
      <circle cx="140" cy="340" r="60" fill="#6EE7B7" opacity="0.3" />

      {/* Building / University */}
      <rect x="150" y="160" width="200" height="160" rx="8" fill="#065F46" />
      <rect x="160" y="170" width="180" height="10" rx="2" fill="#047857" />
      <rect x="170" y="140" width="160" height="30" rx="4" fill="#047857" />
      {/* Pillars */}
      <rect x="185" y="190" width="12" height="120" rx="2" fill="#D1FAE5" />
      <rect x="220" y="190" width="12" height="120" rx="2" fill="#D1FAE5" />
      <rect x="268" y="190" width="12" height="120" rx="2" fill="#D1FAE5" />
      <rect x="303" y="190" width="12" height="120" rx="2" fill="#D1FAE5" />
      {/* Door */}
      <rect x="230" y="250" width="40" height="70" rx="20" fill="#10B981" />
      <circle cx="260" cy="290" r="3" fill="#065F46" />
      {/* Windows */}
      <rect x="178" y="200" width="25" height="30" rx="3" fill="#A7F3D0" />
      <rect x="297" y="200" width="25" height="30" rx="3" fill="#A7F3D0" />
      {/* Roof triangle */}
      <polygon points="250,110 150,160 350,160" fill="#047857" />
      <circle cx="250" cy="140" r="8" fill="#ECFDF5" />

      {/* Student 1 — walking with book */}
      <circle cx="100" cy="280" r="18" fill="#F59E0B" /> {/* head */}
      <rect x="88" y="298" width="24" height="35" rx="8" fill="#10B981" /> {/* body */}
      <rect x="85" y="333" width="10" height="25" rx="3" fill="#1F2937" /> {/* leg */}
      <rect x="105" y="333" width="10" height="25" rx="3" fill="#1F2937" /> {/* leg */}
      <rect x="110" y="300" width="8" height="20" rx="2" fill="#065F46" /> {/* book */}
      {/* Hair */}
      <ellipse cx="100" cy="270" rx="14" ry="8" fill="#1F2937" />

      {/* Student 2 — standing with laptop */}
      <circle cx="400" cy="270" r="18" fill="#8B5CF6" /> {/* head */}
      <rect x="388" y="288" width="24" height="38" rx="8" fill="#059669" /> {/* body */}
      <rect x="385" y="326" width="10" height="28" rx="3" fill="#374151" /> {/* leg */}
      <rect x="405" y="326" width="10" height="28" rx="3" fill="#374151" /> {/* leg */}
      <rect x="380" y="300" width="20" height="14" rx="2" fill="#6B7280" /> {/* laptop */}
      <rect x="382" y="302" width="16" height="8" rx="1" fill="#93C5FD" /> {/* screen */}
      {/* Hair */}
      <ellipse cx="400" cy="260" rx="12" ry="6" fill="#1F2937" />

      {/* Student 3 — sitting on bench reading */}
      <rect x="300" y="350" width="60" height="10" rx="3" fill="#047857" /> {/* bench */}
      <circle cx="330" cy="330" r="15" fill="#EC4899" /> {/* head */}
      <rect x="320" y="345" width="20" height="25" rx="6" fill="#34D399" /> {/* body */}
      <rect x="315" y="342" width="12" height="16" rx="2" fill="#F3F4F6" /> {/* book */}
      <rect x="317" y="344" width="8" height="5" rx="1" fill="#9CA3AF" /> {/* text lines */}
      {/* Hair */}
      <path d="M320 325 Q330 310 340 325" fill="#1F2937" />
      <ellipse cx="330" cy="322" rx="14" ry="6" fill="#1F2937" />

      {/* Trees */}
      <rect x="60" y="340" width="8" height="40" rx="2" fill="#92400E" />
      <circle cx="64" cy="325" r="22" fill="#059669" />
      <circle cx="52" cy="332" r="15" fill="#10B981" />
      <circle cx="76" cy="332" r="15" fill="#10B981" />

      <rect x="430" y="330" width="8" height="40" rx="2" fill="#92400E" />
      <circle cx="434" cy="315" r="22" fill="#059669" />
      <circle cx="422" cy="322" r="15" fill="#10B981" />
      <circle cx="446" cy="322" r="15" fill="#10B981" />

      {/* Ground */}
      <ellipse cx="250" cy="380" rx="220" ry="20" fill="#A7F3D0" opacity="0.6" />

      {/* Floating elements */}
      <g opacity="0.6">
        <rect x="80" y="160" width="16" height="20" rx="2" fill="#FCD34D" transform="rotate(-15 88 170)" />
        <rect x="82" y="164" width="8" height="2" rx="1" fill="#92400E" transform="rotate(-15 86 165)" />
        <rect x="82" y="168" width="10" height="2" rx="1" fill="#92400E" transform="rotate(-15 87 169)" />
      </g>
      <g opacity="0.6">
        <circle cx="420" cy="160" r="10" fill="#FBBF24" />
        <text x="416" y="165" fill="#92400E" fontSize="12" fontWeight="bold">A+</text>
      </g>
      <g opacity="0.5">
        <path d="M370 120 L375 130 L385 132 L377 138 L379 148 L370 143 L361 148 L363 138 L355 132 L365 130 Z" fill="#FCD34D" />
      </g>
    </svg>
  );
}

export default function Login() {
  const [eptId, setEptId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eptId }),
      });
      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.message || 'Authentication failed');
      }

      sessionStorage.setItem('userData', JSON.stringify({
        name: authData.name,
        email: authData.email,
        eptId: authData.eptId,
      }));
      sessionStorage.setItem('csrfToken', authData.csrfToken);

      addToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${authData.name}!`
      });

      const bookingResponse = await fetch('/api/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': authData.csrfToken,
        },
        body: JSON.stringify({ eptId }),
      });
      const bookingData = await bookingResponse.json();

      if (bookingData.hasRegistration) {
        sessionStorage.setItem('bookingDetails', JSON.stringify(bookingData.registration));
        if (bookingData.hasCompletedTests) {
          router.push('/test-complete');
        } else {
          router.push('/home');
        }
      } else {
        router.push('/booking');
      }
    } catch (error) {
      setError(error.message || 'Failed to authenticate');
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: error.message || 'Please check your EPT ID and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-20 w-40 h-40 bg-emerald-400/10 rounded-full blur-xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          {/* Illustration */}
          <div className="w-full max-w-lg mb-8">
            <CampusIllustration />
          </div>

          {/* Text */}
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome to ALU EPT Portal
            </h1>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Your gateway to the English Proficiency Test. Register, book your test date, and complete your assessment all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Reading', 'Writing', 'Listening'].map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/20"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-center bg-gray-50">
        {/* Mobile header (hidden on desktop) */}
        <div className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-8 text-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">ALU EPT Portal</h1>
          <p className="text-emerald-100 text-sm mt-1">English Proficiency Test</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Logo & heading */}
            <div className="mb-8">
              <div className="hidden lg:flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">EPT Portal</span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Sign in to your account
              </h2>
              <p className="text-gray-500">
                Enter your EPT ID to access your test portal
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Authentication Error</p>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="eptId" className="block text-sm font-medium text-gray-700 mb-2">
                  EPT ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="eptId"
                    type="text"
                    placeholder="e.g., EPT12345"
                    value={eptId}
                    onChange={(e) => setEptId(e.target.value)}
                    required
                    autoFocus
                    className={`
                      block w-full pl-11 pr-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400
                      shadow-sm transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                      ${error ? 'border-red-300 bg-red-50/50' : 'border-gray-300 bg-white hover:border-gray-400'}
                    `}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Your unique identification number provided by ALU
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !eptId.trim()}
                className={`
                  w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-base
                  transition-all duration-200 shadow-lg
                  ${isLoading || !eptId.trim()
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl active:scale-[0.98]'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Help section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Don't have an EPT ID?{' '}
                  <a href="mailto:thewritingcentre@alueducation.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Contact the Writing Centre
                  </a>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400">
                African Leadership University
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
