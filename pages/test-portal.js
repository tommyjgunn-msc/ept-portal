// pages/test-portal.js 
import dynamic from 'next/dynamic';

// Disable SSR for the entire test portal page
const TestPortalComponent = dynamic(() => import('../components/TestPortalComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-ftm-night flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-ftm-red mx-auto"></div>
        <p className="mt-4 text-xl text-ftm-mut">Loading secure test environment...</p>
      </div>
    </div>
  )
});

export default function TestPortal() {
  return <TestPortalComponent />;
}
