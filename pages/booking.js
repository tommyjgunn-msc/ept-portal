// pages/booking.js — Futurimi booking flow.
//
// The logic (capacity maths, three-week window, next-available-date recovery)
// is unchanged. What changed is everything the candidate sees:
//   - The step indicator was four circles joined by lines, with green ticks for
//     completed steps. It is now a segmented rule plus "Step 3 of 4", which
//     survives being read aloud and does not rely on colour.
//   - The date picker was a grid of rounded cards. It is now a ruled list of
//     real radios with the remaining count right-aligned in tabular figures —
//     you can compare availability down the column at a glance.
//   - Errors follow the GOV.UK pattern: a summary at the top of the form.
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { isWithinThreeWeeks, isFutureDate, isDateVisibleISO } from '../utils/dateUtils';
import { useToast } from '../components/ToastContext';
import PaperFooter from '../components/PaperFooter';

const STEPS = ['Your details', 'Laptop', 'Date', 'Confirm'];

// 'Friday, 05 June' -> { weekday: 'Friday', short: '05 June' }
function splitDate(dateStr) {
  const [weekday, rest] = String(dateStr).split(', ');
  return { weekday: weekday || '', short: rest || dateStr };
}

function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="mb-8">
      <label htmlFor={htmlFor} className="block font-inter font-bold text-[17px] text-ftm-ink mb-1">
        {label}
      </label>
      {hint && (
        <p id={`${htmlFor}-hint`} className="font-inter text-[14px] text-ftm-mut mb-3">
          {hint}
        </p>
      )}
      {error && (
        <p className="font-inter font-semibold text-[14px] text-ftm-ochre mb-3">{error}</p>
      )}
      {children}
    </div>
  );
}

