"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Stories Page
 *
 * This page displays a simple placeholder for the stories feature. The
 * actual implementation of story creation, viewing and expiration logic
 * should be added later. For now we just render a list of dummy
 * stories and a basic upload form. The layout mirrors other pages in
 * the app and keeps the premium dark‑glass styling consistent.
 */
export default function StoriesPage() {
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
      {/* Sidebar navigation */}
      <Sidebar currentUserId={session.user.id} mobileOpen={false} onCloseMobile={() => {}} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f22] md:my-2 md:mr-2 md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.03] overflow-hidden relative">
        <header className="h-20 flex items-center px-10 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03]">
          <h1 className="text-3xl font-black uppercase tracking-widest">Stories</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Deine Stories</h2>
            <p className="text-gray-400 mb-8">Hier erscheinen deine eigenen Stories und die deiner Freunde. Die Stories‑Funktion erlaubt das Hochladen von Bildern oder Videos, die nach 24 Stunden verschwinden.</p>
            {/* Placeholder list of stories */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative bg-white/[0.03] border border-white/[0.05] rounded-3xl p-4 h-40 flex items-center justify-center text-gray-500">
                  <span>Story {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}