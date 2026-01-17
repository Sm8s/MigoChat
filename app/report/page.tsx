"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Report Page
 *
 * Allows users to report a post, message or user. This form sends
 * reports to the `reports` table. For now the page only shows a
 * placeholder form without actual submission. Later, integrate with
 * supabase to insert into the reports table and handle moderation.
 */
export default function ReportPage() {
  const [session, setSession] = useState<any>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (!error) setSession(currentSession);
    };
    loadSession();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Report submitted: ' + reason);
    setReason('');
  };

  if (!session) {
    return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-gray-400">
        Lade ...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans overflow-hidden">
      <Sidebar currentUserId={session.user.id} mobileOpen={false} onCloseMobile={() => {}} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f22] md:my-2 md:mr-2 md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.03] overflow-hidden relative">
        <header className="h-20 flex items-center px-10 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03]">
          <h1 className="text-3xl font-black uppercase tracking-widest">Melden</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-lg mx-auto">
            <p className="text-gray-400 mb-6">Wenn du einen Benutzer, Post oder eine Nachricht melden möchtest, fülle das folgende Formular aus. Wir kümmern uns schnellstmöglich darum.</p>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl">
              <label className="block text-gray-200 font-medium mb-1">Grund der Meldung</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full bg-[#2b2d31] border border-[#3a3b3e] p-3 text-gray-200 rounded-xl"
                required
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-sm tracking-widest mt-2"
              >
                Absenden
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}