export default function Booking() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hasLaptop: null,
    selectedDate: '',
    confirmedAttendance: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dateCapacity, setDateCapacity] = useState({});
  const [regularDates, setRegularDates] = useState([]);
  const errorRef = useRef(null);
  const router = useRouter();
  const { addToast } = useToast();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

  useEffect(() => {
    async function fetchTestDates() {
      try {
        const response = await fetch('/api/test-dates');
        if (response.ok) {
          const { regularDates } = await response.json();
          setRegularDates(regularDates);
        }
      } catch {
        addToast({
          type: 'error',
          title: 'Could not load dates',
          message: 'We could not load the available test dates. Refresh the page to try again.',
        });
      }
    }
    fetchTestDates();
  }, [addToast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/bookings/count');
        if (response.ok) setDateCapacity(await response.json());
      } catch {}
    }
    fetchData();
  }, []);

  const getAvailableSpots = (date, hasLaptop) => {
    const dateConfig = regularDates.find(d => d.date === date);
    if (!dateConfig) return 0;
    const booked = dateCapacity[date] || { withLaptop: 0, withoutLaptop: 0 };
    const totalBooked = booked.withLaptop + booked.withoutLaptop;
    if (totalBooked >= 100) return 0;
    const categorySpots = hasLaptop
      ? dateConfig.capacity.withLaptop - booked.withLaptop
      : dateConfig.capacity.withoutLaptop - booked.withoutLaptop;
    return Math.max(0, Math.min(categorySpots, 100 - totalBooked));
  };

  // Same rule as always: only dates from today to three weeks out are bookable.
  // Prefer the real ISO date when the API supplies one (admin-managed dates);
  // fall back to parsing the legacy yearless display string.
  const isDateVisible = (dateObj) =>
    dateObj?.date_iso
      ? isDateVisibleISO(dateObj.date_iso)
      : isFutureDate(dateObj.date) && isWithinThreeWeeks(dateObj.date);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => { if (step < 4) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const fail = (message) => {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) { nextStep(); return; }

    setIsLoading(true);
    setError('');

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      if (!userData.eptId) {
        fail('We could not find your EPT ID. Sign in again and retry.');
        return;
      }

      const csrfToken = sessionStorage.getItem('csrfToken');
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({ ...formData, eptId: userData.eptId }),
      });

      const result = await response.json();
      if (!response.ok) {
        // If capacity error, suggest next available date
        if (result.message?.includes('fully booked') || result.message?.includes('No more spaces')) {
          const nextAvailable = regularDates
            .filter(d => isDateVisible(d) && d.date !== formData.selectedDate)
            .find(d => getAvailableSpots(d.date, formData.hasLaptop) > 0);

          if (nextAvailable) {
            setStep(3);
            fail(`That date filled up. The next date with space is ${nextAvailable.date}.`);
            return;
          }
        }
        throw new Error(result.message || 'We could not complete your booking.');
      }

      setSuccess(true);
      addToast({ type: 'success', title: 'Booked', message: 'Your sitting is confirmed.' });
      setTimeout(() => router.push('/registration-complete'), 1200);
    } catch (err) {
      fail(err.message || 'We could not complete your booking. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ftm-night flex items-center justify-center px-6">
        <div className="max-w-measure border-t-2 border-ftm-green pt-6">
          <h1 className="font-grotesk font-bold text-[28px] text-ftm-ink mb-2">You are booked</h1>
          <p className="font-inter text-[15px] text-ftm-mut">Taking you to your confirmation.</p>
        </div>
      </div>
    );
  }

  const visibleDates = regularDates.filter(isDateVisible);

  const cannotAdvance =
    (step === 1 && (!formData.name || !formData.email || !validateEmail(formData.email))) ||
    (step === 2 && formData.hasLaptop === null) ||
    (step === 3 && !formData.selectedDate) ||
    (step === 4 && !formData.confirmedAttendance);

  const inputClass = `block w-full max-w-[420px] font-inter text-[17px] text-ftm-ink bg-ftm-night
    border-2 border-ftm-line2 focus:border-ftm-ink px-4 py-3 transition-colors`;

  return (
    <div className="min-h-screen bg-ftm-night flex flex-col">
      <div className="flex-1 w-full max-w-shell mx-auto px-6 sm:px-10 py-12">
        <div className="max-w-[640px]">
          <h1 className="font-grotesk font-bold text-[30px] text-ftm-ink mb-2">Book your test date</h1>
          <p className="font-inter text-[15px] text-ftm-mut mb-10">
            All sittings run at ALU Kigali and start at 10:00.
          </p>

          {/* Step indicator — a segmented rule, not a row of circles */}
          <div className="mb-10">
            <p className="font-inter font-bold text-[11px] tracking-[.14em] uppercase text-ftm-dim mb-2">
              Step <span data-figure>{step}</span> of <span data-figure>{STEPS.length}</span>
              <span className="text-ftm-ink normal-case tracking-normal text-[13px] ml-2 font-semibold">
                {STEPS[step - 1]}
              </span>
            </p>
            <div className="flex gap-1" role="presentation">
              {STEPS.map((title, i) => (
                <div
                  key={title}
                  className={`h-1 flex-1 ${i < step ? 'bg-ftm-crimson' : 'bg-ftm-up'}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="border-l-[6px] border-ftm-crimson bg-ftm-card px-5 py-4 mb-10"
            >
              <h2 className="font-grotesk font-bold text-[15px] text-ftm-ochre mb-1">There is a problem</h2>
              <p className="font-inter text-[15px] text-ftm-ink">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <Field label="Full name" hint="As it appears on your student ID." htmlFor="name">
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Email address"
                  hint="We send test updates and results here."
                  htmlFor="email"
                  error={formData.email && !validateEmail(formData.email) ? 'Enter an email address in the format name@example.com.' : ''}
                >
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <fieldset className="mb-8">
                <legend className="font-inter font-bold text-[17px] text-ftm-ink mb-1">
                  Will you bring your own laptop?
                </legend>
                <p className="font-inter text-[14px] text-ftm-mut mb-4">
                  Bringing your own is preferred. We can provide one, but there are fewer of those places.
                </p>
                <div className="border-t border-ftm-line2">
                  {[
                    { value: true, label: 'Yes, I will bring my own laptop' },
                    { value: false, label: 'No, please provide one' },
                  ].map((option) => (
                    <label
                      key={option.value.toString()}
                      className="flex items-center gap-4 py-4 border-b border-ftm-line cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="hasLaptop"
                        value={option.value.toString()}
                        checked={formData.hasLaptop === option.value}
                        onChange={() => updateFormData('hasLaptop', option.value)}
                        className="w-5 h-5 accent-[#C5132D] flex-none"
                        required
                      />
                      <span className={`font-inter text-[16px] transition-colors ${
                        formData.hasLaptop === option.value
                          ? 'text-ftm-ink font-semibold'
                          : 'text-ftm-mut group-hover:text-ftm-ink'
                      }`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="mb-8">
                <legend className="font-inter font-bold text-[17px] text-ftm-ink mb-1">
                  Choose a date
                </legend>
                <p className="font-inter text-[14px] text-ftm-mut mb-4">
                  Dates in the next three weeks. Places shown are for{' '}
                  {formData.hasLaptop ? 'candidates bringing a laptop' : 'candidates using a provided laptop'}.
                </p>

                {visibleDates.length === 0 ? (
                  <p className="font-inter text-[15px] text-ftm-mut border-t border-ftm-line2 pt-4">
                    No dates are open at the moment. Email the Writing Centre and we will tell you when the
                    next sittings are published.
                  </p>
                ) : (
                  <div className="border-t border-ftm-line2 max-h-[420px] overflow-y-auto custom-scrollbar">
                    {visibleDates.map((dateObj) => {
                      const spots = getAvailableSpots(dateObj.date, formData.hasLaptop);
                      const isAvailable = spots > 0;
                      const isSelected = formData.selectedDate === dateObj.date;
                      const { weekday, short } = splitDate(dateObj.date);

                      return (
                        <label
                          key={dateObj.date}
                          className={`flex items-center gap-4 py-4 pr-1 border-b border-ftm-line group ${
                            isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="selectedDate"
                            value={dateObj.date}
                            checked={isSelected}
                            onChange={() => updateFormData('selectedDate', dateObj.date)}
                            disabled={!isAvailable}
                            className="w-5 h-5 accent-[#C5132D] flex-none"
                            required
                          />
                          <span className="flex-1 min-w-0">
                            <span className={`block font-inter text-[16px] ${
                              isSelected ? 'text-ftm-ink font-semibold' : 'text-ftm-ink group-hover:text-ftm-ink'
                            }`}>
                              {short}
                            </span>
                            <span className="block font-inter text-[13px] text-ftm-dim">{weekday}, 10:00</span>
                          </span>
                          <span
                            className={`font-inter text-[13px] tabular-nums whitespace-nowrap ${
                              isAvailable ? 'text-ftm-mut' : 'text-ftm-ochre font-semibold'
                            }`}
                          >
                            {isAvailable ? `${spots} places left` : 'Full'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            )}

            {step === 4 && (
              <div className="mb-8">
                <h2 className="font-grotesk font-bold text-[19px] text-ftm-ink mb-4">
                  Check your answers
                </h2>
                <dl className="ftm-facts mb-8">
                  <div><dt className="k">Name</dt><dd className="v">{formData.name}</dd></div>
                  <div><dt className="k">Email</dt><dd className="v break-all">{formData.email}</dd></div>
                  <div><dt className="k">Test date</dt><dd className="v">{formData.selectedDate}</dd></div>
                  <div><dt className="k">Time and place</dt><dd className="v">10:00, ALU Kigali</dd></div>
                  <div>
                    <dt className="k">Laptop</dt>
                    <dd className="v">{formData.hasLaptop ? 'Bringing my own' : 'Using a provided one'}</dd>
                  </div>
                </dl>

                <label className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="w-5 h-5 accent-[#C5132D] mt-0.5 flex-none"
                    checked={formData.confirmedAttendance}
                    onChange={(e) => updateFormData('confirmedAttendance', e.target.checked)}
                  />
                  <span className="font-inter text-[15px] leading-relaxed text-ftm-mut">
                    I will attend in person on this date. I understand that missing it means booking again,
                    and I have read the{' '}
                    <a href="/terms" className="text-ftm-ink underline underline-offset-4 hover:text-ftm-ochre transition-colors">
                      exam rules
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-ftm-ink underline underline-offset-4 hover:text-ftm-ochre transition-colors">
                      what the exam records
                    </a>
                    .
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center gap-6 pt-8 border-t border-ftm-line">
              <button
                type="submit"
                disabled={isLoading || cannotAdvance}
                className={`inline-flex items-center gap-3 font-inter font-bold text-[16px] text-white px-7 py-3.5 transition-colors
                  ${isLoading || cannotAdvance
                    ? 'bg-ftm-up text-ftm-dim cursor-not-allowed'
                    : 'bg-ftm-crimson hover:bg-ftm-crimsondeep'}`}
              >
                {isLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                )}
                {step === 4 ? 'Confirm booking' : 'Continue'}
              </button>
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="font-inter text-[15px] text-ftm-link underline underline-offset-4 hover:text-ftm-ink transition-colors"
                >
                  Back
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <PaperFooter tone="night" />
    </div>
  );
}
