// pages/home.js — the candidate's dashboard.
//
// What changed and why:
//   - The four bordered, rounded, gradient-filled stat cards are gone. They
//     spent most of their ink on borders and corners to deliver four short
//     strings. They are now a ruled fact list: label left, value right, one
//     hairline between. Tufte's data-ink test.
//   - The main-column / sidebar split (a bento in all but name) is now one
//     column at reading measure with a narrow facts rail. There is only ever
//     one thing to do on this page; the layout should say so.
//   - The section list is a table with real column headers, not three cards.
//   - Icons redrawn on Otl Aicher's grid: 24×24, 1.5px, square caps, strokes
//     only horizontal, vertical or 45°.
//   - The loading state is a skeleton of this page, not a spinner.
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useToast } from '../components/ToastContext';
import { AluMark } from '../components/Futurimi';
import PaperFooter from '../components/PaperFooter';

const sectionIcons = {
  Reading: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
      <path d="M4 5h7v14H4z" /><path d="M13 5h7v14h-7z" />
      <path d="M6 9h3M6 12h3M15 9h3M15 12h3" />
    </svg>
  ),
  Writing: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
      <path d="M5 19h4L19 9l-4-4L5 15z" /><path d="M14 6l4 4" />
    </svg>
  ),
  Listening: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
      <path d="M5 10v4M9 7v10M13 9v6M17 6v12M21 10v4" />
    </svg>
  ),
};

const TEST_SECTIONS = [
  { name: 'Reading', duration: '60 min', description: 'Comprehension passages, multiple choice' },
  { name: 'Writing', duration: '45 min', description: 'One essay, written in the room' },
  { name: 'Listening', duration: '30 min', description: 'Audio comprehension with questions' },
];

