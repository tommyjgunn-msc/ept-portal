// components/TestPortalComponent.js - FIXED VERSION
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';
import { useProctoring } from '@/context/ProctoringContext';
import ProctoringWrapper from './ProctoringWrapper';
import DebugSessionStorage from './DebugSessionStorage';
import { TestLoadingState } from './LoadingStates';
import { ProgressBar, Badge } from './UIDesignSystem';
import { Modal, Button } from './UIDesignSystem';

const TEST_SEQUENCE = ['reading', 'writing', 'listening'];
const TEST_TIME = {
  reading: 60 * 60 * 1000,  
  writing: 60 * 60 * 1000,   
  listening: 60 * 60 * 1000   
};

// Optimized storage operations with debouncing
const useOptimizedStorage = () => {
  const saveTimeoutRef = useRef(null);
  const responsesTimeoutRef = useRef(null);
  
  const debouncedSaveTime = useCallback((testType, time) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(`test_time_${testType}`, time.toString());
      } catch (e) {
        console.warn('Failed to save time to sessionStorage:', e);
      }
    }, 5000);
  }, []);

  const debouncedSaveResponses = useCallback((testType, responses) => {
    if (responsesTimeoutRef.current) {
      clearTimeout(responsesTimeoutRef.current);
    }
    
    responsesTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(`test_responses_${testType}`, JSON.stringify(responses));
      } catch (e) {
        console.warn('Failed to save responses to sessionStorage:', e);
      }
    }, 1000);
  }, []);

  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (responsesTimeoutRef.current) {
      clearTimeout(responsesTimeoutRef.current);
    }
  }, []);

  return {
    debouncedSaveTime,
    debouncedSaveResponses,
    cleanup
  };
};

// Optimized timer hook
const useOptimizedTimer = (initialTime, onTimeUp, testType, timerSpeed = 1) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [timerWarning, setTimerWarning] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const { debouncedSaveTime } = useOptimizedStorage();

  useEffect(() => {
    if (initialTime === null) return;
    
    setTimeRemaining(initialTime);
    lastUpdateRef.current = Date.now();
    
    const warningTime = 5 * 60 * 1000;
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;
      
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - (delta * timerSpeed));
        
        // Debounced storage save
        debouncedSaveTime(testType, newTime);
        
        if (newTime <= warningTime && !timerWarning) {
          setTimerWarning(true);
        }
        
        if (newTime <= 30000 && !isAutoSubmitting) {
          setIsAutoSubmitting(true);
          onTimeUp?.();
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialTime, timerSpeed, testType, timerWarning, isAutoSubmitting, debouncedSaveTime, onTimeUp]);

  // Handle visibility change for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastUpdateRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    timeRemaining,
    timerWarning,
    isAutoSubmitting,
    setTimeRemaining
  };
};

