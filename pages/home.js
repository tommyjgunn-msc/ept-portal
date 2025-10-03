// pages/home.js - Updated to remove refugee status display
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Alert, Badge } from '../components/UIDesignSystem';
import { LoadingButton } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [hasCompletedTests, setHasCompletedTests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const storedUserData = sessionStorage.getItem('userData');
    if (!storedUserData) {
      router.push('/login');
      return;
    }

    const parsedUserData = JSON.parse(storedUserData);
    setUserData(parsedUserData);
    checkRegistration(parsedUserData.eptId);
  }, [router]);

  const checkRegistration = async (eptId) => {
    setIsCheckingRegistration(true);
    try {
      const response = await fetch('/api/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eptId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasRegistration) {
          setBookingDetails(data.registration);
        }
        setHasCompletedTests(data.hasCompletedTests);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      addToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to check registration status. Please refresh the page.'
      });
    } finally {
      setIsLoading(false);
      setIsCheckingRegistration(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome, {userData.name}!
            </h1>
            <p className="text-xl text-gray-600">
              Your English Proficiency Test Dashboard
            </p>
          </div>

          {/* Status Alert */}
          {!bookingDetails && !hasCompletedTests && (
            <Alert type="info" title="Complete Your Registration" className="mb-8">
              Please book your test date to proceed with your English proficiency assessment.
            </Alert>
          )}

          {bookingDetails && !hasCompletedTests && (
            <Alert type="success" title="Registration Complete" className="mb-8">
              Your test is scheduled for {bookingDetails.selectedDate}. Please arrive on time.
            </Alert>
          )}

          {hasCompletedTests && (
            <Alert type="success" title="Tests Completed" className="mb-8">
              You have completed all required tests. Results will be available soon.
            </Alert>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            {/* Main Action Card */}
            <Card className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {!bookingDetails ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Your Test</h2>
                    <p className="text-gray-600 mb-6">
                      Schedule your English proficiency test at a convenient time.
                    </p>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => router.push('/booking')}
                    >
                      Book Now
                    </Button>
                  </>
                ) : hasCompletedTests ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">View Results</h2>
                    <p className="text-gray-600 mb-6">
                      Check your test results and performance breakdown.
                    </p>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => router.push('/results')}
                    >
                      View Results
                    </Button>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Take Your Test</h2>
                    <p className="text-gray-600 mb-6">
                      You're registered! Start your English proficiency test when ready.
                    </p>
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => router.push('/test-portal')}
                    >
                      Start Test
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* Info & Support */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h3>
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full justify-start"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  onClick={() => addToast({
                    type: 'info',
                    title: 'Test Instructions',
                    message: 'Please review all test guidelines before starting.'
                  })}
                >
                  View Test Instructions
                </Button>
                
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full justify-start"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  onClick={() => window.open('mailto:thewritingcentre@alueducation.com')}
                >
                  Contact Support
                </Button>
              </div>
            </Card>

            {/* Your Details */}
            {bookingDetails && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{bookingDetails.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{bookingDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Test Date:</span>
                    <span className="font-medium">{bookingDetails.selectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Laptop:</span>
                    <Badge variant={bookingDetails.hasLaptop ? 'success' : 'secondary'} size="sm">
                      {bookingDetails.hasLaptop ? 'Bringing Own' : 'Using Provided'}
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
