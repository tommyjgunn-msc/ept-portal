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

// Timer display with progressive urgency
function TimerDisplay({ timeRemaining, totalTime }) {
  if (timeRemaining === null) return null;

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct = totalTime ? (timeRemaining / totalTime) : 1;

  let colorClass = 'text-ftm-slate';
  let bgClass = 'bg-white/[.06]';
  let extraClass = '';

  if (pct <= 0.10) {
    colorClass = 'text-ftm-red';
    bgClass = 'bg-ftm-red/10 border border-ftm-red/30';
    extraClass = 'animate-pulse text-lg';
  } else if (pct <= 0.25) {
    colorClass = 'text-ftm-amberdim';
    bgClass = 'bg-ftm-amber/10 border border-ftm-amber/30';
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-500 ${bgClass}`}>
      <svg className={`w-4 h-4 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className={`font-mono font-bold ${colorClass} ${extraClass}`}>{formatted}</span>
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
    <div className="space-y-8">
      {/* Question progress */}
      <div className="bg-ftm-card rounded-lg shadow-sm border border-white/[.08] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ftm-slate">
            {answeredCount} of {totalQuestions} questions answered
          </span>
          <span className="text-sm text-ftm-mut">
            {totalQuestions - answeredCount} remaining
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-ftm-red rounded-full transition-all duration-500"
            style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
          />
        </div>
      </div>

      {sections.map((section, sIndex) => (
        <div key={sIndex} className="bg-ftm-card shadow-sm rounded-xl border border-white/[.08] overflow-hidden">
          <div className="bg-ftm-night px-6 py-4 border-b border-white/[.08]">
            <h2 className="text-lg font-bold text-ftm-ink">{section.title}</h2>
          </div>
          <div className="px-6 py-4">
            <div className="prose max-w-none mb-6 text-ftm-slate leading-relaxed">{section.content}</div>
            <div className="space-y-6">
              {section.questions.map((question) => (
                <div key={question.id} className="border-t border-white/[.07] pt-5">
                  <p className="font-medium text-ftm-ink mb-3">
                    <span className="text-ftm-red mr-1">{question.number}.</span>
                    {question.text}
                  </p>
                  <div className="space-y-2 ml-1">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                          responses?.[question.id] === option
                            ? 'border-ftm-red/40 bg-ftm-red/[.12] shadow-sm'
                            : 'border-white/[.08] hover:border-white/[.16] hover:bg-ftm-night'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={option}
                          checked={responses?.[question.id] === option}
                          onChange={() => onAnswer(question.id, option)}
                          className="h-4 w-4 text-ftm-red border-white/[.16]"
                        />
                        <span className="text-sm text-ftm-slate">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Writing Test Component (with Enhanced Writing Area)
const WritingTest = ({ content, onAnswer, responses }) => {
  if (!content || content.length === 0) return null;

  return (
    <div className="space-y-8">
      {content.map((prompt, index) => {
        const promptId = `prompt-${index}`;
        return (
          <div key={index} className="bg-ftm-card shadow-sm rounded-xl border border-white/[.08] overflow-hidden">
            <div className="bg-ftm-night px-6 py-4 border-b border-white/[.08]">
              <h2 className="text-lg font-bold text-ftm-ink">{prompt[2]}</h2>
            </div>
            <div className="px-6 py-4">
              <div className="prose max-w-none mb-6 text-ftm-slate leading-relaxed whitespace-pre-wrap">
                {prompt[3]}
              </div>
              <EnhancedWritingArea
                value={responses?.[promptId] || ''}
                onChange={(text) => onAnswer(promptId, text)}
                wordLimit={prompt[4]}
                promptTitle={prompt[2]}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main TestPortalComponent
export default function TestPortalComponent() {
  const { getCurrentTime, getTimerSpeed } = useTestMode();
  const { getProctoringData, clearWarnings, toggleProctoring, stopProctoringCheck } = useProctoring();
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
  }, [currentTest, debouncedSaveResponses]);

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

  // Submit
  const submitTest = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmSubmit(false);

    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      if (!userData.eptId || !testData?.test_id) throw new Error('Missing required data');

      const csrfToken = sessionStorage.getItem('csrfToken');
      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        },
        body: JSON.stringify({
          test_id: testData.test_id,
          responses,
          student_id: userData.eptId,
          type: TEST_SEQUENCE[currentTest],
          proctoring_data: getProctoringData(),
          time_remaining: timeRemaining,
          submission_time: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Submission failed');

      sessionStorage.removeItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
      sessionStorage.removeItem(`test_time_${TEST_SEQUENCE[currentTest]}`);

      setShowTransition(true);
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
      <div className="fixed inset-0 bg-ftm-night flex items-center justify-center z-50">
        <div className="max-w-md w-full bg-ftm-card shadow-lg rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-ftm-red/[.14] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-ftm-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.767 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-ftm-ink mb-2">Something went wrong</h2>
          <p className="text-ftm-mut mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <Button variant="secondary" onClick={() => router.push('/home')}>Return Home</Button>
            <Button variant="primary" onClick={() => { setError(''); setShowInstructions(true); }}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (!testData) return <TestLoadingState testType={TEST_SEQUENCE[currentTest]} />;

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

        {/* Header */}
        <div className="bg-ftm-card shadow-sm border-b sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-ftm-ink">
                  {TEST_SEQUENCE[currentTest].charAt(0).toUpperCase() + TEST_SEQUENCE[currentTest].slice(1)} Test
                </h1>
                <Badge variant="primary" size="sm">
                  {currentTest + 1} / {TEST_SEQUENCE.length}
                </Badge>
              </div>
              <TimerDisplay timeRemaining={timeRemaining} totalTime={TEST_TIME[TEST_SEQUENCE[currentTest]]} />
            </div>
            <ProgressBar
              value={currentTest + 1}
              max={TEST_SEQUENCE.length}
              variant="primary"
              size="sm"
              className="mt-2"
            />
          </div>
        </div>

        {/* Test Content */}
        <main className="max-w-5xl mx-auto py-6 px-4">
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

          {/* Submit button */}
          <div className="mt-8 flex justify-end pb-8">
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Submit {TEST_SEQUENCE[currentTest].charAt(0).toUpperCase() + TEST_SEQUENCE[currentTest].slice(1)} Test
            </Button>
          </div>
        </main>
      </div>
    </ProctoringWrapper>
  );
}
