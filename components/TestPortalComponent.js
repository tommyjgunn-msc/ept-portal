// components/TestPortalComponent.js — Main test-taking engine with enhanced UX
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';
import { useProctoring } from '@/context/ProctoringContext';
import ProctoringWrapper from './ProctoringWrapper';
import { TestLoadingState } from './LoadingStates';
import { ProgressBar, Badge, Button, Modal } from './UIDesignSystem';
import EnhancedWritingArea from './EnhancedWritingArea';
import PreTestInstructions from './PreTestInstructions';
import SectionTransition from './SectionTransition';
import SubmissionConfirmation from './SubmissionConfirmation';

const TEST_SEQUENCE = ['reading', 'writing', 'listening'];
const TEST_TIME = {
  reading: 60 * 60 * 1000,
  writing: 60 * 60 * 1000,
  listening: 60 * 60 * 1000,
};

// Debounced storage helper
const useOptimizedStorage = () => {
  const saveTimeoutRef = useRef(null);
  const responsesTimeoutRef = useRef(null);

  const debouncedSaveTime = useCallback((testType, time) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try { sessionStorage.setItem(`test_time_${testType}`, time.toString()); } catch {}
    }, 5000);
  }, []);

  const debouncedSaveResponses = useCallback((testType, responses) => {
    if (responsesTimeoutRef.current) clearTimeout(responsesTimeoutRef.current);
    responsesTimeoutRef.current = setTimeout(() => {
      try { sessionStorage.setItem(`test_responses_${testType}`, JSON.stringify(responses)); } catch {}
    }, 1000);
  }, []);

  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (responsesTimeoutRef.current) clearTimeout(responsesTimeoutRef.current);
  }, []);

  return { debouncedSaveTime, debouncedSaveResponses, cleanup };
};

// Timer hook with progressive urgency
const useOptimizedTimer = (initialTime, onTimeUp, testType, timerSpeed = 1) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const hasAutoSubmittedRef = useRef(false);
  const { debouncedSaveTime } = useOptimizedStorage();

  useEffect(() => {
    if (initialTime === null) return;
    setTimeRemaining(initialTime);
    lastUpdateRef.current = Date.now();
    hasAutoSubmittedRef.current = false;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - (delta * timerSpeed));
        debouncedSaveTime(testType, newTime);
        if (newTime <= 30000 && !hasAutoSubmittedRef.current) {
          hasAutoSubmittedRef.current = true;
          onTimeUp?.();
        }
        return newTime;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [initialTime, timerSpeed, testType, debouncedSaveTime, onTimeUp]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') lastUpdateRef.current = Date.now();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return { timeRemaining, setTimeRemaining };
};

// Timer. The old version pulsed and grew when under 10% remained — an
// animated red clock in the corner of a candidate's eye for the last six
// minutes of an exam. The anxiety research is explicit that clutter and
// movement cost performance, so urgency is now carried by a word and a rule,
// both of which survive being read aloud and neither of which moves.
function TimerDisplay({ timeRemaining, totalTime }) {
  if (timeRemaining === null) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct = totalTime ? (timeRemaining / totalTime) : 1;

  const low = pct <= 0.10;
  const warn = pct <= 0.25 && !low;

  return (
    <div className={`flex items-baseline gap-3 border-l-[6px] pl-3 py-0.5
      ${low ? 'border-ftm-crimson' : warn ? 'border-ftm-ochre' : 'border-ftm-line2'}`}>
      <span className="font-inter font-bold text-[10px] tracking-[.14em] uppercase text-ftm-dim">
        {low ? 'Nearly out of time' : warn ? 'Time left' : 'Time left'}
      </span>
      <time
        className={`font-grotesk font-bold text-[19px] tabular-nums ${low ? 'text-ftm-ochre' : 'text-ftm-ink'}`}
        aria-live={low ? 'polite' : 'off'}
      >
        {formatted}
      </time>
    </div>
  );
}

