"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Trending Page
 *
 * Lists posts sorted by a trending score. In the future this page
 * should query the database view `v_trending_posts` or the table
 * `post_scores` to determine trending posts. For now we display
 * placeholder content.
 */
export default function TrendingPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (!error) setSession(currentSession);
    };
    loadSession();
  }, []);

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
          <h1 className="text-3xl font-black uppercase tracking-widest">Trending</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-400 mb-6">Die beliebtesten Posts basierend auf Likes, Kommentaren, Reposts und der Zeit.</p>
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl shadow hover:bg-white/[0.03] transition-colors"
                >
                  <p className="text-gray-200 font-semibold mb-1">Trending Post {i + 1}</p>
                  <p className="text-gray-500 text-sm">Dieser Post ist ein Platzhalter für das Trending‑Feed. Später wird er aus der Datenbank geladen.</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}