// pages/booking.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isWithinThreeWeeks } from '../utils/dateUtils';

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
      }
    }
    fetchTestDates();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
  
    if (step < 5) {
      setStep(step + 1);
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
      
      router.push('/home');
  
    } catch (error) {
      console.error('Booking error:', error);
      setError(error.message || 'Failed to create booking');
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">EPT Registration</h2>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= num ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Humanitarian Status */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Are you a refugee?</h3>
              <div role="radiogroup" aria-labelledby="refugee-question">
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-indigo-500">
                    <input
                      type="radio"
                      name="isRefugee"
                      value="true"
                      checked={formData.isRefugee === true}
                      onChange={() => updateFormData('isRefugee', true)}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">Yes, I am a refugee</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-indigo-500">
                    <input
                      type="radio"
                      name="isRefugee"
                      value="false"
                      checked={formData.isRefugee === false}
                      onChange={() => updateFormData('isRefugee', false)}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">No, I am not a refugee</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Laptop Availability (only for non-refugees) */}
          {step === 3 && !formData.isRefugee && (
            <div>
              <h3 className="text-lg font-medium mb-4">Do you have access to a laptop?</h3>
              <div role="radiogroup" aria-labelledby="laptop-question">
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-indigo-500">
                    <input
                      type="radio"
                      name="hasLaptop"
                      value="true"
                      checked={formData.hasLaptop === true}
                      onChange={() => updateFormData('hasLaptop', true)}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">Yes, I have a laptop</span>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:border-indigo-500">
                    <input
                      type="radio"
                      name="hasLaptop"
                      value="false"
                      checked={formData.hasLaptop === false}
                      onChange={() => updateFormData('hasLaptop', false)}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="ml-2">No, I need a computer lab</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Date Selection */}
          {step === 4 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Select Your Test Date</h3>
              <select
                value={formData.selectedDate}
                onChange={(e) => updateFormData('selectedDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a date</option>
                {formData.isRefugee
                  ? refugeeDates
                      .filter(date => isFutureDate(date.date)) // Add this filter
                      .map((date) => (
                        <option key={date.date} value={date.date}>
                          {date.date} - {date.location}
                        </option>
                      ))
                  : regularDates
                      .filter(date => isFutureDate(date.date) && isWithinThreeWeeks(date.date)) // Filter future dates first
                      .sort((a, b) => {
                        const dateA = new Date(parseTestDate(a.date));
                        const dateB = new Date(parseTestDate(b.date));
                        return dateA - dateB;
                      })
                      .slice(0, 3)
                      .map(date => {
                        const availableSpots = getAvailableSpots(date.date, formData.hasLaptop);
                        if (availableSpots <= 0) return null;

                        return (
                          <option key={date.date} value={date.date}>
                            {date.date} - {availableSpots} spots available
                          </option>
                        );
                      })
                      .filter(Boolean) 
                  }
              </select>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-2">Please review your information:</h3>
                <p>Name: {formData.name}</p>
                <p>Email: {formData.email}</p>
                <p>Status: {formData.isRefugee ? 'Refugee' : 'Non-refugee'}</p>
                {!formData.isRefugee && (
                  <p>Laptop: {formData.hasLaptop ? 'Yes' : 'No'}</p>
                )}
                <p>Selected Date: {formData.selectedDate}</p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Booking successful! Redirecting to test portal...
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="confirm"
                  required
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={formData.confirmedAttendance}
                  onChange={(e) => updateFormData('confirmedAttendance', e.target.checked)}
                />
                <label htmlFor="confirm" className="ml-2 block text-sm text-gray-900">
                  I confirm that I will attend the test in person on the selected date
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 ml-auto ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}   
            >
              {isLoading ? 'Processing...' : step === 5 ? 'Submit' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}