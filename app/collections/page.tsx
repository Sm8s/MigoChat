"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Collections List Page
 *
 * Displays all of a user's bookmark collections. In a future
 * implementation, this will load collections from the `collections` table
 * and allow users to create, rename or delete them. Each collection
 * links to a dedicated page showing its posts.
 */
export default function CollectionsPage() {
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
        <header className="h-20 flex items-center justify-between px-10 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03]">
          <h1 className="text-3xl font-black uppercase tracking-widest">Collections</h1>
          {/* In a future iteration, provide a button to create new collections */}
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest py-2 px-4 rounded-2xl shadow">
            Neu erstellen
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Deine Collections</h2>
            <p className="text-gray-400 mb-8">Collections sind Ordner für deine gespeicherten Posts. Diese Seite wird die Collections aus der Datenbank laden.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <a
                  key={i}
                  href={`/collections/${i + 1}`}
                  className="block bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl shadow hover:bg-white/[0.03] transition-colors"
                >
                  <p className="text-gray-200 font-semibold mb-1">Collection {i + 1}</p>
                  <p className="text-gray-500 text-sm">0 Posts</p>
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}