// pages/login.js — Futurimi sign-in.
//
// This used to be a split screen: a dark panel carrying a rotating WebGL
// particle globe over a radial glow, beside a pure-white form panel. Three
// separate problems in one layout — the orb, the dot cloud, and #FFFFFF.
//
// It is now a single measured column on warm paper, in the GOV.UK manner: one
// question per screen, a large label, a large target, and an error summary at
// the top that moves focus to the field that failed. The only ornament is the
// imigongo register along the top edge.
import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../components/ToastContext';
import { FuturimiWordmark, FuturimiRegister, AluMark } from '../components/Futurimi';
import PaperFooter from '../components/PaperFooter';

const SUPPORT_EMAIL = 'thewritingcentre@alueducation.com';

export default function Login() {
  const [eptId, setEptId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const errorRef = useRef(null);
  const router = useRouter();
  const { addToast } = useToast();

  const fail = (message) => {
    setError(message);
    addToast({ type: 'error', title: 'Sign-in failed', message });
    // Move focus to the summary so a screen reader announces it and a keyboard
    // user lands on the link back to the field.
    requestAnimationFrame(() => errorRef.current?.focus());
  };

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
        throw new Error(authData.message || 'We could not match that EPT ID.');
      }

      sessionStorage.setItem('userData', JSON.stringify({
        name: authData.name,
        email: authData.email,
        eptId: authData.eptId,
      }));
      sessionStorage.setItem('csrfToken', authData.csrfToken);

      addToast({
        type: 'success',
        title: 'Signed in',
        message: `Welcome back, ${authData.name}.`,
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
        router.push(bookingData.hasCompletedTests ? '/test-complete' : '/home');
      } else {
        router.push('/booking');
      }
    } catch (err) {
      fail(err.message || 'We could not sign you in. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="on-paper min-h-screen flex flex-col bg-ftm-paper text-ftm-panel">
      <FuturimiRegister tone="paper" tall />

      <header className="w-full max-w-shell mx-auto px-6 sm:px-10 pt-8 flex items-center justify-between">
        <FuturimiWordmark size={26} ink="#20262B" diamond="#C5132D" />
        <AluMark height={17} opacity={0.85} tone="paper" />
      </header>

      <main className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12 sm:py-20
                       grid grid-cols-1 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)] gap-16">
        <div>
          <p className="font-inter font-bold text-[11px] tracking-[.16em] uppercase text-ftm-slatel">
            English Proficiency Test &middot; ALU Kigali
          </p>
          <h1 className="font-grotesk font-bold text-[34px] sm:text-[42px] leading-[1.05] tracking-[-.02em] text-ftm-panel mt-4 mb-4">
            Sign in to Futurimi
          </h1>
          <p className="font-inter text-[17px] leading-relaxed text-ftm-bodyl mb-10 max-w-measure">
            One exam, three sections, a result recognised across every programme.
            Sign in with the EPT ID sent to your student email.
          </p>

          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="border-l-[6px] border-ftm-crimson bg-ftm-crimsontint px-5 py-4 mb-10"
            >
              <h2 className="font-grotesk font-bold text-[15px] text-ftm-crimson mb-1">
                There is a problem
              </h2>
              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="font-inter text-[15px] text-ftm-panel underline underline-offset-4 text-left"
              >
                {error}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="eptId" className="block font-inter font-bold text-[17px] text-ftm-panel mb-1">
              EPT ID
            </label>
            <p id="eptId-hint" className="font-inter text-[15px] text-ftm-mutl mb-3">
              It looks like EPT-2026-04471.
            </p>
            <input
              id="eptId"
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck="false"
              aria-describedby="eptId-hint"
              aria-invalid={error ? 'true' : 'false'}
              value={eptId}
              onChange={(e) => setEptId(e.target.value)}
              required
              autoFocus
              data-figure
              className={`block w-full max-w-[380px] font-inter text-[19px] tracking-[.01em] text-ftm-panel
                bg-white border-2 px-4 py-3 mb-8 transition-colors
                ${error ? 'border-ftm-crimson' : 'border-ftm-linel2 focus:border-ftm-panel'}`}
            />

            <button
              type="submit"
              disabled={isLoading || !eptId.trim()}
              className={`inline-flex items-center justify-center gap-3 font-inter font-bold text-[17px] text-white
                px-8 py-4 transition-colors
                ${isLoading || !eptId.trim()
                  ? 'bg-ftm-mutl cursor-not-allowed'
                  : 'bg-ftm-crimson hover:bg-ftm-crimsondeep'}`}
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
              )}
              {isLoading ? 'Signing in' : 'Continue'}
            </button>
          </form>

          <div className="flex flex-wrap gap-x-8 gap-y-2 mt-10 pt-6 border-t border-ftm-linel">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Forgot my EPT ID`}
              className="font-inter text-[15px] text-ftm-crimson underline underline-offset-4 hover:text-ftm-crimsondeep transition-colors"
            >
              I have forgotten my EPT ID
            </a>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-inter text-[15px] text-ftm-bodyl underline underline-offset-4 hover:text-ftm-panel transition-colors"
            >
              Contact the Writing Centre
            </a>
          </div>
        </div>

        {/*
          The one intervention the exam-anxiety research actually names is being
          able to familiarise yourself with the platform beforehand. So the
          space beside the form carries the shape of the exam rather than
          decoration. It replaces the WebGL globe that stood here.
        */}
        <aside className="hidden lg:block max-w-[380px] lg:justify-self-end">
          <h2 className="font-inter font-bold text-[11px] tracking-[.16em] uppercase text-ftm-slatel mb-4">
            What the exam involves
          </h2>
          <table className="w-full font-inter text-[14px] border-collapse">
            <tbody>
              {[
                ['Reading', '60 min', 'Comprehension passages, multiple choice'],
                ['Writing', '45 min', 'One essay, written in the room'],
                ['Listening', '30 min', 'Audio comprehension with questions'],
              ].map(([name, length, what]) => (
                <tr key={name}>
                  <th scope="row" className="text-left align-top py-3 pr-4 border-b border-ftm-linel font-semibold text-ftm-panel whitespace-nowrap">
                    {name}
                  </th>
                  <td className="align-top py-3 pr-4 border-b border-ftm-linel text-ftm-bodyl">{what}</td>
                  <td className="align-top py-3 border-b border-ftm-linel text-right text-ftm-panel tabular-nums whitespace-nowrap">
                    {length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="font-inter text-[14px] leading-relaxed text-ftm-mutl mt-5">
            Sittings run at ALU Kigali and open at 10:00 on the day you booked. The exam
            runs in fullscreen and records tab switches.{' '}
            <a href="/privacy" className="text-ftm-crimson underline underline-offset-4 hover:text-ftm-crimsondeep transition-colors">
              What the exam records
            </a>
            .
          </p>
        </aside>
      </main>

      <PaperFooter />
    </div>
  );
}
