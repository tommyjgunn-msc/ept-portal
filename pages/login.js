// pages/login.js — Futurimi paper login: dark hero panel + white form panel
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../components/ToastContext';
import { FuturimiWordmark, FuturimiHero, AluMark } from '../components/Futurimi';

const SUPPORT_EMAIL = 'thewritingcentre@alueducation.com';

function HeroPanel() {
  return (
    <div className="flex flex-col bg-ftm-panel p-9 h-full">
      <AluMark height={13} opacity={0.55} className="self-start" />
      <div
        className="w-full h-[230px] my-5 rounded-lg overflow-hidden"
        style={{ background: 'radial-gradient(circle at 50% 45%, rgba(197,19,45,.10), transparent 65%)' }}
      >
        <FuturimiHero
          variant="globe"
          secondaryHex="#55636C"
          accentHex="#C5132D"
          count={190}
          cameraZ={8.2}
          glyphs={['U', 'R', 'I', 'M', 'I']}
        />
      </div>
      <div className="mt-1 mb-3">
        <FuturimiWordmark size={40} ink="#F4F1EC" diamond="#C5132D" />
      </div>
      <p className="font-inter font-semibold text-[15px] text-ftm-paper mb-2.5">Test Your Proficiency.</p>
      <p className="font-inter text-[13px] leading-relaxed text-[#8E979C] max-w-[300px] mb-auto">
        Futurimi is ALU&rsquo;s English Proficiency Test. One exam, three sections, a result recognized across every program.
      </p>
      <p className="font-inter font-medium text-xs text-[#6C767C] mt-6">African Leadership University &middot; Kigali</p>
    </div>
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
    <div className="min-h-screen flex bg-ftm-paper">
      {/* Left panel — Futurimi hero (desktop) */}
      <div className="hidden lg:block w-[440px] flex-none">
        <HeroPanel />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile header — compact dark hero */}
        <div className="lg:hidden bg-ftm-panel px-6 pt-6 pb-7 text-center">
          <div className="flex justify-center mb-2">
            <FuturimiWordmark size={30} ink="#F4F1EC" diamond="#C5132D" />
          </div>
          <p className="font-inter font-semibold text-sm text-ftm-paper">Test Your Proficiency.</p>
          <p className="font-inter font-medium text-[11px] text-[#6C767C] mt-2">African Leadership University &middot; Kigali</p>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-[60px]">
          <div className="w-full max-w-md">
            <span className="font-inter font-bold text-[11px] tracking-[.1em] text-ftm-slatel uppercase">Welcome back</span>
            <h1 className="font-grotesk font-semibold text-[26px] text-ftm-panel mt-2.5 mb-1.5">Sign in to Futurimi</h1>
            <p className="font-inter text-sm text-ftm-mutl mb-8">Use the ID sent to your student email.</p>

            {/* Error alert */}
            {error && (
              <div className="mb-6 bg-ftm-crimsontint border border-ftm-crimson/25 rounded-md p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-ftm-crimson mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ftm-crimson">Authentication Error</p>
                  <p className="text-sm text-ftm-bodyl mt-0.5">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-ftm-crimson/60 hover:text-ftm-crimson">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit}>
              <label htmlFor="eptId" className="block font-inter font-semibold text-xs text-ftm-bodyl mb-1.5">
                EPT ID
              </label>
              <input
                id="eptId"
                type="text"
                placeholder="e.g., EPT-2026-04471"
                value={eptId}
                onChange={(e) => setEptId(e.target.value)}
                required
                autoFocus
                className="block w-full font-inter text-sm text-ftm-panel placeholder-ftm-mutl/70 bg-white border border-ftm-panel/[.16] rounded-md px-3.5 py-3 mb-[26px] focus:outline-none focus:border-ftm-crimson focus:ring-1 focus:ring-ftm-crimson transition-colors"
              />

              <button
                type="submit"
                disabled={isLoading || !eptId.trim()}
                className={`w-full flex items-center justify-center gap-2 font-inter font-semibold text-sm text-white rounded-md px-5 py-3.5 transition-colors ${
                  isLoading || !eptId.trim()
                    ? 'bg-ftm-mutl/40 cursor-not-allowed'
                    : 'bg-ftm-crimson hover:bg-[#A80F26]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in&hellip;
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>

            <div className="flex justify-between mt-[18px]">
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Forgot my EPT ID`}
                className="font-inter font-medium text-[12.5px] text-ftm-crimson hover:underline"
              >
                Forgot your ID?
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-inter font-medium text-[12.5px] text-ftm-slatel hover:underline"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
