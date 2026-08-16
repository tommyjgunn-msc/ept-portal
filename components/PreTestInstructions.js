// components/PreTestInstructions.js — the screen before each section.
//
// The exam-anxiety research names being able to familiarise yourself with the
// platform beforehand as one of only two things that reduce stress. So this
// screen is now built from the same parts as the live exam screen: the same
// status band in the same place, the same type sizes, the same measure. Reading
// it is a rehearsal for the section rather than a description of one.
//
// Also removed: a circular icon medallion, a pill badge, tick-marked bullets,
// and a button that faded up from below. (The COLORS map had `emerald` defined
// twice, so the first definition was dead — the whole map has gone with it.)
import { useState, useEffect } from 'react';
import { Button } from './UIDesignSystem';

const TEST_INFO = {
  reading: {
    title: 'Reading',
    description: 'You read passages and answer questions about them.',
    tips: [
      'Read the whole passage before you answer anything.',
      'You can move between questions freely within this section.',
      'Watch for specific details as well as the main idea.',
      'Do not spend too long on any one question.',
    ],
  },
  writing: {
    title: 'Writing',
    description: 'You write one essay in response to the prompt you are given.',
    tips: [
      'Read the prompt twice and plan before you start.',
      'Give the essay an opening, a middle and a close.',
      'Keep to the word limit shown above the box.',
      'Your work saves as you type. The word "Saved" appears under the box.',
      'Copy and paste are switched off for this section.',
    ],
  },
  listening: {
    title: 'Listening',
    description: 'You listen to audio passages and answer questions about them.',
    tips: [
      'Check your audio before you begin.',
      'Some details are said only once.',
      'You can move between questions freely within this section.',
      'Focus on the main idea as well as the details.',
    ],
  },
};

export default function PreTestInstructions({ testType, timeLimit, onBegin, sectionNumber, totalSections }) {
  const [isReady, setIsReady] = useState(false);
  const info = TEST_INFO[testType];

  // Hold the button back briefly so the instructions actually get read.
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const minutes = Math.floor(timeLimit / (60 * 1000));

  return (
    <div className="min-h-screen bg-ftm-night">
      {/* The same band, in the same place, as the live exam screen */}
      <header className="bg-ftm-bar border-b border-ftm-line2">
        <div className="max-w-shell mx-auto px-6 sm:px-10">
          <div className="flex items-center justify-between gap-6 h-bar">
            <div className="flex items-baseline gap-4">
              <h1 className="font-grotesk font-bold text-[19px] text-ftm-ink">{info.title}</h1>
              <p className="font-inter text-[13px] text-ftm-mut">
                Section <span className="tabular-nums">{sectionNumber}</span> of{' '}
                <span className="tabular-nums">{totalSections}</span>
              </p>
            </div>
            <div className="flex items-baseline gap-3 border-l-[6px] border-ftm-line2 pl-3 py-0.5">
              <span className="font-inter font-bold text-[10px] tracking-[.14em] uppercase text-ftm-dim">
                You will have
              </span>
              <span className="font-grotesk font-bold text-[19px] text-ftm-ink tabular-nums">
                {minutes} min
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-0.5" role="presentation">
          {Array.from({ length: totalSections }).map((_, i) => (
            <div key={i} className={`h-1 flex-1 ${i < sectionNumber ? 'bg-ftm-crimson' : 'bg-ftm-up'}`} />
          ))}
        </div>
      </header>

      <main className="max-w-shell mx-auto px-6 sm:px-10 py-12">
        <div className="max-w-measure">
          <p className="font-inter text-[19px] leading-relaxed text-ftm-ink mb-10">
            {info.description}
          </p>

          <h2 className="font-inter font-bold text-[11px] tracking-[.14em] uppercase text-ftm-dim mb-1">
            Before you begin
          </h2>
          <ul className="list-none p-0 m-0 border-t border-ftm-line2 mb-10">
            {info.tips.map((tip) => (
              <li key={tip} className="font-inter text-[16px] leading-relaxed text-ftm-mut py-3 border-b border-ftm-line">
                {tip}
              </li>
            ))}
          </ul>

          <div className="border-l-[6px] border-ftm-ochre pl-4 py-1 mb-10">
            <p className="font-inter text-[15px] leading-relaxed text-ftm-mut">
              The section starts the moment you press begin, and the clock does not stop.
              Leaving fullscreen or switching tabs is recorded; three of either submits the
              section for you.
            </p>
          </div>

          <Button onClick={onBegin} variant="primary" size="lg" disabled={!isReady}>
            {isReady ? `Begin the ${info.title.toLowerCase()} section` : 'Read the instructions first'}
          </Button>
        </div>
      </main>
    </div>
  );
}
