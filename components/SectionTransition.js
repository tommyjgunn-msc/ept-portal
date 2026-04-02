// components/SectionTransition.js — Encouraging interstitial between test sections
import { useState, useEffect } from 'react';
import { Button } from './UIDesignSystem';

const MESSAGES = {
  reading: {
    complete: 'Reading section complete!',
    encouragement: 'Great work. Take a moment to breathe before your next section.',
  },
  writing: {
    complete: 'Writing section complete!',
    encouragement: 'Your essay has been submitted. One more section to go.',
  },
  listening: {
    complete: 'All tests complete!',
    encouragement: 'Congratulations — you\'ve finished all three sections.',
  },
};

const NEXT_LABELS = {
  reading: 'Continue to Writing',
  writing: 'Continue to Listening',
  listening: 'View Results',
};

export default function SectionTransition({ completedSection, onContinue, isLastSection }) {
  const [showButton, setShowButton] = useState(false);
  const msg = MESSAGES[completedSection];

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">{msg.complete}</h2>
        <p className="text-gray-600 text-lg mb-8">{msg.encouragement}</p>

        {!isLastSection && (
          <p className="text-sm text-gray-500 mb-4">
            Please wait for the instructor before proceeding.
          </p>
        )}

        <div className={`transition-all duration-700 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button onClick={onContinue} variant="primary" size="lg" className="w-full">
            {isLastSection ? 'View Results' : NEXT_LABELS[completedSection]}
          </Button>
        </div>
      </div>
    </div>
  );
}
