// pages/registration-complete.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, Button, Badge, Alert } from '../components/UIDesignSystem';
import { AppSkeleton } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';

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
        title: 'Session Expired',
        message: 'Please log in again to view your registration.'
      });
      router.push('/login');
      return;
    }
    setBookingDetails(JSON.parse(details));
    setLoading(false);
  }, [router, addToast]);

  const handleReturnHome = () => {
    addToast({
      type: 'success',
      title: 'Redirecting',
      message: 'Taking you to your dashboard...'
    });
    router.push('/');
  };

  const handleContactSupport = () => {
    window.open('mailto:thewritingcentre@alueducation.com?subject=EPT Registration Support');
    addToast({
      type: 'info',
      title: 'Opening Email',
      message: 'Your email client should open with our support address.'
    });
  };

  if (loading) {
    return <AppSkeleton />;
  }

  return (
    <div className="min-h-screen bg-ftm-night py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Animation Container */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* Animated Success Icon */}
            <div className="w-20 h-20 bg-ftm-green/[.14] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-16 h-16 bg-ftm-green rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            {/* Celebration rings */}
            <div className="absolute inset-0 animate-ping">
              <div className="w-20 h-20 border-4 border-ftm-green/30 rounded-full"></div>
            </div>
          </div>

          <h1 className="font-grotesk text-4xl font-bold text-ftm-ink mb-4">
            Registration complete
          </h1>
          <p className="text-xl text-ftm-mut">
            Thank you for registering for Futurimi, ALU&rsquo;s English Proficiency Test
          </p>
        </div>

        {/* Main Registration Card */}
        <Card className="p-8 mb-6" elevation="xl">
          <div className="text-center mb-8">
            <h2 className="font-grotesk text-2xl font-semibold text-ftm-ink mb-4">
              Your Test is Scheduled
            </h2>
            
            <div className="bg-ftm-up border border-white/[.07] rounded-[10px] p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-ftm-slate mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                <p className="text-lg text-ftm-slate">Test Date & Time</p>
              </div>
              
              <div className="text-center">
                <p className="font-grotesk text-3xl font-bold text-ftm-ink mb-2">
                  {bookingDetails.selectedDate}
                </p>
                <Badge variant="primary" size="lg">
                  10:00 AM - 1:00 PM
                </Badge>
              </div>
            </div>

            <Alert type="info" title="Important Reminders">
              <ul className="text-left space-y-2 mt-2">
                <li>• Please arrive 15 minutes before your test time</li>
                <li>• Bring a valid ID and your confirmation details</li>
                <li>• {bookingDetails.hasLaptop ? 'Remember to bring your laptop' : 'A laptop will be provided for you'}</li>
                <li>• The test portal will be available on your test date at 10:00 AM</li>
              </ul>
            </Alert>
          </div>

          {/* Registration Details */}
          <div className="bg-ftm-night border border-white/[.08] rounded-lg p-6 mb-6">
            <h3 className="font-grotesk text-lg font-semibold text-ftm-ink mb-4">Registration Details</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-ftm-mut">Name</p>
                <p className="font-medium text-ftm-ink">{bookingDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-ftm-mut">Email</p>
                <p className="font-medium text-ftm-ink">{bookingDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-ftm-mut">Equipment</p>
                <Badge variant={bookingDetails.hasLaptop ? 'success' : 'secondary'}>
                  {bookingDetails.hasLaptop ? 'Bringing Own Laptop' : 'Using Provided Laptop'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-ftm-mut">Registration Date</p>
                <p className="font-medium text-ftm-ink">
                  {new Date(bookingDetails.bookingDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleReturnHome}
              variant="primary"
              size="lg"
              className="w-full"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
            >
              Go to Dashboard
            </Button>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={handleContactSupport}
                variant="outline"
                className="w-full"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              >
                Contact Support
              </Button>
              
              <Button
                onClick={() => window.print()}
                variant="ghost"
                className="w-full"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                }
              >
                Print Details
              </Button>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <h3 className="font-grotesk text-lg font-semibold text-ftm-ink mb-4">What happens next?</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-ftm-slate/[.14] rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-ftm-slate">1</span>
              </div>
              <div>
                <h4 className="font-medium text-ftm-ink">Confirmation Email</h4>
                <p className="text-sm text-ftm-mut">You'll receive a confirmation email with all the details shortly.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-ftm-slate/[.14] rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-ftm-slate">2</span>
              </div>
              <div>
                <h4 className="font-medium text-ftm-ink">Test Day Access</h4>
                <p className="text-sm text-ftm-mut">Return to this portal on your test date to access the test materials.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-ftm-slate/[.14] rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-semibold text-ftm-slate">3</span>
              </div>
              <div>
                <h4 className="font-medium text-ftm-ink">Results</h4>
                <p className="text-sm text-ftm-mut">Your results will be available here after the test is completed and reviewed.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
