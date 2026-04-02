// components/PreTestInstructions.js — Instructions screen before each test section
import { useState, useEffect } from 'react';
import { Button } from './UIDesignSystem';

const TEST_INFO = {
  reading: {
    title: 'Reading Comprehension',
    description: 'You will read passages and answer questions based on the content.',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    tips: [
      'Read each passage carefully before answering questions',
      'You can navigate between questions within this section',
      'Pay attention to specific details and main ideas',
      'Manage your time — don\'t spend too long on a single question',
    ],
    color: 'indigo',
  },
  writing: {
    title: 'Writing',
    description: 'You will write essays in response to given prompts.',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    tips: [
      'Read the prompt carefully and plan before you start writing',
      'Structure your essay with a clear introduction, body, and conclusion',
      'Pay attention to the word limit shown for each prompt',
      'Your writing auto-saves — look for the "Saved" indicator',
      'You can choose between different fonts for comfortable writing',
    ],
    color: 'emerald',
  },
  listening: {
    title: 'Listening Comprehension',
    description: 'You will listen to audio passages and answer questions.',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    ),
    tips: [
      'Ensure your audio is working before starting',
      'Listen carefully — some details are only mentioned once',
      'You can navigate between questions within this section',
      'Focus on understanding the main ideas and key details',
    ],
    color: 'amber',
  },
};

const COLORS = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
};

export default function PreTestInstructions({ testType, timeLimit, onBegin, sectionNumber, totalSections }) {
  const [isReady, setIsReady] = useState(false);
  const info = TEST_INFO[testType];
  const colors = COLORS[info.color];

  // Delay the "Begin" button slightly so students actually read
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const minutes = Math.floor(timeLimit / (60 * 1000));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className={`${colors.bg} rounded-2xl border ${colors.border} p-8 shadow-sm`}>
          {/* Section badge */}
          <div className="flex items-center justify-between mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
              Section {sectionNumber} of {totalSections}
            </span>
            <span className="text-sm text-gray-500 font-medium">
              {minutes} minutes
            </span>
          </div>

          {/* Icon + Title */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${colors.bg} ${colors.icon} mb-4 border ${colors.border}`}>
              {info.icon}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{info.title}</h1>
            <p className="text-gray-600 text-lg">{info.description}</p>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-xl p-5 mb-6 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Tips</h3>
            <ul className="space-y-2.5">
              {info.tips.map((tip, i) => (
                <li key={i} className="flex items-start text-sm text-gray-600">
                  <svg className={`w-4 h-4 ${colors.icon} mt-0.5 mr-2.5 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Begin button */}
          <Button
            onClick={onBegin}
            variant="primary"
            size="lg"
            className={`w-full transition-all duration-500 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            disabled={!isReady}
          >
            {isReady ? 'Begin Section' : 'Reading instructions...'}
          </Button>

          {!isReady && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Button will appear in a moment...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
