// pages/login.js — Green illustrated login with split layout
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../components/ToastContext';

// Polished flat-style campus illustration
function CampusIllustration() {
  return (
    <svg viewBox="0 0 520 440" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-lg mx-auto">
      {/* Soft background glow */}
      <ellipse cx="260" cy="240" rx="210" ry="190" fill="#D1FAE5" opacity="0.35" />

      {/* Ground plane */}
      <ellipse cx="260" cy="370" rx="230" ry="28" fill="#A7F3D0" opacity="0.5" />

      {/* ── Tree left ── */}
      <rect x="58" y="300" width="7" height="52" rx="3.5" fill="#78350F" />
      <ellipse cx="61" cy="282" rx="28" ry="30" fill="#047857" />
      <ellipse cx="48" cy="296" rx="16" ry="17" fill="#059669" />
      <ellipse cx="76" cy="294" rx="16" ry="17" fill="#059669" />

      {/* ── Tree right ── */}
      <rect x="442" y="306" width="7" height="46" rx="3.5" fill="#78350F" />
      <ellipse cx="445" cy="290" rx="24" ry="26" fill="#047857" />
      <ellipse cx="434" cy="302" rx="14" ry="15" fill="#059669" />
      <ellipse cx="458" cy="300" rx="14" ry="15" fill="#059669" />

      {/* ── Small bush far left ── */}
      <ellipse cx="24" cy="356" rx="18" ry="12" fill="#10B981" opacity="0.6" />

      {/* ── Small bush far right ── */}
      <ellipse cx="496" cy="352" rx="16" ry="10" fill="#10B981" opacity="0.6" />

      {/* ══════ BUILDING ══════ */}
      {/* Main facade */}
      <rect x="150" y="168" width="220" height="180" rx="3" fill="#065F46" />

      {/* Pediment (triangular roof) */}
      <polygon points="260,98 130,170 390,170" fill="#047857" />
      <polygon points="260,116 160,170 360,170" fill="#065F46" opacity="0.35" />

      {/* Entablature band */}
      <rect x="150" y="168" width="220" height="12" rx="1" fill="#047857" />
      <rect x="150" y="177" width="220" height="3" fill="#034E3B" opacity="0.25" />

      {/* Columns — 4 evenly spaced, reaching from entablature to base */}
      {[188, 228, 272, 312].map((x) => (
        <g key={x}>
          <rect x={x - 2} y="181" width="18" height="6" rx="2" fill="#D1FAE5" />
          <rect x={x} y="187" width="14" height="153" rx="3" fill="#ECFDF5" />
          <rect x={x - 2} y="340" width="18" height="6" rx="2" fill="#D1FAE5" />
        </g>
      ))}

      {/* Central doorway — smaller, proportional */}
      <rect x="244" y="296" width="32" height="52" rx="16" fill="#10B981" />
      <rect x="249" y="301" width="22" height="47" rx="11" fill="#059669" />
      <circle cx="265" cy="325" r="2.5" fill="#D1FAE5" />

      {/* Windows — left side, two rows */}
      <rect x="160" y="200" width="20" height="24" rx="3" fill="#A7F3D0" />
      <rect x="160" y="240" width="20" height="24" rx="3" fill="#A7F3D0" />
      <line x1="170" y1="200" x2="170" y2="224" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />
      <line x1="160" y1="212" x2="180" y2="212" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />
      <line x1="170" y1="240" x2="170" y2="264" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />
      <line x1="160" y1="252" x2="180" y2="252" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />

      {/* Windows — right side, two rows */}
      <rect x="340" y="200" width="20" height="24" rx="3" fill="#A7F3D0" />
      <rect x="340" y="240" width="20" height="24" rx="3" fill="#A7F3D0" />
      <line x1="350" y1="200" x2="350" y2="224" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />
      <line x1="340" y1="212" x2="360" y2="212" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />
      <line x1="350" y1="240" x2="350" y2="264" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />
      <line x1="340" y1="252" x2="360" y2="252" stroke="#065F46" strokeWidth="1.2" opacity="0.3" />

      {/* Windows — inner pair flanking door */}
      <rect x="204" y="240" width="18" height="22" rx="3" fill="#A7F3D0" />
      <rect x="298" y="240" width="18" height="22" rx="3" fill="#A7F3D0" />
      <line x1="213" y1="240" x2="213" y2="262" stroke="#065F46" strokeWidth="1" opacity="0.25" />
      <line x1="307" y1="240" x2="307" y2="262" stroke="#065F46" strokeWidth="1" opacity="0.25" />

      {/* Pediment clock */}
      <circle cx="260" cy="138" r="13" fill="#ECFDF5" />
      <circle cx="260" cy="138" r="10" fill="none" stroke="#047857" strokeWidth="1.5" />
      <line x1="260" y1="131" x2="260" y2="138" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="260" y1="138" x2="265" y2="142" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />

      {/* Steps */}
      <rect x="220" y="348" width="80" height="7" rx="2" fill="#A7F3D0" />
      <rect x="230" y="342" width="60" height="7" rx="2" fill="#D1FAE5" />

      {/* ══════ STUDENT 1 — left, walking with book ══════ */}
      <g transform="translate(105, 268)">
        {/* Shadow */}
        <ellipse cx="0" cy="90" rx="16" ry="5" fill="#000" opacity="0.06" />
        {/* Legs */}
        <rect x="-9" y="52" width="8" height="34" rx="4" fill="#1E3A5F" />
        <rect x="2" y="52" width="8" height="34" rx="4" fill="#1E3A5F" />
        {/* Body */}
        <rect x="-11" y="18" width="22" height="38" rx="8" fill="#F97316" />
        {/* Arms */}
        <rect x="-16" y="22" width="7" height="26" rx="3.5" fill="#EA580C" />
        <rect x="10" y="22" width="7" height="26" rx="3.5" fill="#EA580C" />
        {/* Book in arm */}
        <rect x="14" y="26" width="7" height="16" rx="1.5" fill="#3B82F6" />
        <rect x="15" y="28" width="5" height="2" rx="1" fill="#93C5FD" />
        <rect x="15" y="32" width="5" height="2" rx="1" fill="#93C5FD" />
        {/* Head */}
        <circle cx="0" cy="6" r="15" fill="#D97706" />
        {/* Hair */}
        <ellipse cx="0" cy="-2" rx="13" ry="8" fill="#292524" />
        {/* Face */}
        <circle cx="-4" cy="4" r="1.5" fill="#1C1917" />
        <circle cx="5" cy="4" r="1.5" fill="#1C1917" />
        <path d="M-2 9 Q0 12 3 9" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>

      {/* ══════ STUDENT 2 — right, with laptop ══════ */}
      <g transform="translate(410, 262)">
        {/* Shadow */}
        <ellipse cx="0" cy="96" rx="16" ry="5" fill="#000" opacity="0.06" />
        {/* Legs */}
        <rect x="-9" y="56" width="8" height="36" rx="4" fill="#374151" />
        <rect x="2" y="56" width="8" height="36" rx="4" fill="#374151" />
        {/* Body */}
        <rect x="-12" y="18" width="24" height="42" rx="8" fill="#0D9488" />
        {/* Arms */}
        <rect x="-18" y="24" width="8" height="28" rx="4" fill="#0F766E" />
        <rect x="10" y="24" width="8" height="28" rx="4" fill="#0F766E" />
        {/* Laptop */}
        <rect x="-16" y="38" width="22" height="14" rx="2" fill="#4B5563" />
        <rect x="-14" y="40" width="18" height="9" rx="1" fill="#60A5FA" />
        {/* Head */}
        <circle cx="0" cy="6" r="16" fill="#5EEAD4" />
        {/* Hair */}
        <ellipse cx="0" cy="-4" rx="14" ry="9" fill="#1C1917" />
        {/* Face */}
        <circle cx="-4" cy="4" r="1.5" fill="#1C1917" />
        <circle cx="5" cy="4" r="1.5" fill="#1C1917" />
        <path d="M-2 10 Q0 13 3 10" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>

      {/* ══════ STUDENT 3 — center-right, sitting on bench ══════ */}
      <g transform="translate(340, 325)">
        {/* Bench */}
        <rect x="-28" y="22" width="56" height="7" rx="3" fill="#047857" />
        <rect x="-24" y="29" width="5" height="16" rx="2" fill="#065F46" />
        <rect x="20" y="29" width="5" height="16" rx="2" fill="#065F46" />
        {/* Sitting body */}
        <rect x="-9" y="2" width="18" height="24" rx="6" fill="#EC4899" />
        {/* Legs (bent, sitting) */}
        <rect x="-10" y="22" width="8" height="18" rx="4" fill="#1E3A5F" />
        <rect x="2" y="22" width="8" height="18" rx="4" fill="#1E3A5F" />
        {/* Head */}
        <circle cx="0" cy="-10" r="14" fill="#F472B6" />
        {/* Hair */}
        <ellipse cx="0" cy="-18" rx="12" ry="7" fill="#1C1917" />
        <ellipse cx="-8" cy="-14" rx="5" ry="8" fill="#1C1917" />
        <ellipse cx="8" cy="-14" rx="5" ry="8" fill="#1C1917" />
        {/* Book in lap */}
        <rect x="-14" y="4" width="12" height="15" rx="2" fill="#FEF3C7" />
        <rect x="-12" y="7" width="8" height="1.5" rx="0.75" fill="#D97706" opacity="0.5" />
        <rect x="-12" y="10" width="6" height="1.5" rx="0.75" fill="#D97706" opacity="0.5" />
        <rect x="-12" y="13" width="7" height="1.5" rx="0.75" fill="#D97706" opacity="0.5" />
        {/* Face */}
        <circle cx="-4" cy="-12" r="1.5" fill="#1C1917" />
        <circle cx="4" cy="-12" r="1.5" fill="#1C1917" />
        <path d="M-2 -7 Q0 -4 3 -7" stroke="#1C1917" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>

      {/* ══════ FLOATING ACADEMIC ELEMENTS ══════ */}
      {/* Graduation cap — top left */}
      <g transform="translate(80, 140)" opacity="0.7">
        <polygon points="0,-6 -14,2 0,10 14,2" fill="#1E3A5F" />
        <rect x="-1" y="-6" width="2" height="4" fill="#1E3A5F" />
        <rect x="-9" y="2" width="18" height="3" rx="1" fill="#1E40AF" />
        <line x1="12" y1="4" x2="16" y2="14" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="16" cy="15" r="2" fill="#F59E0B" />
      </g>

      {/* Star — top right */}
      <g transform="translate(430, 128)" opacity="0.6">
        <path d="M0,-12 L3,-4 L12,-4 L5,2 L7,10 L0,5 L-7,10 L-5,2 L-12,-4 L-3,-4 Z" fill="#FBBF24" />
      </g>

      {/* A+ badge — upper right */}
      <g transform="translate(465, 180)" opacity="0.65">
        <circle cx="0" cy="0" r="14" fill="#FDE68A" />
        <circle cx="0" cy="0" r="11" fill="#FEF3C7" />
        <text x="-8" y="5" fill="#92400E" fontSize="11" fontWeight="bold" fontFamily="system-ui">A+</text>
      </g>

      {/* Open book — lower left */}
      <g transform="translate(40, 318) rotate(-8)" opacity="0.55">
        <path d="M-12,0 Q0,-8 12,0 L12,16 Q0,8 -12,16 Z" fill="#BFDBFE" />
        <path d="M12,0 Q24,-8 36,0 L36,16 Q24,8 12,16 Z" fill="#DBEAFE" />
        <line x1="12" y1="0" x2="12" y2="16" stroke="#60A5FA" strokeWidth="1" />
      </g>

      {/* Pencil — far upper left */}
      <g transform="translate(56, 186) rotate(25)" opacity="0.5">
        <rect x="0" y="0" width="5" height="28" rx="1" fill="#FBBF24" />
        <polygon points="0,28 2.5,36 5,28" fill="#F59E0B" />
        <rect x="0" y="0" width="5" height="4" rx="1" fill="#F472B6" />
      </g>

      {/* Small dots decoration */}
      <circle cx="490" cy="260" r="3" fill="#34D399" opacity="0.4" />
      <circle cx="480" cy="278" r="2" fill="#5EEAD4" opacity="0.4" />
      <circle cx="30" cy="270" r="3" fill="#F97316" opacity="0.3" />
      <circle cx="20" cy="290" r="2" fill="#FBBF24" opacity="0.3" />
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
            <p className="text-emerald-200 text-sm font-medium uppercase tracking-widest mb-2">
              African Leadership University
            </p>
            <h1 className="text-3xl font-bold text-white mb-4">
              CEFR Standard English Proficiency Test
            </h1>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Congratulations on your conditional admission. You can register, book your test date, and complete your proficiency assessment right here!
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
          <p className="text-emerald-200 text-xs font-medium uppercase tracking-widest">African Leadership University</p>
          <h1 className="text-xl font-bold text-white mt-1">CEFR Standard English Proficiency Test</h1>
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
                <span className="text-xl font-bold text-gray-900">English Proficiency Test</span>
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
