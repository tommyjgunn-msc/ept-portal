// pages/test-portal.js
import { useState, useEffect, useCallback, useReducer } from 'react';
import { useRouter } from 'next/router';
import { useTestMode } from '@/context/TestModeContext';
import DebugSessionStorage from '../components/DebugSessionStorage';

const TEST_SEQUENCE = ['reading', 'writing', 'listening'];
const TEST_TIME = {
  reading: 60 * 60 * 1000,  
  writing: 60 * 60 * 1000,   
  listening: 60 * 60 * 1000   
};

const ReadingTest = ({ content, onAnswer, responses }) => {
  return (
    <div className="space-y-8">
      {content.reduce((sections, question) => {
        const sectionIndex = parseInt(question[1]) - 1;
        if (!sections[sectionIndex]) {
          sections[sectionIndex] = {
            title: question[2],
            content: question[3],
            questions: []
          };
        }
        sections[sectionIndex].questions.push({
          number: question[4],
          text: question[5],
          options: question[6] ? JSON.parse(question[6]) : [],
          points: parseInt(question[8]) || 0
        });
        return sections;
      }, []).map((section, sIndex) => (
        <div key={sIndex} className="bg-white shadow rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold">{section.title}</h2>
          <div className="prose max-w-none mb-6">{section.content}</div>
          
          {section.questions.map((question, qIndex) => (
            <div key={qIndex} className="border-t pt-4">
              <p className="font-medium mb-4">{question.number}. {question.text}</p>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <label key={oIndex} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`q-${sIndex}-${qIndex}`}
                      value={option}
                      checked={responses?.[`${sIndex}-${qIndex}`] === option}
                      onChange={() => onAnswer(`${sIndex}-${qIndex}`, option)}
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

const WritingTest = ({ content, onAnswer, responses }) => {
  return (
    <div className="space-y-8">
      {content.map((prompt, index) => (
        <div key={index} className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-500 uppercase">
              {prompt[2]} Essay
            </span>
          </div>
          <p className="text-lg font-medium">{prompt[3]}</p>
          <p className="text-sm text-gray-500">Word limit: {prompt[4]} words</p>
          <textarea
            value={responses?.[`prompt-${index}`] || ''}
            onChange={(e) => onAnswer(`prompt-${index}`, e.target.value)}
            className="w-full h-64 mt-4 p-4 border rounded-lg resize-none"
            placeholder="Type your essay here..."
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              Word count: {(responses?.[`prompt-${index}`] || '').trim().split(/\s+/).length}
            </span>
            <span>{prompt[4]} words maximum</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const ListeningTest = ({ content, onAnswer, responses }) => {
  return (
    <div className="space-y-8">
      {content.reduce((sections, question) => {
        const sectionIndex = parseInt(question[1]) - 1;
        if (!sections[sectionIndex]) {
          sections[sectionIndex] = {
            title: question[2],
            questions: []
          };
        }
        sections[sectionIndex].questions.push({
          number: question[4],
          text: question[5],
          options: question[6] ? JSON.parse(question[6]) : [],
          points: parseInt(question[8]) || 0
        });
        return sections;
      }, []).map((section, sIndex) => (
        <div key={sIndex} className="bg-white shadow rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-bold">{section.title}</h2>
          
          {section.questions.map((question, qIndex) => (
            <div key={qIndex} className="border-t pt-4">
              <p className="font-medium mb-4">{question.number}. {question.text}</p>
              <div className="space-y-2">
                {question.options.map((option, oIndex) => (
                  <label key={oIndex} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                    <input
                      type="radio"
                      name={`q-${sIndex}-${qIndex}`}
                      value={option}
                      checked={responses?.[`${sIndex}-${qIndex}`] === option}
                      onChange={() => onAnswer(`${sIndex}-${qIndex}`, option)}
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

const useTestState = (initialState) => {
  const [state, dispatch] = useReducer(testReducer, {
    currentTest: 0,
    testData: null,
    timeRemaining: null,
    showConfirmation: false,
    responses: {},
    error: '',
    isSubmitting: false,
    submissionError: '',
    isAutoSubmitting: false,
    timerWarning: false,
    shouldSubmit: false,
    ...initialState
  });

  const setTimeRemaining = (time) => {
    dispatch({ type: 'SET_TIME', payload: time });
    
    sessionStorage.setItem(
      `test_time_${TEST_SEQUENCE[state.currentTest]}`,
      time.toString()
    );
  };

  return {
    state,
    dispatch,
    setTimeRemaining,
  };
};

export default function TestPortal() {
  const { getCurrentTime, getTimerSpeed } = useTestMode();
  const [currentTest, setCurrentTest] = useState(0);
  const [testData, setTestData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [responses, setResponses] = useState({});
  const [error, setError] = useState('');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  
  const formatDateForAPI = (dateString) => {
    const match = dateString.match(/(\d{1,2})\s+(\w+)/);
    if (!match) {
        throw new Error('Invalid date format');
    }

    const day = match[1]; 
    const month = match[2];

    const monthMap = {
        'January': '01',
        'February': '02',
        'March': '03',
        'April': '04',
        'May': '05',
        'June': '06',
        'July': '07',
        'August': '08',
        'September': '09',
        'October': '10',
        'November': '11',
        'December': '12'
    };

    if (!monthMap[month]) {
        throw new Error(`Invalid month: ${month}`);
    }

    return `2025-${monthMap[month]}-${day.padStart(2, '0')}`;
};

  

  useEffect(() => {
    const loadTest = async () => {
      try {
        console.log('Starting loadTest function...');
        
        const storedBooking = sessionStorage.getItem('bookingDetails');
        const storedUser = sessionStorage.getItem('userData');
        
        console.log('Stored booking:', storedBooking);
        console.log('Stored user:', storedUser);
        
        if (!storedBooking || !storedUser) {
          console.log('Missing storage data, redirecting to login');
          router.push('/login');
          return;
        }
    
        const bookingDetails = JSON.parse(storedBooking);
        const userData = JSON.parse(storedUser);
        
        console.log('Parsed booking details:', bookingDetails);
        console.log('Parsed user data:', userData);
        
        const now = getCurrentTime();
        console.log('Current time:', now);
        console.log('Current hour:', now.getHours());
        
        const is10AM = now.getHours() >= 10;
        console.log('Is after 10 AM:', is10AM);
    
        console.log('Fetching test with params:', {
          date: bookingDetails.selectedDate,
          type: TEST_SEQUENCE[currentTest],
          student_id: userData.eptId
        });
    
        const apiUrl = `/api/test-delivery?date=${formatDateForAPI(bookingDetails.selectedDate)}&type=${TEST_SEQUENCE[currentTest]}&student_id=${userData.eptId}`;
        console.log('Final API URL:', apiUrl);

        const response = await fetch(
          `/api/test-delivery?date=${formatDateForAPI(bookingDetails.selectedDate)}&type=${TEST_SEQUENCE[currentTest]}&student_id=${userData.eptId}`
        );
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
            console.log('Error data from API:', errorData);
          } catch (e) {
            console.log('Could not parse error response:', e);
            throw new Error('Invalid response from server');
          }
          if (errorData.error === 'already_submitted') {
            console.log('Test already submitted, checking next test');
            if (currentTest < TEST_SEQUENCE.length - 1) {
              setCurrentTest(prev => prev + 1);
              return;
            } else {
              console.log('All tests completed, redirecting');
              router.push('/test-complete');
              return;
            }
          }
          throw new Error(errorData.message || 'Failed to load test');
        }
    
        const data = await response.json();
        console.log('Successfully loaded test data');
        setTestData(data);
        setTimeRemaining(TEST_TIME[TEST_SEQUENCE[currentTest]]);
        setResponses({});
        
      } catch (error) {
        console.error('Error in loadTest:', error);
        setError(error.message || 'An error occurred while loading the test');
      }
    };
  
    loadTest();
  }, [currentTest, router, getCurrentTime, setError]);

  useEffect(() => {
    if (shouldSubmit) {
      submitTest();
      setShouldSubmit(false);
    }
  }, [shouldSubmit]);

  useEffect(() => {
    const resumeTest = async () => {
      const savedResponses = sessionStorage.getItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
      const savedTime = sessionStorage.getItem(`test_time_${TEST_SEQUENCE[currentTest]}`);
      
      if (savedResponses) {
        try {
          const parsedResponses = JSON.parse(savedResponses);
          setResponses(parsedResponses);
        } catch (error) {
          console.error('Error restoring responses:', error);
        }
      }
      
      if (savedTime) {
        try {
          const parsedTime = parseInt(savedTime);
          if (!isNaN(parsedTime) && parsedTime > 0) {
            setTimeRemaining(parsedTime);
          }
        } catch (error) {
          console.error('Error restoring time:', error);
        }
      }
    };
  
    resumeTest();
  }, [currentTest]);

  useEffect(() => {
    if (!testData || timeRemaining === null) return;
    
    let mounted = true;
    const speed = getTimerSpeed() * 1000;
    const warningTime = 5 * 60 * 1000;
    
    let lastUpdate = Date.now();
    
    const timer = setInterval(() => {
      if (!mounted) return;
      
      const now = Date.now();
      const delta = now - lastUpdate;
      lastUpdate = now;
      
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - (delta * speed / 1000));
        
        if (newTime <= warningTime && !timerWarning) {
          setTimerWarning(true);
        }
        
        if (newTime <= 30000 && !isAutoSubmitting) {
          setIsAutoSubmitting(true);
          setShouldSubmit(true);
        }
        
        return newTime;
      });
    }, 100); 
    
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [testData, timeRemaining, getTimerSpeed]);

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
  
  useEffect(() => {
    if (timeRemaining === null) return;
    
    const saveTimer = setInterval(() => {
      sessionStorage.setItem(
        `test_time_${TEST_SEQUENCE[currentTest]}`,
        timeRemaining.toString()
      );
    }, 10000);
  
    return () => {
      clearInterval(saveTimer);
      if (!showConfirmation) {  
        sessionStorage.removeItem(`test_time_${TEST_SEQUENCE[currentTest]}`);
      }
    };
  }, [timeRemaining, currentTest]);
  
  const formatTime = (ms) => {
    if (ms === null) return '--:--';
    
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const handleAnswer = (questionId, value) => {
    if (!questionId || value === undefined) return;
    setResponses(prev => {
      const newResponses = {
        ...prev,
        [questionId]: value
      };
      sessionStorage.setItem(`test_responses_${TEST_SEQUENCE[currentTest]}`, 
        JSON.stringify(newResponses)
      );
      return newResponses;
    });
  };

  const moveToNextTest = () => {
    console.log('Moving to next test:', {
      currentTest,
      currentType: TEST_SEQUENCE[currentTest]
    });
  
    setShowConfirmation(false);
    
    if (currentTest < TEST_SEQUENCE.length - 1) {
      console.log(`Moving to next test: ${TEST_SEQUENCE[currentTest + 1]}`);
      setCurrentTest(prev => prev + 1);
    } else {
      console.log('All tests completed, redirecting to completion page');
      window.location.href = '/test-complete';
    }
  };  
  
  const submitTest = useCallback(async () => {
    if (isSubmitting) {
      console.log('Submission already in progress, returning');
      return;
    }
    
    console.log('Starting test submission:', {
      currentTest: TEST_SEQUENCE[currentTest],
      testId: testData?.test_id
    });
    
    setIsSubmitting(true);
    setSubmissionError('');
  
    try {
      const userData = JSON.parse(sessionStorage.getItem('userData'));
      const storedBooking = JSON.parse(sessionStorage.getItem('bookingDetails'));
      
      console.log('Session data check:', {
        hasUserData: !!userData,
        hasEptId: !!userData?.eptId,
        hasBooking: !!storedBooking
      });
  
      if (!userData?.eptId || !storedBooking) {
        throw new Error('Session data missing');
      }
  
      const submissionData = {
        test_id: testData.test_id,
        student_id: userData.eptId,
        type: TEST_SEQUENCE[currentTest],
        responses,
        time_taken: TEST_TIME[TEST_SEQUENCE[currentTest]] - timeRemaining,
        completed: true
      };
  
      console.log('Submitting test data:', submissionData);
  
      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
  
      console.log('Submission response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'already_submitted') {
          console.log('Test was already submitted, moving to next test');
          moveToNextTest();
          return;
        }
        throw new Error(data.message || 'Failed to submit test');
      }
  
      sessionStorage.removeItem(`test_responses_${TEST_SEQUENCE[currentTest]}`);
      sessionStorage.removeItem(`test_time_${TEST_SEQUENCE[currentTest]}`);
      
      console.log('Test submitted successfully, showing confirmation');
      setShowConfirmation(true);
  
    } catch (error) {
      console.error('Error in test submission:', error);
      setSubmissionError(error.message || 'Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, testData, TEST_SEQUENCE, currentTest, timeRemaining, responses]);

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

  if (!testData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-xl text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DebugSessionStorage />
      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center m-4">
            <h2 className="text-2xl font-bold mb-4">Test Submitted</h2>
            <p className="text-gray-600 mb-6">
              You've completed the {TEST_SEQUENCE[currentTest]} test. 
              {submissionError ? (
                <span className="text-red-600 block mt-2">
                  Warning: {submissionError}
                </span>
              ) : 'Please wait for the instructor before proceeding to the next test.'}
            </p>
            <div className="flex space-x-4 justify-center">
              {!submissionError && (
                <button
                  onClick={moveToNextTest}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                  disabled={isSubmitting}
                >
                  {currentTest < TEST_SEQUENCE.length - 1 ? 'Start Next Test' : 'Complete Testing'}
                </button>
              )}
              {submissionError && (
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSubmissionError('');
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
                >
                  Return to Test
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Test Interface */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {TEST_SEQUENCE[currentTest]} Test
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {currentTest + 1} of {TEST_SEQUENCE.length}
              </p>
            </div>
            <div className={`text-lg font-medium ${
              timerWarning ? 'text-red-600' : 'text-gray-900'
            }`}>
              Time Remaining: {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Warning */}
      {timerWarning && timeRemaining > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Warning: Less than 5 minutes remaining!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            <button
              onClick={submitTest}
              disabled={isSubmitting}
              className={`bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}