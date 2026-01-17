import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0c] text-gray-300 flex items-center justify-center">
          <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">Loading messages…</div>
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
