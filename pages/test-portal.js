// pages/test-portal.js
import dynamic from 'next/dynamic';

// Disable SSR for the entire test portal page.
//
// The loading state is now the shape of the exam screen rather than a spinner
// in the middle of an empty page, so nothing jumps when the section lands. The
// copy also dropped "secure test environment" — it read as a warning to a
// candidate who had not done anything wrong.
const TestPortalComponent = dynamic(() => import('../components/TestPortalComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-ftm-night">
      <div className="bg-ftm-bar border-b border-ftm-line2">
        <div className="max-w-shell mx-auto px-6 sm:px-10">
          <div className="flex items-center justify-between gap-6 h-bar">
            <div className="ftm-skeleton h-5 w-32" />
            <div className="ftm-skeleton h-5 w-28" />
          </div>
        </div>
      </div>
      <div className="max-w-shell mx-auto px-6 sm:px-10 py-12" aria-busy="true">
        <p className="font-inter text-[15px] text-ftm-mut mb-10">
          Opening your test. Do not refresh.
        </p>
        <div className="ftm-skeleton h-6 w-72 mb-8" />
        <div className="space-y-3 max-w-measure">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`ftm-skeleton h-4 ${i === 4 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  )
});

export default function TestPortal() {
  return <TestPortalComponent />;
}
