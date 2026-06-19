import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Carbon Chat',
};

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      <Navbar userName={session.user.name} />

      <main id="main-content" className="flex-1 pt-16 flex flex-col">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 flex flex-col flex-1 py-6">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-white">Carbon Chat</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Describe your day — Groq AI extracts carbon from natural language
            </p>
          </div>

          {/* Chat container */}
          <div
            className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
            style={{ minHeight: '600px' }}
          >
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
}