function Fact({ label, children }) {
  return (
    <div>
      <dt className="k">{label}</dt>
      <dd className="v">{children}</dd>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-ftm-night">
      <div className="max-w-shell mx-auto px-6 sm:px-10 py-12" aria-busy="true" aria-label="Loading your dashboard">
        <div className="ftm-skeleton h-8 w-64 mb-3" />
        <div className="ftm-skeleton h-4 w-80 mb-12" />
        <div className="border-t border-ftm-line2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between py-3 border-b border-ftm-line">
              <div className="ftm-skeleton h-3.5 w-24" />
              <div className="ftm-skeleton h-3.5 w-40" />
            </div>
          ))}
        </div>
        <div className="ftm-skeleton h-40 w-full mt-12" />
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
    const parsed = JSON.parse(storedUserData);
    setUserData(parsed);
    checkRegistration(parsed.eptId);
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
    } catch {
      addToast({
        type: 'error',
        title: 'Could not reach the server',
        message: 'We could not check your registration. Refresh the page to try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <HomeSkeleton />;
  if (!userData) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const status = hasCompletedTests ? 'Completed' : bookingDetails ? 'Registered' : 'Not booked';

  // One primary action per state. Never two.
  const action = !bookingDetails
    ? {
        eyebrow: 'You have not booked yet',
        heading: 'Book your test date',
        body: 'Choose a sitting at ALU Kigali. Places on each date are capped, so earlier dates fill first.',
        label: 'Choose a date',
        href: '/booking',
      }
    : hasCompletedTests
      ? {
          eyebrow: 'All sections submitted',
          heading: 'You are finished',
          body: 'Every section is in. The Writing Centre releases results once marking is checked; nothing more is needed from you.',
          label: 'See what you submitted',
          href: '/test-complete',
        }
      : {
          eyebrow: 'You are booked',
          heading: `${bookingDetails.selectedDate}, 10:00`,
          body: 'At ALU Kigali. The portal unlocks at 10:00 on the day and not before. Bring your EPT ID and arrive early enough to settle.',
          label: 'Go to the test portal',
          href: '/test-portal',
        };

  return (
    <div className="min-h-screen bg-ftm-night flex flex-col">
      <div className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <h1 className="font-grotesk font-bold text-[30px] leading-tight text-ftm-ink mb-1">
              {getGreeting()}, {userData.name.split(' ')[0]}
            </h1>
            <p className="font-inter text-[15px] text-ftm-mut">
              Your Futurimi sitting, and what it involves.
            </p>
          </div>
          <AluMark height={16} opacity={0.5} className="hidden sm:block mt-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-12 items-start">
          <div>
            {/* The single action for this state */}
            <div className="border-t-2 border-ftm-crimson bg-ftm-card px-6 py-7 mb-12">
              <p className="font-inter font-bold text-[11px] tracking-[.14em] uppercase text-ftm-ochre">
                {action.eyebrow}
              </p>
              <h2 className="font-grotesk font-bold text-[24px] text-ftm-ink mt-2 mb-3">
                {action.heading}
              </h2>
              <p className="font-inter text-[15px] leading-relaxed text-ftm-mut mb-6 max-w-measure">
                {action.body}
              </p>
              <button
                onClick={() => router.push(action.href)}
                className="font-inter font-bold text-[15px] text-white bg-ftm-crimson hover:bg-ftm-crimsondeep px-6 py-3.5 transition-colors"
              >
                {action.label}
              </button>
            </div>

            {/* Sections — a table, with headers, not three cards */}
            <h2 className="font-grotesk font-bold text-[17px] text-ftm-ink mb-4">
              What the exam involves
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full font-inter text-[14px] border-collapse min-w-[420px]">
                <caption className="sr-only">The three sections of the Futurimi exam</caption>
                <thead>
                  <tr>
                    <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                      Section
                    </th>
                    <th scope="col" className="text-left font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 pr-4 border-b border-ftm-line2">
                      What you do
                    </th>
                    <th scope="col" className="text-right font-semibold text-[10px] tracking-[.14em] uppercase text-ftm-dim py-2 border-b border-ftm-line2">
                      Length
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TEST_SECTIONS.map((section) => (
                    <tr key={section.name}>
                      <th scope="row" className="text-left py-3.5 pr-4 border-b border-ftm-line align-top">
                        <span className="inline-flex items-center gap-3 font-semibold text-ftm-ink">
                          <span className="text-ftm-slate">{sectionIcons[section.name]}</span>
                          {section.name}
                        </span>
                      </th>
                      <td className="py-3.5 pr-4 border-b border-ftm-line align-top text-ftm-mut">
                        {section.description}
                      </td>
                      <td className="py-3.5 border-b border-ftm-line align-top text-right text-ftm-ink tabular-nums whitespace-nowrap">
                        {section.duration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Facts — ruled, not carded */}
          <aside>
            <h2 className="font-grotesk font-bold text-[17px] text-ftm-ink mb-4">Your sitting</h2>
            <dl className="ftm-facts">
              <Fact label="Name">{userData.name}</Fact>
              <Fact label="EPT ID">
                <span data-figure>{userData.eptId}</span>
              </Fact>
              <Fact label="Email">
                <span className="break-all">{userData.email}</span>
              </Fact>
              <Fact label="Test date">{bookingDetails?.selectedDate || 'Not booked'}</Fact>
              {bookingDetails && (
                <Fact label="Laptop">
                  {bookingDetails.hasLaptop ? 'Bringing my own' : 'Using a provided one'}
                </Fact>
              )}
              <Fact label="Status">{status}</Fact>
            </dl>

            <div className="border-l-[6px] border-ftm-ochre pl-4 py-1 mt-8">
              <p className="font-inter font-bold text-[14px] text-ftm-ochre mb-1">On the day</p>
              <p className="font-inter text-[14px] leading-relaxed text-ftm-mut">
                The portal opens at 10:00 and the exam runs in fullscreen. Leaving fullscreen
                or switching tabs is recorded.{' '}
                <Link href="/privacy" className="text-ftm-ink underline underline-offset-4 hover:text-ftm-ochre transition-colors">
                  What the exam records
                </Link>
                .
              </p>
            </div>

            {!bookingDetails && (
              <Link
                href="/booking"
                className="inline-block mt-8 font-inter text-[14px] text-ftm-link underline underline-offset-4 hover:text-ftm-ink transition-colors"
              >
                Book a test date
              </Link>
            )}
          </aside>
        </div>
      </div>

      <PaperFooter tone="night" />
    </div>
  );
}