// Reading Test Component
const ReadingTest = ({ content, onAnswer, responses }) => {
  const sections = useMemo(() => {
    if (!content) return [];
    
    return content.reduce((sections, question) => {
      const sectionIndex = parseInt(question[1]) - 1;
      if (!sections[sectionIndex]) {
        sections[sectionIndex] = {
          title: question[2],
          content: question[3],
          questions: []
        };
      }
      sections[sectionIndex].questions.push({
        id: `${sectionIndex}-${sections[sectionIndex].questions.length}`,
        number: question[4],
        text: question[5],
        options: question[6] ? JSON.parse(question[6]) : [],
        points: parseInt(question[8]) || 0
      });
      return sections;
    }, []);
  }, [content]);

  return (
    <div className="space-y-8">
      {sections.map((section, sIndex) => (
        <div key={sIndex} className="bg-white shadow rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold">{section.title}</h2>
          <div className="prose max-w-none mb-6">{section.content}</div>
          
          {section.questions.map((question) => (
            <div key={question.id} className="border-t pt-4">
              <p className="font-medium mb-4">{question.number}. {question.text}</p>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <label key={oIndex} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={option}
                      checked={responses?.[question.id] === option}
                      onChange={() => onAnswer(question.id, option)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Writing Test Component
const WritingTest = ({ content, onAnswer, responses }) => {
  if (!content || content.length === 0) return null;
  
  return (
    <div className="space-y-8">
      {content.map((prompt, index) => {
        const promptId = `prompt-${index}`;
        const wordCount = (responses?.[promptId] || '').split(/\s+/).filter(w => w.length > 0).length;
        
        return (
          <div key={index} className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">{prompt[2]}</h2>
            <div className="prose max-w-none mb-4 whitespace-pre-wrap">{prompt[3]}</div>
            <div className="text-sm text-gray-600 mb-2">
              Word limit: {prompt[4]} words
            </div>
            <textarea
              className="w-full min-h-[300px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              placeholder="Type your response here..."
              value={responses?.[promptId] || ''}
              onChange={(e) => onAnswer(promptId, e.target.value)}
            />
            <div className="text-sm text-gray-500 text-right">
              Word count: <span className={wordCount > parseInt(prompt[4]) ? 'text-red-600 font-bold' : ''}>{wordCount}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Listening Test Component
const ListeningTest = ({ content, onAnswer, responses }) => {
  const sections = useMemo(() => {
    if (!content) return [];
    
    return content.reduce((sections, question) => {
      const sectionIndex = parseInt(question[1]) - 1;
      if (!sections[sectionIndex]) {
        sections[sectionIndex] = {
          title: question[2],
          content: question[3],
          questions: []
        };
      }
      sections[sectionIndex].questions.push({
        id: `${sectionIndex}-${sections[sectionIndex].questions.length}`,
        number: question[4],
        text: question[5],
        options: question[6] ? JSON.parse(question[6]) : [],
        points: parseInt(question[8]) || 0
      });
      return sections;
    }, []);
  }, [content]);

  return (
    <div className="space-y-8">
      {sections.map((section, sIndex) => (
        <div key={sIndex} className="bg-white shadow rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold">{section.title}</h2>
          <div className="prose max-w-none mb-6">{section.content}</div>
          
          {section.questions.map((question) => (
            <div key={question.id} className="border-t pt-4">
              <p className="font-medium mb-4">{question.number}. {question.text}</p>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <label key={oIndex} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      value={option}
                      checked={responses?.[question.id] === option}
                      onChange={() => onAnswer(question.id, option)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Main component
export default function TestPortalComponent() {
  const { getCurrentTime, getTimerSpeed } = useTestMode();
  const { getProctoringData, clearWarnings, toggleProctoring, stopProctoringCheck } = useProctoring();
  const router = useRouter();
  const { debouncedSaveResponses, cleanup: cleanupStorage } = useOptimizedStorage();
  
  // State management
  const [currentTest, setCurrentTest] = useState(0);
  const [testData, setTestData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [shouldSubmit, setShouldSubmit] = useState(false);
  
  // Optimized timer
  const { timeRemaining, timerWarning, isAutoSubmitting, setTimeRemaining } = useOptimizedTimer(
    testData ? TEST_TIME[TEST_SEQUENCE[currentTest]] : null,
    () => setShouldSubmit(true),
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

  // Format time display
  const formatTime = useCallback((ms) => {
    if (ms === null) return '--:--';
    
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, []);

  // Optimized answer handler
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
    let isMounted = true;
    
    const loadTest = async () => {
      try {
        setError('');
        
        const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
        const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails') || '{}');
        
        if (!userData.eptId || !bookingDetails.selectedDate) {
          throw new Error('Missing session data');
        }

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
        if (isMounted) {
          console.error('Error in loadTest:', error);
          setError(error.message || 'An error occurred while loading the test');
        }
      }
    };
  
    loadTest();
    
    return () => {
      isMounted = false;
    };
  }, [currentTest, router, setTimeRemaining]);

  // Handle auto-submission
  useEffect(() => {
    if (shouldSubmit && !isSubmitting) {
      submitTest();
      setShouldSubmit(false);
    }
  }, [shouldSubmit, isSubmitting]);

  // Resume test state from storage
  useEffect(() => {
    const resumeTest = () => {
      try {
        const savedResponses = sessionStorage.getItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
        const savedTime = sessionStorage.getItem(`test_time_${TEST_SEQUENCE[currentTest]}`);
        
        if (savedResponses) {
          const parsedResponses = JSON.parse(savedResponses);
          setResponses(parsedResponses);
        }
        
        if (savedTime) {
          const parsedTime = parseInt(savedTime);
          if (!isNaN(parsedTime) && parsedTime > 0) {
            setTimeRemaining(parsedTime);
          }
        }
      } catch (error) {
        console.warn('Error restoring test state:', error);
      }
    };
  
    resumeTest();
  }, [currentTest, setTimeRemaining]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!showConfirmation) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showConfirmation]);

  // Move to next test
  const moveToNextTest = useCallback(() => {
    clearWarnings();
    setShowConfirmation(false);
    
    if (currentTest < TEST_SEQUENCE.length - 1) {
      setTimeout(() => {
        setCurrentTest(prev => prev + 1);
      }, 100);
    } else {
      stopProctoringCheck();
      toggleProctoring(false); 
      window.location.href = '/test-complete';
    }
  }, [currentTest, clearWarnings, stopProctoringCheck, toggleProctoring]);
  
  // Submit function
  const submitTest = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmissionError('');
  
    try {
      const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
      
      if (!userData.eptId || !testData?.test_id) {
        throw new Error('Missing required data for submission');
      }

      const submissionData = {
        test_id: testData.test_id,
        responses,
        student_id: userData.eptId,
        type: TEST_SEQUENCE[currentTest],
        proctoring_data: getProctoringData(),
        time_remaining: timeRemaining,
        submission_time: new Date().toISOString()
      };

      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Submission failed');
      }

      // Clear storage for this test
      sessionStorage.removeItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
      sessionStorage.removeItem(`test_time_${TEST_SEQUENCE[currentTest]}`);

      setShowConfirmation(true);
      
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(error.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, testData, currentTest, timeRemaining, responses, getProctoringData]);

  // Forced submission handler
  const handleForcedSubmit = useCallback(() => {
    setShouldSubmit(true);
  }, []);

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => router.push('/home')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Return Home
            </button>
            <button
              onClick={() => router.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!testData) {
    return <TestLoadingState testType={TEST_SEQUENCE[currentTest]} />;
  }

  return (
    <ProctoringWrapper onForcedSubmit={handleForcedSubmit}>
      <div className="min-h-screen bg-gray-50">
        <DebugSessionStorage />
        
        {/* Confirmation Modal */}
        {showConfirmation && (
          <Modal
            isOpen={showConfirmation}
            onClose={() => {}}
            title="Test Submitted Successfully"
            size="md"
          >
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <p className="text-gray-600 mb-6">
                You've completed the {TEST_SEQUENCE[currentTest]} test. 
                {submissionError ? (
                  <span className="text-red-600 block mt-2">
                    Warning: {submissionError}
                  </span>
                ) : ' Please wait for the instructor before proceeding to the next test.'}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
                  Close
                </Button>
                {!submissionError && (
                  <Button variant="primary" onClick={moveToNextTest}>
                    Continue to Next Test
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {TEST_SEQUENCE[currentTest].charAt(0).toUpperCase() + TEST_SEQUENCE[currentTest].slice(1)} Test
              </h1>
              <Badge variant="primary" size="md">
                {currentTest + 1} of {TEST_SEQUENCE.length}
              </Badge>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-500">Time Remaining</p>
              <p className={`text-lg font-bold ${timerWarning ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
          
          <ProgressBar 
            value={currentTest + 1} 
            max={TEST_SEQUENCE.length}
            variant="primary"
            showLabel
            className="mb-2"
          />
        </div>

        {/* Test Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {TEST_SEQUENCE[currentTest] === 'reading' && (
              <ReadingTest 
                content={testData.content}
                onAnswer={handleAnswer}
                responses={responses}
              />
            )}
            
            {TEST_SEQUENCE[currentTest] === 'writing' && (
              <WritingTest 
                content={testData.content}
                onAnswer={handleAnswer}
                responses={responses}
              />
            )}
            
            {TEST_SEQUENCE[currentTest] === 'listening' && (
              <ListeningTest 
                content={testData.content}
                onAnswer={handleAnswer}
                responses={responses}
              />
            )}
            
            <div className="mt-8 flex justify-end">
              <Button
                onClick={submitTest}
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                iconPosition="right"
              >
                Submit Test
              </Button>
            </div>
          </div>
        </main>
      </div>
    </ProctoringWrapper>
  );
}
