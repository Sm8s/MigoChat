'use client';

import { useRouter } from 'next/navigation';

export default function MessagesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#313338] text-white">
      <header className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 bg-[#313338]">
        <div className="font-bold tracking-wide">Nachrichten</div>
        <button onClick={() => router.push('/')} className="text-sm text-gray-300 hover:text-white">
          Zurück
        </button>
      </header>

      <main className="p-6 text-gray-300">
        <div className="max-w-xl bg-[#2b2d31] border border-gray-800 rounded-xl p-5">
          <div className="font-bold text-white mb-2">Coming soon</div>
          <div className="text-sm text-gray-400">
            Hier kommen Direktnachrichten rein (Threads, Requests, etc.).
          </div>
        </div>
      </main>
    </div>
  );
}
