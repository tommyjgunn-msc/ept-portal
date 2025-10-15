// pages/booking.js - REPLACE EXISTING FILE
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isWithinThreeWeeks } from '../utils/dateUtils';
import { isFutureDate } from '../utils/dateUtils';
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
    confirmedAttendance: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const [availableSpots, setAvailableSpots] = useState({});
  const [dateCapacity, setDateCapacity] = useState({});
  const [regularDates, setRegularDates] = useState([]); 
  const { addToast } = useToast();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const parseTestDate = (dateStr) => {
    const currentYear = new Date().getFullYear();
    const [dayOfWeek, restOfDate] = dateStr.split(', ');
    const [day, month] = restOfDate.split(' ');
    return `${month} ${day}, ${currentYear}`;
  };

  useEffect(() => {
    async function fetchTestDates() {
      try {
        const response = await fetch('/api/test-dates');
        if (response.ok) {
          const { regularDates } = await response.json();
          setRegularDates(regularDates);
        }
      } catch (error) {
        console.error('Error fetching test dates:', error);
        addToast({
          type: 'error',
          title: 'Loading Error',
          message: 'Failed to load test dates. Please refresh the page.'
        });
      }
    }
    fetchTestDates();
  }, [addToast]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/bookings/count');
        if (response.ok) {
          const data = await response.json();
          setDateCapacity(data);
          setAvailableSpots(data);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    }
    fetchData();
  }, []);

  const getAvailableSpots = (date, hasLaptop) => {
  const dateConfig = regularDates.find(d => d.date === date);
  if (!dateConfig) return 0;

  const booked = dateCapacity[date] || { withLaptop: 0, withoutLaptop: 0 };
  const totalBooked = booked.withLaptop + booked.withoutLaptop;
  
  // If total capacity reached, no spots available
  if (totalBooked >= 100) return 0;
  
  // Check category-specific limits
  const categorySpots = hasLaptop
    ? dateConfig.capacity.withLaptop - booked.withLaptop
    : dateConfig.capacity.withoutLaptop - booked.withoutLaptop;
  
  // Return the smaller of: remaining total capacity OR category capacity
  const remainingTotal = 100 - totalBooked;
  return Math.max(0, Math.min(categorySpots, remainingTotal));
};

  const isDateVisible = (date) => {
  return isFutureDate(date) && isWithinThreeWeeks(date);
};

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step < 4) {
      nextStep();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      
      if (!userData.eptId) {
        setError('EPT ID not found. Please go back to login.');
        setIsLoading(false);
        return;
      }

      const bookingData = {
        ...formData,
        eptId: userData.eptId
      };

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create booking');
      }

      setSuccess(true);
      addToast({
        type: 'success',
        title: 'Registration Successful!',
        message: 'Your test registration has been confirmed.'
      });

      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Booking error:', error);
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
          <p className="text-gray-600 mb-6">
            Your test has been successfully scheduled. You'll receive a confirmation email shortly.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const steps = [
    'Personal Info',
    'Laptop Setup', 
    'Select Date',
    'Confirm'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Test</h1>
              <p className="text-gray-600">Complete your registration to schedule your English proficiency test</p>
            </div>

            <div className="mb-8">
              <ProgressBar current={step} total={4} className="mb-4" />
              <div className="flex justify-between text-sm">
                {steps.map((title, index) => (
                  <div 
                    key={index}
                    className={`${
                      step > index + 1 ? 'text-green-600' : step === index + 1 ? 'text-indigo-600 font-medium' : ''
                    }`}
                  >
                    {title}
                  </div>
                ))}
              </div>
            </div>
          
            {error && (
              <Alert 
                type="error" 
                title="Registration Error"
                dismissible
                onDismiss={() => setError('')}
                className="mb-6"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    label="Full Name"
                    required
                    helpText="Enter your full name as it appears on your ID"
                  >
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      required
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      }
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
                      icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      }
                    />
                  </FormField>
                </div>
              )}

              {/* Step 2: Laptop Question */}
              {step === 2 && (
                <div className="space-y-6">
                  <FormField
                    label="Will you bring your own laptop?"
                    required
                    helpText="We can provide a laptop if you don't have one, but bringing your own is preferred"
                  >
                    <div className="space-y-3">
                      {[
                        { value: true, label: 'Yes, I will bring my own laptop', icon: '💻' },
                        { value: false, label: 'No, please provide a laptop for me', icon: '🏢' }
                      ].map((option) => (
                        <label key={option.value.toString()} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="hasLaptop"
                            value={option.value}
                            checked={formData.hasLaptop === option.value}
                            onChange={(e) => updateFormData('hasLaptop', e.target.value === 'true')}
                            className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            required
                          />
                          <span className="ml-3 text-2xl">{option.icon}</span>
                          <span className="ml-3 text-gray-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Step 3: Date Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  <FormField
                    label="Select Test Date"
                    required
                    helpText="Choose from available dates within the next three weeks"
                  >
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {regularDates
                        .filter(dateObj => isDateVisible(dateObj.date))
                        .map((dateObj) => {
                          const availableSpots = getAvailableSpots(dateObj.date, formData.hasLaptop);
                          const isAvailable = availableSpots > 0;
                          
                          return (
                            <label 
                              key={dateObj.date} 
                              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                                isAvailable 
                                  ? 'border-gray-200 hover:bg-gray-50' 
                                  : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                              } ${
                                formData.selectedDate === dateObj.date ? 'border-indigo-500 bg-indigo-50' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <input
                                  type="radio"
                                  name="selectedDate"
                                  value={dateObj.date}
                                  checked={formData.selectedDate === dateObj.date}
                                  onChange={(e) => updateFormData('selectedDate', e.target.value)}
                                  disabled={!isAvailable}
                                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                  required
                                />
                                <div className="ml-3">
                                  <div className={`font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {dateObj.date}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {dateObj.venues} venues available
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant={isAvailable ? 'success' : 'secondary'} 
                                  size="sm"
                                >
                                  {isAvailable ? `${availableSpots} spots left` : 'Full'}
                                </Badge>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <div className="space-y-6">
                  <Alert type="info" title="Please Review Your Information">
                    Confirm all details are correct before submitting your registration.
                  </Alert>

                  <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-900">Registration Summary</h3>
                    
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{formData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Test Date:</span>
                        <span className="font-medium">{formData.selectedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Laptop:</span>
                        <Badge variant={formData.hasLaptop ? 'success' : 'secondary'} size="sm">
                          {formData.hasLaptop ? 'Bringing Own' : 'Using Provided'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <FormField>
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        required
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded mt-1"
                        checked={formData.confirmedAttendance}
                        onChange={(e) => updateFormData('confirmedAttendance', e.target.checked)}
                      />
                      <span className="ml-3 text-sm text-gray-900">
                        I confirm that I will attend the test in person on the selected date and understand 
                        that missing the test may require rescheduling.
                      </span>
                    </label>
                  </FormField>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={step === 1}
                  className={step === 1 ? 'invisible' : ''}
                >
                  Previous
                </Button>

                <LoadingButton
                  type="submit"
                  loading={isLoading}
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
