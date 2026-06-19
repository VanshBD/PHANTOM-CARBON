'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage, CarbonExtraction } from '@/types';

const EXAMPLE_PROMPTS = [
  'I drove 25km to work today in my petrol car',
  'Had a beef burger and a latte for lunch',
  'Ordered new headphones online for ₹3500',
  'Watched Netflix for 3 hours and ordered food delivery',
  'Took a 2-hour domestic flight',
];

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/carbon/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), inputType: 'CHAT' }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to analyze');
      }

      const extraction: CarbonExtraction = json.data.extraction;
      const summary = extraction.summary ?? 'Here is the carbon breakdown for your activities.';

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: summary,
        extraction,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Announce to screen readers
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `Carbon analysis complete. Total: ${extraction.totalCarbon.toFixed(2)} kg CO2e`;
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error && err.message.includes('Rate limit')
          ? 'Rate limit reached. Please wait a moment before sending another message.'
          : 'Unable to analyze right now. Please try again.';

      setError(errorMsg);

      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Screen reader live region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4"
        role="log"
        aria-label="Chat conversation"
        aria-live="polite"
      >
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="text-5xl mb-4 float-animation" aria-hidden="true">👻</div>
            <h2 className="text-xl font-bold text-white mb-2">Detect your phantom carbon</h2>
            <p className="text-gray-500 text-sm max-w-sm mb-8">
              Just describe your activities in plain language. No forms, no checkboxes.
            </p>

            <div className="w-full max-w-sm space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3">Try an example</p>
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left text-sm text-gray-400 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:ring-green-500"
                  aria-label={`Example: ${prompt}`}
                >
                  <span className="text-green-600 mr-2" aria-hidden="true">→</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex justify-start" aria-live="polite" aria-label="Analyzing your carbon footprint">
            <div className="w-8 h-8 rounded-full bg-green-900/50 border border-green-700/50 flex items-center justify-center flex-shrink-0 mr-2 mt-1" aria-hidden="true">
              <span>👻</span>
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 max-w-48">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="animate-spin text-green-500" aria-hidden="true">⚡</span>
                Analyzing…
              </div>
              <div className="mt-2 space-y-1">
                <div className="h-2 bg-gray-700 rounded animate-pulse w-32" />
                <div className="h-2 bg-gray-700 rounded animate-pulse w-24" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mx-4 mb-2 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-400 flex items-center gap-2"
        >
          <span aria-hidden="true">⚠️</span>
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-800">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          aria-label="Send carbon activity message"
          className="flex items-end gap-3"
        >
          <div className="flex-1 relative">
            <label htmlFor="chat-input" className="sr-only">
              Describe your carbon-generating activities
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your activities… (Enter to send, Shift+Enter for new line)"
              rows={2}
              disabled={isLoading}
              aria-disabled={isLoading}
              aria-label="Describe your carbon activities"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none focus-visible:ring-2 focus-visible:ring-green-500 focus:border-green-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message and analyze carbon footprint"
            aria-busy={isLoading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl p-3 transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a] flex-shrink-0"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" aria-hidden="true" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-700 mt-2 text-center">
          Powered by Groq AI · Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
