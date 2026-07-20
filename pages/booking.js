// pages/booking.js — Futurimi booking flow (capacity display + error recovery preserved)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isWithinThreeWeeks, isFutureDate, isDateVisibleISO } from '../utils/dateUtils';
import { Card, FormField, Input, Alert, Badge } from '../components/UIDesignSystem';
import { LoadingButton } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';

// 'Friday, 05 June' -> { weekday: 'Fri', short: '05 June' }
function splitDate(dateStr) {
  const [weekday, rest] = String(dateStr).split(', ');
  return { weekday: (weekday || '').slice(0, 3), short: rest || dateStr };
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
        addToast({ type: 'error', title: 'Loading Error', message: 'Failed to load test dates. Please refresh.' });
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

  const getTotalRemaining = (date) => {
    const booked = dateCapacity[date] || { withLaptop: 0, withoutLaptop: 0 };
    return Math.max(0, 100 - booked.withLaptop - booked.withoutLaptop);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) { nextStep(); return; }

    setIsLoading(true);
    setError('');

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      if (!userData.eptId) { setError('EPT ID not found. Please log in again.'); return; }

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
            setError(`${result.message} Next available: ${nextAvailable.date}`);
            setStep(3);
            return;
          }
        }
        throw new Error(result.message || 'Failed to create booking');
      }

      setSuccess(true);
      addToast({ type: 'success', title: 'Registration Successful!', message: 'Your test has been scheduled.' });
      setTimeout(() => router.push('/registration-complete'), 1500);
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ftm-night flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-ftm-green/[.14] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-ftm-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-grotesk text-2xl font-bold text-ftm-ink mb-2">Registration Complete!</h2>
          <p className="text-ftm-mut">Redirecting to your confirmation&hellip;</p>
        </Card>
      </div>
    );
  }

  const steps = ['Personal Info', 'Laptop Setup', 'Select Date', 'Confirm'];

  return (
    <div className="min-h-screen bg-ftm-night">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-7">
            <h1 className="font-grotesk font-bold text-2xl text-ftm-ink mb-1">Book your Futurimi date</h1>
            <p className="font-inter text-sm text-ftm-mut">All sessions run at ALU Kigali. Choose a date and time that works for you.</p>
          </div>

          <Card className="p-8" hover={false}>
            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {steps.map((title, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step > index + 1 ? 'bg-ftm-green/[.2] text-ftm-green' :
                      step === index + 1 ? 'bg-ftm-red text-white shadow-redglow' :
                      'bg-white/[.06] text-ftm-dim'
                    }`}>
                      {step > index + 1 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`hidden sm:block w-12 md:w-20 h-0.5 mx-2 transition-all ${
                        step > index + 1 ? 'bg-ftm-green/50' : 'bg-white/[.08]'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                {steps.map((title, index) => (
                  <span key={index} className={`${
                    step === index + 1 ? 'text-ftm-red font-semibold' :
                    step > index + 1 ? 'text-ftm-green' : 'text-ftm-dim'
                  }`}>
                    {title}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <Alert type="error" title="Registration Error" dismissible onDismiss={() => setError('')} className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <FormField label="Full Name" required helpText="Enter your full name as it appears on your ID">
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      required
                      icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    />
                  </FormField>
                  <FormField
                    label="Email Address"
                    required
                    helpText="We'll send test updates and results to this email"
                    error={formData.email && !validateEmail(formData.email) ? 'Please enter a valid email address' : ''}
                  >
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      required
                      error={formData.email && !validateEmail(formData.email)}
                      icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    />
                  </FormField>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-6">
                  <FormField label="Will you bring your own laptop?" required helpText="Bringing your own is preferred. We can provide one if needed (limited availability).">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { value: true, label: 'Bringing own laptop', desc: 'I have my own laptop' },
                        { value: false, label: 'Use provided laptop', desc: 'Please provide one for me' },
                      ].map((option) => (
                        <label
                          key={option.value.toString()}
                          className={`flex flex-col items-center p-5 border rounded-lg cursor-pointer transition-all ${
                            formData.hasLaptop === option.value
                              ? 'border-ftm-red border-2 bg-ftm-red/[.12]'
                              : 'border-white/[.08] bg-ftm-night hover:border-white/[.18]'
                          }`}
                        >
                          <input type="radio" name="hasLaptop" value={option.value} checked={formData.hasLaptop === option.value} onChange={() => updateFormData('hasLaptop', option.value)} className="sr-only" required />
                          <span className={`font-inter font-semibold text-sm ${formData.hasLaptop === option.value ? 'text-ftm-ink' : 'text-ftm-slate'}`}>{option.label}</span>
                          <span className="font-inter text-xs text-ftm-dim mt-0.5">{option.desc}</span>
                        </label>
                      ))}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Step 3 — date grid */}
              {step === 3 && (
                <div className="space-y-6">
                  <FormField label="Select Test Date" required helpText="Choose from available dates within the next three weeks">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                      {regularDates
                        .filter(dateObj => isDateVisible(dateObj))
                        .map((dateObj) => {
                          const spots = getAvailableSpots(dateObj.date, formData.hasLaptop);
                          const isAvailable = spots > 0;
                          const isSelected = formData.selectedDate === dateObj.date;
                          const { weekday, short } = splitDate(dateObj.date);

                          return (
                            <label
                              key={dateObj.date}
                              className={`relative block p-4 rounded-lg cursor-pointer transition-all ${
                                !isAvailable ? 'border border-white/[.05] bg-ftm-night opacity-50 cursor-not-allowed' :
                                isSelected ? 'border-2 border-ftm-red bg-ftm-red/[.12] p-[15px]' :
                                'border border-white/[.08] bg-ftm-card hover:border-white/[.18]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="selectedDate"
                                value={dateObj.date}
                                checked={isSelected}
                                onChange={() => updateFormData('selectedDate', dateObj.date)}
                                disabled={!isAvailable}
                                className="sr-only"
                                required
                              />
                              <span className={`font-inter font-medium text-[11px] uppercase ${isSelected ? 'text-ftm-redsoft' : 'text-ftm-dim'}`}>
                                {weekday}
                              </span>
                              <div className="font-grotesk font-bold text-xl text-ftm-ink my-1">{short}</div>
                              <span className={`font-inter font-medium text-xs ${isSelected ? 'text-[#F0B4BD]' : 'text-ftm-mut'}`}>
                                {isAvailable ? `${spots} slots left` : 'Full'}
                              </span>
                              {isSelected && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0273F" strokeWidth="2.2" className="absolute top-3 right-3">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </label>
                          );
                        })}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Step 4 — summary */}
              {step === 4 && (
                <div className="space-y-6">
                  <Alert type="info" title="Please Review Your Information">
                    Confirm all details are correct before submitting.
                  </Alert>
                  <div className="bg-ftm-night border border-white/[.08] p-6 rounded-lg space-y-4">
                    <h3 className="font-grotesk font-semibold text-ftm-ink">Registration Summary</h3>
                    <div className="grid gap-3 text-sm">
                      {[
                        ['Name', formData.name],
                        ['Email', formData.email],
                        ['Test Date', formData.selectedDate],
                        ['Time & Location', '10:00 AM · ALU Kigali'],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-ftm-mut">{label}:</span>
                          <span className="font-medium text-ftm-ink">{val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span className="text-ftm-mut">Laptop:</span>
                        <Badge variant={formData.hasLaptop ? 'success' : 'default'} size="sm">
                          {formData.hasLaptop ? 'Bringing Own' : 'Using Provided'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <FormField>
                    <label className="flex items-start">
                      <input type="checkbox" required className="h-4 w-4 accent-[#E0273F] mt-1" checked={formData.confirmedAttendance} onChange={(e) => updateFormData('confirmedAttendance', e.target.checked)} />
                      <span className="ml-3 text-sm text-ftm-slate">
                        I confirm I will attend the test in person on the selected date and understand that missing the test may require rescheduling.
                      </span>
                    </label>
                  </FormField>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex justify-between pt-6 border-t border-white/[.07]">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`font-inter font-medium text-sm text-ftm-slate hover:text-ftm-ink px-4 py-2 rounded-md hover:bg-white/5 transition-colors ${step === 1 ? 'invisible' : ''}`}
                >
                  Previous
                </button>
                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  disabled={
                    (step === 1 && (!formData.name || !formData.email || !validateEmail(formData.email))) ||
                    (step === 2 && formData.hasLaptop === null) ||
                    (step === 3 && !formData.selectedDate) ||
                    (step === 4 && !formData.confirmedAttendance)
                  }
                >
                  {step === 4 ? 'Confirm Booking' : 'Next'}
                </LoadingButton>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
