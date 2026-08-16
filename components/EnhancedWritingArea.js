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
    saved: { text: 'Saved', color: 'text-ftm-green' },
    saving: { text: 'Saving', color: 'text-ftm-mut' },
    unsaved: { text: 'Not yet saved', color: 'text-ftm-dim' },
  };

  // The writing surface stays paper on a dark page: a warm off-white sheet the
  // candidate writes on, framed by the exam chrome. What went was the ornament
  // around it — a focus glow, a rounded frame, a decorative gradient "page
  // edge", a tick icon on the save state, a pulsing over-limit warning, and an
  // indigo caret that was the only purple left in the product.
  return (
    <div className="border border-ftm-line2">
      {/* Toolbar. It no longer fades to 60% while you type — a control that
          hides itself when you are using the thing it controls is a puzzle. */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-ftm-bar border-b border-ftm-line">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <span className="font-inter text-[11px] tracking-[.12em] uppercase text-ftm-dim mr-2">Typeface</span>
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.key}
                type="button"
                onClick={() => setSelectedFont(font)}
                aria-pressed={selectedFont.key === font.key}
                className={`px-2.5 py-1 font-inter text-[12px] transition-colors ${
                  selectedFont.key === font.key
                    ? 'bg-ftm-up text-ftm-ink font-semibold'
                    : 'text-ftm-mut hover:text-ftm-ink'
                }`}
              >
                {font.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-ftm-line pl-5">
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
              className="px-2.5 py-1 font-inter text-[12px] text-ftm-mut hover:text-ftm-ink disabled:opacity-30 disabled:hover:text-ftm-mut transition-colors"
            >
              Undo
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
              className="px-2.5 py-1 font-inter text-[12px] text-ftm-mut hover:text-ftm-ink disabled:opacity-30 disabled:hover:text-ftm-mut transition-colors"
            >
              Redo
            </button>
          </div>
        </div>

        <output className={`font-inter text-[12px] font-semibold ${saveIndicator[saveStatus].color}`}>
          {saveIndicator[saveStatus].text}
        </output>
      </div>

      {/* Writing surface */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label={promptTitle ? `Your essay: ${promptTitle}` : 'Your essay'}
        placeholder="Start writing here."
        className="block w-full min-h-[460px] px-8 py-10 md:px-14 md:py-12 border-0 resize-y
                   bg-ftm-paper text-ftm-night placeholder-ftm-mutl focus:outline-none"
        style={{
          fontFamily: selectedFont.value,
          fontSize: '17px',
          lineHeight: '1.8',
          caretColor: '#C5132D',
          colorScheme: 'light',
        }}
      />

      {/* Counts. Tabular figures so the number does not jitter as you type. */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-ftm-bar border-t border-ftm-line">
        <p className="font-inter text-[12px] text-ftm-mut">
          <span className={`font-semibold tabular-nums ${isOverLimit ? 'text-ftm-ochre' : 'text-ftm-ink'}`}>
            {wordCount}
          </span>
          {wordLimit && <span className="text-ftm-dim tabular-nums"> of {wordLimit}</span>} words
          <span className="text-ftm-dim mx-2">&middot;</span>
          <span className="tabular-nums">{charCount}</span> characters
          <span className="text-ftm-dim mx-2">&middot;</span>
          <span className="tabular-nums">{paragraphCount}</span> paragraph{paragraphCount !== 1 ? 's' : ''}
        </p>

        {isOverLimit && (
          <p className="font-inter text-[12px] font-semibold text-ftm-ochre">
            <span className="tabular-nums">{wordCount - parseInt(wordLimit)}</span> words over the limit
          </p>
        )}
      </div>
    </div>
  );
}
