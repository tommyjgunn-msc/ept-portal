// components/EnhancedWritingArea.js — Pretext-style distraction-free writing experience
import { useState, useEffect, useRef, useCallback } from 'react';

const FONT_OPTIONS = [
  { label: 'Sans Serif', value: 'ui-sans-serif, system-ui, -apple-system, sans-serif', key: 'sans' },
  { label: 'Serif', value: 'Georgia, Cambria, "Times New Roman", Times, serif', key: 'serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace', key: 'mono' },
];

export default function EnhancedWritingArea({ value = '', onChange, wordLimit, promptTitle }) {
  const [text, setText] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef(value);

  // Word / character / paragraph counts
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const charCount = text.length;
  const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || (text.trim() ? 1 : 0);
  const isOverLimit = wordLimit && wordCount > parseInt(wordLimit);

  // Auto-save with debounce
  useEffect(() => {
    if (text === lastSavedRef.current) {
      setSaveStatus('saved');
      return;
    }
    setSaveStatus('unsaved');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      onChange(text);
      lastSavedRef.current = text;
      setTimeout(() => setSaveStatus('saved'), 400);
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [text, onChange]);

  // Sync external value changes
  useEffect(() => {
    if (value !== text && value !== lastSavedRef.current) {
      setText(value);
      lastSavedRef.current = value;
    }
  }, [value]);

  // Undo/redo support
  const handleTextChange = useCallback((e) => {
    const newText = e.target.value;
    setUndoStack(prev => [...prev.slice(-50), text]);
    setRedoStack([]);
    setText(newText);
  }, [text]);

  const handleKeyDown = useCallback((e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      setUndoStack(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        setRedoStack(r => [...r, text]);
        setText(last);
        return prev.slice(0, -1);
      });
    }

    if (mod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
      e.preventDefault();
      setRedoStack(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        setUndoStack(u => [...u, text]);
        setText(last);
        return prev.slice(0, -1);
      });
    }

    // Tab inserts spaces instead of moving focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newText = text.substring(0, start) + '    ' + text.substring(end);
      setText(newText);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      });
    }
  }, [text]);

  const saveIndicator = {
    saved: { text: 'Saved', color: 'text-green-500' },
    saving: { text: 'Saving...', color: 'text-amber-500' },
    unsaved: { text: 'Unsaved changes', color: 'text-gray-400' },
  };

  return (
    <div className={`relative transition-all duration-500 ${isFocused ? 'ring-2 ring-indigo-200' : ''} rounded-xl overflow-hidden`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 transition-opacity duration-300 ${isFocused ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center space-x-3">
          {/* Font selector */}
          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-0.5">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.key}
                type="button"
                onClick={() => setSelectedFont(font)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                  selectedFont.key === font.key
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
            <button
              type="button"
              onClick={() => {
                setUndoStack(prev => {
                  if (prev.length === 0) return prev;
                  setRedoStack(r => [...r, text]);
                  setText(prev[prev.length - 1]);
                  return prev.slice(0, -1);
                });
              }}
              disabled={undoStack.length === 0}
              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Undo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setRedoStack(prev => {
                  if (prev.length === 0) return prev;
                  setUndoStack(u => [...u, text]);
                  setText(prev[prev.length - 1]);
                  return prev.slice(0, -1);
                });
              }}
              disabled={redoStack.length === 0}
              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
              title="Redo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Save indicator */}
        <div className={`flex items-center space-x-1.5 text-xs ${saveIndicator[saveStatus].color}`}>
          {saveStatus === 'saving' && (
            <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          )}
          {saveStatus === 'saved' && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{saveIndicator[saveStatus].text}</span>
        </div>
      </div>

      {/* Writing area */}
      <div className="relative bg-[#FAFAF9]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Begin writing your response here..."
          className="w-full min-h-[400px] p-8 md:p-12 bg-transparent border-0 resize-y focus:ring-0 focus:outline-none placeholder-gray-300"
          style={{
            fontFamily: selectedFont.value,
            fontSize: '1.05rem',
            lineHeight: '1.85',
            letterSpacing: '0.01em',
            caretColor: '#6366f1',
          }}
        />

        {/* Subtle page edge effect */}
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-gray-200 to-transparent opacity-50" style={{ left: '2.5rem' }} />
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs">
        <div className="flex items-center space-x-4 text-gray-500">
          <span>
            <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-700'}`}>{wordCount}</span>
            {wordLimit && <span className="text-gray-400"> / {wordLimit}</span>} words
          </span>
          <span className="text-gray-300">|</span>
          <span><span className="font-medium text-gray-700">{charCount}</span> characters</span>
          <span className="text-gray-300">|</span>
          <span><span className="font-medium text-gray-700">{paragraphCount}</span> paragraph{paragraphCount !== 1 ? 's' : ''}</span>
        </div>

        {isOverLimit && (
          <span className="text-red-600 font-medium animate-pulse">
            Over word limit by {wordCount - parseInt(wordLimit)}
          </span>
        )}
      </div>
    </div>
  );
}
