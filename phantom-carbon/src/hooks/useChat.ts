'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, CarbonExtraction } from '@/types';

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setIsLoading(true);

    try {
      const res = await fetch('/api/carbon/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), inputType: 'CHAT' }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to extract');

      const extraction: CarbonExtraction = json.data.extraction;
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: extraction.summary ?? 'Here is the carbon breakdown for your activities.',
        extraction,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { id: generateId(), role: 'assistant', content: msg, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
