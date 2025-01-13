// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [eptId, setEptId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Your existing handleSubmit function remains exactly the same
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
        router.push('/home');
      } else {
        router.push('/booking');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-600 px-4">
      <div className="max-w-md w-full">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">
            Welcome to ALU's English Proficiency Test
          </h2>
          <p className="text-xl text-indigo-200">
            Here you can register for the test and access test links on your test date. Enter your EPT ID to continue
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white shadow-lg rounded-lg p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="eptId" className="block text-xl font-medium text-gray-700 mb-2">
                EPT ID
              </label>
              <input
                id="eptId"
                name="eptId"
                type="text"
                required
                className="w-full p-3 text-lg border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                placeholder="Enter your EPT ID"
                value={eptId}
                onChange={(e) => setEptId(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}