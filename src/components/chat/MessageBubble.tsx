import { CarbonExtractBadge } from './CarbonExtractBadge';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
      role="article"
      aria-label={`${isUser ? 'Your message' : 'AI response'} at ${new Date(message.timestamp).toLocaleTimeString()}`}
    >
      {/* Avatar — AI only */}
      {!isUser && (
        <div
          className="w-8 h-8 rounded-full bg-green-900/50 border border-green-700/50 flex items-center justify-center flex-shrink-0 mr-2 mt-1"
          aria-hidden="true"
        >
          <span className="text-sm">👻</span>
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? 'ml-12' : 'mr-12'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-green-700 text-white rounded-br-sm'
              : 'bg-gray-800 text-gray-100 rounded-bl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Carbon extraction badge — shown on AI responses that have extraction data */}
        {!isUser && message.extraction && message.extraction.totalCarbon > 0 && (
          <CarbonExtractBadge extraction={message.extraction} />
        )}

        {/* Timestamp */}
        <p className={`text-xs text-gray-600 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {new Date(message.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </p>
      </div>
    </div>
  );
}
