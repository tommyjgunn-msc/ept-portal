// pages/home.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Badge, Alert } from '../components/UIDesignSystem';
import { ProgressiveLoader } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';

export default function Home() {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    const details = sessionStorage.getItem('bookingDetails');
    if (!details) {
      router.push('/login');
      return;
    }
    setBookingDetails(JSON.parse(details));
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <ProgressiveLoader 
        stages={['Loading your dashboard...', 'Preparing test information...', 'Almost ready...']}
        currentStage={1}
        className="min-h-screen"
      />
    );
  }

  const parseTestDate = (dateStr) => {
    const currentYear = new Date().getFullYear();
    const fullDateStr = dateStr.includes(',') 
      ? `${dateStr} ${currentYear}` 
      : `${dateStr}, ${currentYear}`;
    return new Date(fullDateStr);
  };

  const testDate = parseTestDate(bookingDetails.selectedDate);
  const today = new Date();
  
  const isToday = testDate.getDate() === today.getDate() &&
                  testDate.getMonth() === today.getMonth() &&
                  testDate.getFullYear() === today.getFullYear();
                  
  const nextDay = new Date(testDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);
  const testHasPassed = today >= nextDay;
  const currentTime = today.getHours();
  const isTestTime = currentTime >= 10;

  const handleTestAccess = () => {
    addToast({
      type: 'info',
      title: 'Entering Test Portal',
      message: 'You will be redirected to the secure test environment.'
    });
    router.push('/test-portal');
  };

  const getTestStatus = () => {
    if (testHasPassed) {
      return { type: 'completed', variant: 'info' };
    } else if (isToday && isTestTime) {
      return { type: 'ready', variant: 'success' };
    } else if (isToday) {
      return { type: 'today', variant: 'warning' };
    } else {
      return { type: 'scheduled', variant: 'info' };
    }
  };

  const status = getTestStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <Card hover className="p-6 mb-8 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome, {bookingDetails.name}!
              </h1>
              <p className="text-gray-600">
                Ready to take your English Proficiency Test
              </p>
            </div>
            
            <div className="text-right">
              <Badge variant="primary" size="lg" className="mb-2">
                Test Date
              </Badge>
              <p className="text-lg font-semibold text-gray-900">
                {bookingDetails.selectedDate}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Test Status Card */}
            <Card elevation="lg" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Test Status</h2>
                <Badge 
                  variant={status.variant}
                  icon={status.type === 'ready' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : null}
                >
                  {status.type === 'ready' ? 'Available Now' : 
                   status.type === 'today' ? 'Today' :
                   status.type === 'completed' ? 'Completed' : 'Scheduled'}
                </Badge>
              </div>

              {testHasPassed ? (
                <Alert type="warning" title="Test Period Complete">
                  Your test date has passed. If you completed the test successfully, 
                  please wait for your results. For any issues, contact{' '}
                  <a href="mailto:thewritingcentre@alueducation.com" className="underline">
                    thewritingcentre@alueducation.com
                  </a>
                </Alert>
              ) : isToday && isTestTime ? (
                <div className="space-y-4">
                  <Alert type="success" title="Your Test is Ready!">
                    You can now access your test. Make sure you have a stable internet 
                    connection and are in a quiet environment.
                  </Alert>
                  <Button
                    onClick={handleTestAccess}
                    variant="success"
                    size="lg"
                    className="w-full"
                    icon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    }
                  >
                    Access Test Portal
                  </Button>
                </div>
              ) : isToday ? (
                <Alert type="info" title="Test Day - Coming Soon">
                  Your test begins today at 10:00 AM. Please return at that time to 
                  access your test materials.
                </Alert>
              ) : (
                <Alert type="info" title="Test Scheduled">
                  Please return on your scheduled test date. The test portal will be 
                  available at 10:00 AM on {bookingDetails.selectedDate}.
                </Alert>
              )}
            </Card>

            {/* Test Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Test Components</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Reading Comprehension</li>
                    <li>• Writing Assessment</li>
                    <li>• Listening Comprehension</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Duration</h3>
                  <p className="text-sm text-gray-600">
                    Approximately 3 hours total
                    <br />
                    (1 hour per section)
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  variant="outline"
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
                    message: 'Please ensure you have a stable internet connection and are in a quiet environment.'
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
                  <span className="text-gray-600">Laptop:</span>
                  <Badge variant={bookingDetails.hasLaptop ? 'success' : 'secondary'} size="sm">
                    {bookingDetails.hasLaptop ? 'Bringing Own' : 'Using Provided'}
                  </Badge>
                </div>
                {bookingDetails.isRefugee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="info" size="sm">Refugee Applicant</Badge>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
