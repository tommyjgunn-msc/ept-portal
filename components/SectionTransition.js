// components/SectionTransition.js — the screen between sections.
//
// Was a green circle with a tick, an exclamation mark, and a button that faded
// up from below after two seconds. A candidate halfway through a proficiency
// exam does not need to be congratulated; they need to know what landed and
// what is next. The two-second hold stays — it stops an accidental double-click
// carrying someone into the next section before they have read anything.
import { useState, useEffect } from 'react';
import { Button } from './UIDesignSystem';

const COMPLETED = {
  reading: 'Reading submitted',
  writing: 'Writing submitted',
  listening: 'Listening submitted',
};

const NEXT = {
  reading: { label: 'Start the writing section', note: 'Writing is next: one essay, 45 minutes.' },
  writing: { label: 'Start the listening section', note: 'Listening is next: audio comprehension, 30 minutes.' },
  listening: { label: 'Finish', note: null },
};

export default function SectionTransition({ completedSection, onContinue, isLastSection }) {
  const [showButton, setShowButton] = useState(false);
  const next = NEXT[completedSection];

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-ftm-night flex items-center px-6 sm:px-10">
      <div className="w-full max-w-shell mx-auto">
        <div className="max-w-measure border-t-2 border-ftm-green pt-6">
          <p className="font-inter font-bold text-[11px] tracking-[.14em] uppercase text-ftm-green mb-3">
            Saved
          </p>
          <h1 className="font-grotesk font-bold text-[30px] text-ftm-ink mb-3">
            {isLastSection ? 'All three sections submitted' : COMPLETED[completedSection]}
          </h1>

          <p className="font-inter text-[17px] leading-relaxed text-ftm-mut mb-8">
            {isLastSection
              ? 'That is the whole exam. Your answers are stored and nothing more is needed from you today. The Writing Centre releases results once marking has been checked.'
              : `${next.note} Wait for the invigilator before you continue.`}
          </p>

          <Button onClick={onContinue} variant="primary" size="lg" disabled={!showButton}>
            {isLastSection ? 'Finish' : next.label}
          </Button>
        </div>
      </div>
    </div>
  );
}
