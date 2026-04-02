// pages/booking.js — Enhanced booking flow with capacity display and error recovery
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isWithinThreeWeeks, isFutureDate } from '../utils/dateUtils';
import { Card, Button, FormField, Input, Alert, ProgressBar, Badge } from '../components/UIDesignSystem';
import { LoadingButton } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';

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

  const isDateVisible = (date) => isFutureDate(date) && isWithinThreeWeeks(date);

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
            .filter(d => isDateVisible(d.date) && d.date !== formData.selectedDate)
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-600">Redirecting to your confirmation...</p>
        </Card>
      </div>
    );
  }

  const steps = ['Personal Info', 'Laptop Setup', 'Select Date', 'Confirm'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Test</h1>
              <p className="text-gray-600">Complete your registration to schedule your English proficiency test</p>
            </div>

            {/* Step indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {steps.map((title, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step > index + 1 ? 'bg-green-500 text-white' :
                      step === index + 1 ? 'bg-indigo-600 text-white shadow-md' :
                      'bg-gray-200 text-gray-500'
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
                        step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                {steps.map((title, index) => (
                  <span key={index} className={`${
                    step === index + 1 ? 'text-indigo-600 font-semibold' :
                    step > index + 1 ? 'text-green-600' : 'text-gray-400'
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
                        { value: true, label: 'Yes, bringing mine', desc: 'I have my own laptop', icon: '💻' },
                        { value: false, label: 'No, need one', desc: 'Please provide a laptop', icon: '🏢' },
                      ].map((option) => (
                        <label
                          key={option.value.toString()}
                          className={`flex flex-col items-center p-5 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.hasLaptop === option.value
                              ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input type="radio" name="hasLaptop" value={option.value} checked={formData.hasLaptop === option.value} onChange={() => updateFormData('hasLaptop', option.value)} className="sr-only" required />
                          <span className="text-3xl mb-2">{option.icon}</span>
                          <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{option.desc}</span>
                        </label>
                      ))}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <FormField label="Select Test Date" required helpText="Choose from available dates within the next three weeks">
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {regularDates
                        .filter(dateObj => isDateVisible(dateObj.date))
                        .map((dateObj) => {
                          const spots = getAvailableSpots(dateObj.date, formData.hasLaptop);
                          const totalRemaining = getTotalRemaining(dateObj.date);
                          const isAvailable = spots > 0;
                          const fillPct = Math.min(100, ((100 - totalRemaining) / 100) * 100);

                          return (
                            <label
                              key={dateObj.date}
                              className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                !isAvailable ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' :
                                formData.selectedDate === dateObj.date ? 'border-indigo-500 bg-indigo-50 shadow-sm' :
                                'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <input type="radio" name="selectedDate" value={dateObj.date} checked={formData.selectedDate === dateObj.date} onChange={() => updateFormData('selectedDate', dateObj.date)} disabled={!isAvailable} className="h-4 w-4 text-indigo-600 border-gray-300" required />
                                  <div className="ml-3">
                                    <div className={`font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>{dateObj.date}</div>
                                    <div className="text-xs text-gray-500">{dateObj.venues} venues</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant={isAvailable ? (spots < 10 ? 'warning' : 'success') : 'default'} size="sm">
                                    {isAvailable ? `${spots} spots` : 'Full'}
                                  </Badge>
                                </div>
                              </div>
                              {/* Fill indicator */}
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`h-1 rounded-full transition-all ${
                                    fillPct > 80 ? 'bg-red-400' : fillPct > 50 ? 'bg-amber-400' : 'bg-green-400'
                                  }`}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-6">
                  <Alert type="info" title="Please Review Your Information">
                    Confirm all details are correct before submitting.
                  </Alert>
                  <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                    <h3 className="font-semibold text-gray-900">Registration Summary</h3>
                    <div className="grid gap-3 text-sm">
                      {[
                        ['Name', formData.name],
                        ['Email', formData.email],
                        ['Test Date', formData.selectedDate],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-gray-600">{label}:</span>
                          <span className="font-medium">{val}</span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Laptop:</span>
                        <Badge variant={formData.hasLaptop ? 'success' : 'default'} size="sm">
                          {formData.hasLaptop ? 'Bringing Own' : 'Using Provided'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <FormField>
                    <label className="flex items-start">
                      <input type="checkbox" required className="h-4 w-4 text-indigo-600 border-gray-300 rounded mt-1" checked={formData.confirmedAttendance} onChange={(e) => updateFormData('confirmedAttendance', e.target.checked)} />
                      <span className="ml-3 text-sm text-gray-900">
                        I confirm I will attend the test in person on the selected date and understand that missing the test may require rescheduling.
                      </span>
                    </label>
                  </FormField>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={prevStep} disabled={step === 1} className={step === 1 ? 'invisible' : ''}>
                  Previous
                </Button>
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
                  {step === 4 ? 'Complete Registration' : 'Next'}
                </LoadingButton>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