// Reading/Listening Test Component
const MultipleChoiceTest = ({ content, onAnswer, responses, testType }) => {
  const sections = useMemo(() => {
    if (!content) return [];
    return content.reduce((acc, question) => {
      const sectionIndex = parseInt(question[1]) - 1;
      if (!acc[sectionIndex]) {
        acc[sectionIndex] = { title: question[2], content: question[3], questions: [] };
      }
      acc[sectionIndex].questions.push({
        id: `${sectionIndex}-${acc[sectionIndex].questions.length}`,
        number: question[4],
        text: question[5],
        options: question[6] ? JSON.parse(question[6]) : [],
        points: parseInt(question[8]) || 0,
      });
      return acc;
    }, []);
  }, [content]);

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(responses || {}).length;

  return (
    <div className="space-y-14">
      {/* Answered count. A count you can read beats a bar you have to estimate. */}
      <p className="font-inter text-[14px] text-ftm-mut border-b border-ftm-line pb-3">
        <span className="font-semibold text-ftm-ink tabular-nums">{answeredCount}</span> of{' '}
        <span className="tabular-nums">{totalQuestions}</span> questions answered
        {totalQuestions - answeredCount > 0 && (
          <span className="text-ftm-dim">
            {' '}&middot; <span className="tabular-nums">{totalQuestions - answeredCount}</span> to go
          </span>
        )}
      </p>

      {sections.map((section, sIndex) => (
        <section key={sIndex}>
          <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink pb-3 mb-6 border-b-2 border-ftm-line2">
            {section.title}
          </h2>

          {/* The passage gets a reading measure and 17px type. It is the one
              thing on this screen a candidate has to read closely. */}
          <div className="font-inter text-[17px] leading-[1.7] text-ftm-ink max-w-measure mb-12 whitespace-pre-wrap">
            {section.content}
          </div>

          <ol className="list-none p-0 m-0">
            {section.questions.map((question) => (
              <li key={question.id} className="border-t border-ftm-line py-7">
                <fieldset>
                  <legend className="font-inter font-semibold text-[16px] leading-relaxed text-ftm-ink mb-4 max-w-measure">
                    <span className="text-ftm-dim tabular-nums mr-2">{question.number}.</span>
                    {question.text}
                  </legend>
                  <div className="max-w-measure">
                    {question.options.map((option, oIndex) => {
                      const selected = responses?.[question.id] === option;
                      return (
                        <label
                          key={oIndex}
                          className="flex items-start gap-4 py-3 border-b border-ftm-line cursor-pointer group"
                        >
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            value={option}
                            checked={selected}
                            onChange={() => onAnswer(question.id, option)}
                            className="w-5 h-5 accent-[#C5132D] mt-0.5 flex-none"
                          />
                          <span className={`font-inter text-[16px] leading-relaxed transition-colors ${
                            selected ? 'text-ftm-ink font-semibold' : 'text-ftm-mut group-hover:text-ftm-ink'
                          }`}>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
};

// Writing Test Component (with Enhanced Writing Area)
const WritingTest = ({ content, onAnswer, responses }) => {
  if (!content || content.length === 0) return null;

  return (
    <div className="space-y-14">
      {content.map((prompt, index) => {
        const promptId = `prompt-${index}`;
        return (
          <section key={index}>
            <h2 className="font-grotesk font-bold text-[21px] text-ftm-ink pb-3 mb-6 border-b-2 border-ftm-line2">
              {prompt[2]}
            </h2>
            <div className="font-inter text-[17px] leading-[1.7] text-ftm-ink max-w-measure mb-8 whitespace-pre-wrap">
              {prompt[3]}
            </div>
            <EnhancedWritingArea
              value={responses?.[promptId] || ''}
              onChange={(text) => onAnswer(promptId, text)}
              wordLimit={prompt[4]}
              promptTitle={prompt[2]}
            />
          </section>
        );
      })}
    </div>
  );
};

// Main TestPortalComponent
export default function TestPortalComponent() {
  const { getCurrentTime, getTimerSpeed } = useTestMode();
  const { getProctoringData, recordTypingSample, clearWarnings, toggleProctoring, stopProctoringCheck, isFullscreen } = useProctoring();
  const router = useRouter();
  const { debouncedSaveResponses, cleanup: cleanupStorage } = useOptimizedStorage();

  const [currentTest, setCurrentTest] = useState(0);
  const [testData, setTestData] = useState(null);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldSubmit, setShouldSubmit] = useState(false);

  // UX flow states
  const [showInstructions, setShowInstructions] = useState(true);
  const [showTransition, setShowTransition] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const handleTimeUp = useCallback(() => { setShouldSubmit(true); }, []);

  const { timeRemaining, setTimeRemaining } = useOptimizedTimer(
    testData && !showInstructions ? TEST_TIME[TEST_SEQUENCE[currentTest]] : null,
    handleTimeUp,
    TEST_SEQUENCE[currentTest],
    getTimerSpeed()
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStorage();
      toggleProctoring(false);
      stopProctoringCheck();
      clearWarnings();
    };
  }, [cleanupStorage, toggleProctoring, stopProctoringCheck, clearWarnings]);

  // Answer handler
  const handleAnswer = useCallback((questionId, value) => {
    if (!questionId || value === undefined) return;
    setResponses(prev => {
      const newResponses = { ...prev, [questionId]: value };
      debouncedSaveResponses(TEST_SEQUENCE[currentTest], newResponses);
      return newResponses;
    });
    // Typing-cadence sample for the writing section (throttled inside the
    // context). A student writes one prompt, so this response IS the essay.
    if (TEST_SEQUENCE[currentTest] === 'writing' && typeof value === 'string') {
      recordTypingSample(value.trim().split(/\s+/).filter(Boolean).length);
    }
  }, [currentTest, debouncedSaveResponses, recordTypingSample]);

  // Load test data
  useEffect(() => {
    if (showInstructions) return;
    let isMounted = true;

    const loadTest = async () => {
      try {
        setError('');
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails') || '{}');

        if (!userData.eptId || !bookingDetails.selectedDate) throw new Error('Missing session data');

        const formatDateForAPI = (dateStr) => {
          const [dayOfWeek, restOfDate] = dateStr.split(', ');
          const [day, month] = restOfDate.split(' ');
          return `${dayOfWeek}, ${day} ${month}`;
        };

        const response = await fetch(
          `/api/test-delivery?date=${formatDateForAPI(bookingDetails.selectedDate)}&type=${TEST_SEQUENCE[currentTest]}&student_id=${userData.eptId}`
        );

        if (!isMounted) return;

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error === 'already_submitted') {
            if (currentTest < TEST_SEQUENCE.length - 1) {
              setCurrentTest(prev => prev + 1);
              setShowInstructions(true);
              return;
            } else {
              router.push('/test-complete');
              return;
            }
          }
          throw new Error(errorData.message || 'Failed to load test');
        }

        const data = await response.json();
        if (isMounted) {
          setTestData(data);
          setTimeRemaining(TEST_TIME[TEST_SEQUENCE[currentTest]]);
          setResponses({});
        }
      } catch (error) {
        if (isMounted) setError(error.message || 'An error occurred while loading the test');
      }
    };

    loadTest();
    return () => { isMounted = false; };
  }, [currentTest, router, setTimeRemaining, showInstructions]);

  // Auto-submission
  useEffect(() => {
    if (shouldSubmit && !isSubmitting) {
      submitTest();
      setShouldSubmit(false);
    }
  }, [shouldSubmit, isSubmitting]);

  // Resume from storage
  useEffect(() => {
    if (showInstructions) return;
    try {
      const savedResponses = sessionStorage.getItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
      const savedTime = sessionStorage.getItem(`test_time_${TEST_SEQUENCE[currentTest]}`);
      if (savedResponses) setResponses(JSON.parse(savedResponses));
      if (savedTime) {
        const t = parseInt(savedTime);
        if (!isNaN(t) && t > 0) setTimeRemaining(t);
      }
    } catch {}
  }, [currentTest, setTimeRemaining, showInstructions]);

  // Prevent accidental navigation
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Move to next test
  const moveToNextTest = useCallback(() => {
    clearWarnings();
    setShowTransition(false);
    setTestData(null);

    if (currentTest < TEST_SEQUENCE.length - 1) {
      setCurrentTest(prev => prev + 1);
      setShowInstructions(true);
    } else {
      stopProctoringCheck();
      toggleProctoring(false);
      window.location.href = '/test-complete';
    }
  }, [currentTest, clearWarnings, stopProctoringCheck, toggleProctoring]);

  // Submit — network-resilient. The server dedupes by (test_id, student_id),
  // so retries are safe and a 409 means the submission is already saved.
  const submitTest = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    const finish = () => {
      sessionStorage.removeItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
      sessionStorage.removeItem(`test_time_${TEST_SEQUENCE[currentTest]}`);
      setShowTransition(true);
    };

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      if (!userData.eptId || !testData?.test_id) throw new Error('Missing required data');

      const csrfToken = sessionStorage.getItem('csrfToken');
      const body = JSON.stringify({
        test_id: testData.test_id,
        responses,
        student_id: userData.eptId,
        type: TEST_SEQUENCE[currentTest],
        proctoring_data: getProctoringData(),
        time_remaining: timeRemaining,
        submission_time: new Date().toISOString(),
      });

      const MAX_ATTEMPTS = 4;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        try {
          const response = await fetch('/api/submit-test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
            },
            body,
            signal: controller.signal,
          });

          // 409 = already saved (e.g. a retry after a lost response) → treat as success.
          if (response.status === 409) { finish(); return; }

          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.message || 'Submission failed');

          finish();
          return;
        } catch (err) {
          // Only retry transient network/timeout failures; surface real HTTP errors.
          const transient = err.name === 'AbortError' || err.name === 'TypeError' ||
            /failed to fetch|networkerror|load failed/i.test(err.message || '');
          if (!transient || attempt === MAX_ATTEMPTS) throw err;
          await new Promise(r => setTimeout(r, attempt * 1000)); // 1s, 2s, 3s backoff
        } finally {
          clearTimeout(timer);
        }
      }
    } catch (error) {
      setError(error.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, testData, currentTest, timeRemaining, responses, getProctoringData]);

  const handleForcedSubmit = useCallback(() => { setShouldSubmit(true); }, []);

  // Show instructions before each section
  if (showInstructions) {
    return (
      <PreTestInstructions
        testType={TEST_SEQUENCE[currentTest]}
        timeLimit={TEST_TIME[TEST_SEQUENCE[currentTest]]}
        sectionNumber={currentTest + 1}
        totalSections={TEST_SEQUENCE.length}
        onBegin={() => setShowInstructions(false)}
      />
    );
  }

  // Show transition between sections
  if (showTransition) {
    return (
      <SectionTransition
        completedSection={TEST_SEQUENCE[currentTest]}
        isLastSection={currentTest >= TEST_SEQUENCE.length - 1}
        onContinue={moveToNextTest}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-ftm-night flex items-center justify-center z-50 px-6">
        <div className="w-full max-w-measure border-l-[6px] border-ftm-crimson pl-6 py-2" role="alert">
          <h2 className="font-grotesk font-bold text-[26px] text-ftm-ink mb-2">
            We could not load this section
          </h2>
          <p className="font-inter text-[16px] leading-relaxed text-ftm-mut mb-2">{error}</p>
          <p className="font-inter text-[15px] leading-relaxed text-ftm-mut mb-7">
            Nothing you have already submitted is affected. Try again, and tell an invigilator
            if it happens twice.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="primary" onClick={() => { setError(''); setShowInstructions(true); }}>
              Try again
            </Button>
            <Button variant="ghost" onClick={() => router.push('/home')}>
              Back to my dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (!testData) return <TestLoadingState testType={TEST_SEQUENCE[currentTest]} />;

  const sectionName =
    TEST_SEQUENCE[currentTest].charAt(0).toUpperCase() + TEST_SEQUENCE[currentTest].slice(1);

  // Get word counts for writing submission confirmation
  const getWordCounts = () => {
    const counts = {};
    Object.entries(responses).forEach(([key, val]) => {
      if (typeof val === 'string') {
        counts[key] = val.split(/\s+/).filter(w => w.length > 0).length;
      }
    });
    return counts;
  };

  return (
    <ProctoringWrapper onForcedSubmit={handleForcedSubmit}>
      <div className="min-h-screen bg-ftm-night">
        {/* Submission confirmation overlay */}
        {showConfirmSubmit && (
          <SubmissionConfirmation
            testType={TEST_SEQUENCE[currentTest]}
            responses={responses}
            wordCounts={TEST_SEQUENCE[currentTest] === 'writing' ? getWordCounts() : null}
            onConfirm={submitTest}
            onCancel={() => setShowConfirmSubmit(false)}
            isSubmitting={isSubmitting}
          />
        )}

        {/*
          The status band. After the NYCTA Graphics Standards Manual: a fixed
          thing appears in a fixed place, so a candidate under pressure never
          hunts for it. It carries three facts and nothing else — which section,
          where in the sequence, how long is left — and it never moves, resizes
          or animates for the whole exam.
        */}
        <header className="bg-ftm-bar border-b border-ftm-line2 sticky top-0 z-30">
          <div className="max-w-shell mx-auto px-6 sm:px-10">
            <div className="flex items-center justify-between gap-6 h-bar">
              <div className="flex items-baseline gap-4 min-w-0">
                <h1 className="font-grotesk font-bold text-[19px] text-ftm-ink whitespace-nowrap">
                  {sectionName}
                </h1>
                <p className="font-inter text-[13px] text-ftm-mut whitespace-nowrap">
                  Section <span className="tabular-nums">{currentTest + 1}</span> of{' '}
                  <span className="tabular-nums">{TEST_SEQUENCE.length}</span>
                </p>
              </div>
              <div className="flex items-center gap-6">
                {/* Fullscreen state lives in the band rather than floating in
                    the corner over it. Colour plus a word, never colour alone. */}
                <span className={`ftm-status font-semibold ${isFullscreen ? 'text-ftm-green' : 'text-ftm-ochre'}`}>
                  {isFullscreen ? 'Fullscreen' : 'Not fullscreen'}
                </span>
                <TimerDisplay timeRemaining={timeRemaining} totalTime={TEST_TIME[TEST_SEQUENCE[currentTest]]} />
              </div>
            </div>
          </div>
          {/* Sequence position, as three fixed segments rather than a sliding bar */}
          <div className="flex gap-0.5" role="presentation">
            {TEST_SEQUENCE.map((name, i) => (
              <div key={name} className={`h-1 flex-1 ${i <= currentTest ? 'bg-ftm-crimson' : 'bg-ftm-up'}`} />
            ))}
          </div>
        </header>

        {/* Test Content */}
        <main className="max-w-shell mx-auto px-6 sm:px-10 py-12">
          {(TEST_SEQUENCE[currentTest] === 'reading' || TEST_SEQUENCE[currentTest] === 'listening') && (
            <MultipleChoiceTest
              content={testData.content}
              onAnswer={handleAnswer}
              responses={responses}
              testType={TEST_SEQUENCE[currentTest]}
            />
          )}

          {TEST_SEQUENCE[currentTest] === 'writing' && (
            <WritingTest
              content={testData.content}
              onAnswer={handleAnswer}
              responses={responses}
            />
          )}

          {/* Submit */}
          <div className="mt-16 pt-8 border-t-2 border-ftm-line2 pb-8">
            <p className="font-inter text-[14px] text-ftm-mut mb-4 max-w-measure">
              You can submit this section once. After that you cannot reopen it.
            </p>
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Submit the {sectionName.toLowerCase()} section
            </Button>
          </div>
        </main>
      </div>
    </ProctoringWrapper>
  );
}
