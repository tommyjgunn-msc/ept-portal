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
    isRefugee: null,
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
  const [refugeeDates, setRefugeeDates] = useState([]);
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
          const { regularDates, refugeeDates } = await response.json();
          setRegularDates(regularDates);
          setRefugeeDates(refugeeDates);
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
    return hasLaptop
      ? dateConfig.capacity.withLaptop - booked.withLaptop
      : dateConfig.capacity.withoutLaptop - booked.withoutLaptop;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      addToast({
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.'
      });
      return;
    }
  
    if (step < 5) {
      setStep(step + 1);
      addToast({
        type: 'success',
        title: 'Step Completed',
        message: `Moving to step ${step + 1} of 5`
      });
      return;
    }

    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData) {
      setError('Session expired. Please login again.');
      router.push('/login');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      const submissionData = {
        ...formData,
        eptId: userData.eptId,
      };
      
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }
  
      setSuccess(true);
      sessionStorage.setItem('bookingDetails', JSON.stringify({
        ...formData,
        eptId: userData.eptId,
        bookingDate: new Date().toISOString()
      }));

      addToast({
        type: 'success',
        title: 'Registration Complete!',
        message: `Your test is scheduled for ${formData.selectedDate}`
      });
      
      router.push('/home');
  
    } catch (error) {
      console.error('Booking error:', error);
      setError(error.message || 'Failed to create booking');
      
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: error.message || 'Please try again or contact support.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDateVisible = (dateStr) => {
    const testDate = new Date(dateStr.split(',')[1]);
    const now = new Date();
    const threeWeeksFromNow = new Date();
    threeWeeksFromNow.setDate(now.getDate() + 21);
    
    return testDate <= threeWeeksFromNow;
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const stepTitles = [
    'Personal Information',
    'Status Information', 
    'Equipment Preference',
    'Select Test Date',
    'Confirm Registration'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            EPT Registration
          </h1>
          <p className="text-gray-600">
            Complete your registration for the English Proficiency Test
          </p>
        </div>

        <Card className="p-8" elevation="lg">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Step {step}: {stepTitles[step - 1]}
              </h2>
              <Badge variant="primary">{step} of 5</Badge>
            </div>
            
            <ProgressBar
              value={step}
              max={5}
              variant="primary"
              showLabel
              className="mb-4"
            />

            <div className="flex justify-between text-xs text-gray-500">
              {stepTitles.map((title, index) => (
                <div
                  key={index}
                  className={`flex-1 text-center ${
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

            {/* Step 2: Refugee Status */}
            {step === 2 && (
              <div className="space-y-6">
                <FormField
                  label="Are you a refugee or asylum seeker?"
                  required
                  helpText="This helps us provide appropriate support and may affect available test dates"
                >
                  <div className="space-y-3">
                    {[
                      { value: true, label: 'Yes, I am a refugee or asylum seeker' },
                      { value: false, label: 'No, I am not a refugee or asylum seeker' }
                    ].map((option) => (
                      <label key={option.value.toString()} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="isRefugee"
                          value={option.value}
                          checked={formData.isRefugee === option.value}
                          onChange={(e) => updateFormData('isRefugee', e.target.value === 'true')}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          required
                        />
                        <span className="ml-3 text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            )}

            {/* Step 3: Laptop Question */}
            {step === 3 && (
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

            {/* Step 4: Date Selection */}
            {step === 4 && (
              <div className="space-y-6">
                <FormField
                  label="Select Test Date"
                  required
                  helpText="Choose from available dates within the next three weeks"
                >
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {(formData.isRefugee ? refugeeDates : regularDates)
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
                                <span className={`font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {dateObj.date}
                                </span>
                                <p className="text-sm text-gray-500">10:00 AM - 1:00 PM</p>
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

            {/* Step 5: Confirmation */}
            {step === 5 && (
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
                    {formData.isRefugee && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="info" size="sm">Refugee Applicant</Badge>
                      </div>
                    )}
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
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  variant="secondary"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  }
                >
                  Back
                </Button>
              )}
              
              <div className="ml-auto">
                {step === 5 ? (
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading}
                    loadingText="Submitting Registration..."
                    variant="primary"
                    size="lg"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    iconPosition="right"
                  >
                    Complete Registration
                  </LoadingButton>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    icon={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    }
                    iconPosition="right"
                  >
                    Continue
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
