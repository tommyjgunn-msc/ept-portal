// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { FormField, Input, Alert, Card } from '../components/UIDesignSystem';
import { LoadingButton } from '../components/LoadingStates';
import { useToast } from '../components/ToastContext';

export default function Login() {
  const [eptId, setEptId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const authResponse = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eptId }),
      });
      const authData = await authResponse.json();
      
      if (!authResponse.ok) {
        throw new Error(authData.message || 'Authentication failed');
      }
      
      sessionStorage.setItem('userData', JSON.stringify(authData));
      
      addToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${authData.name}!`
      });
      
      const bookingResponse = await fetch('/api/check-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eptId }),
      });
      const bookingData = await bookingResponse.json();
      
      if (bookingData.hasRegistration) {
        sessionStorage.setItem('bookingDetails', JSON.stringify(bookingData.registration));
        if (bookingData.hasCompletedTests) {
          router.push('/test-complete');
        } else {
          router.push('/home');
        }
      } else {
        router.push('/booking');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to authenticate');
      
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: error.message || 'Please check your EPT ID and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 px-4">
      <div className="max-w-md w-full">
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome to ALU's English Proficiency Test
          </h2>
          <p className="text-xl text-indigo-100">
            Register for the test and access your test materials on your scheduled date.
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 backdrop-blur-sm bg-white/95" elevation="xl">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h3>
            <p className="text-gray-600">Enter your EPT ID to continue</p>
          </div>

          {error && (
            <Alert 
              type="error" 
              title="Authentication Error"
              dismissible
              onDismiss={() => setError('')}
              className="mb-6"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              label="EPT ID"
              required
              helpText="Enter your unique EPT identification number"
              error={error}
            >
              <Input
                type="text"
                placeholder="e.g., EPT12345"
                value={eptId}
                onChange={(e) => setEptId(e.target.value)}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                error={!!error}
              />
            </FormField>

            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText="Authenticating..."
              variant="primary"
              size="lg"
              className="w-full"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              }
              iconPosition="right"
            >
              Sign In
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:thewritingcentre@alueducation.com" className="text-indigo-600 hover:text-indigo-500">
                thewritingcentre@alueducation.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
