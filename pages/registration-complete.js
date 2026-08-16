// pages/registration-complete.js — the booking confirmation.
//
// This page had a green circle that pulsed, containing a smaller green circle,
// containing a tick that bounced, with a third ring pinging outward around all
// of it. Three simultaneous animations to say one thing: you are booked.
//
// It is now a confirmation panel of the kind you would print and put in a bag:
// the date large, the facts ruled, and what happens next as a short list. It
// also prints properly, which the old version did not.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../components/UIDesignSystem';
import { AppSkeleton } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';
import PaperFooter from '../components/PaperFooter';

const SUPPORT_EMAIL = 'thewritingcentre@alueducation.com';

export default function RegistrationComplete() {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const details = sessionStorage.getItem('bookingDetails');
    if (!details) {
      addToast({
        type: 'error',
        title: 'Session expired',
        message: 'Sign in again to see your booking.',
      });
      router.push('/login');
      return;
    }
    setBookingDetails(JSON.parse(details));
    setLoading(false);
  }, [router, addToast]);

  if (loading) return <AppSkeleton />;

  return (
    <div className="min-h-screen bg-ftm-night flex flex-col">
      <div className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12">
        <div className="max-w-[640px]">
          <div className="border-t-2 border-ftm-green pt-6 mb-10">
            <p className="font-inter font-bold text-[11px] tracking-[.14em] uppercase text-ftm-green mb-3">
              Booked
            </p>
            <h1 className="font-grotesk font-bold text-[34px] leading-tight text-ftm-ink mb-3">
              {bookingDetails.selectedDate}
            </h1>
            <p className="font-inter text-[19px] text-ftm-mut">
              10:00 at ALU Kigali. Allow about three hours.
            </p>
          </div>

          <h2 className="font-grotesk font-bold text-[17px] text-ftm-ink mb-4">Your booking</h2>
          <dl className="ftm-facts mb-10">
            <div><dt className="k">Name</dt><dd className="v">{bookingDetails.name}</dd></div>
            <div><dt className="k">Email</dt><dd className="v break-all">{bookingDetails.email}</dd></div>
            <div><dt className="k">Date</dt><dd className="v">{bookingDetails.selectedDate}</dd></div>
            <div><dt className="k">Starts</dt><dd className="v">10:00</dd></div>
            <div><dt className="k">Place</dt><dd className="v">ALU Kigali</dd></div>
            <div>
              <dt className="k">Laptop</dt>
              <dd className="v">{bookingDetails.hasLaptop ? 'Bringing my own' : 'Using a provided one'}</dd>
            </div>
            {bookingDetails.bookingDate && (
              <div>
                <dt className="k">Booked on</dt>
                <dd className="v">
                  {new Date(bookingDetails.bookingDate).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </dd>
              </div>
            )}
          </dl>

          <h2 className="font-grotesk font-bold text-[17px] text-ftm-ink mb-4">On the day</h2>
          <ul className="list-none p-0 m-0 border-t border-ftm-line2 mb-10">
            {[
              'Arrive 15 minutes early.',
              'Bring your student ID.',
              bookingDetails.hasLaptop
                ? 'Bring your laptop, charged, with its charger.'
                : 'A laptop will be waiting for you.',
              'The portal unlocks at 10:00 on the day and not before.',
            ].map((item) => (
              <li key={item} className="font-inter text-[16px] leading-relaxed text-ftm-mut py-3 border-b border-ftm-line">
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-ftm-line print:hidden">
            <Button variant="primary" onClick={() => router.push('/home')}>
              Back to my dashboard
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              Print this page
            </Button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Futurimi booking`}
              className="font-inter text-[15px] text-ftm-link underline underline-offset-4 hover:text-ftm-ink transition-colors"
            >
              Contact the Writing Centre
            </a>
          </div>
        </div>
      </div>

      <PaperFooter tone="night" />
    </div>
  );
}
