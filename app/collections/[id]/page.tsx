"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Collection Detail Page
 *
 * Shows the posts contained in a particular collection. The page reads
 * the collection ID from the route parameters. This is currently a
 * placeholder that will later retrieve the collection's metadata and
 * posts from Supabase.
 */
export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = params?.id as string;
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
          <h1 className="text-3xl font-black uppercase tracking-widest">Collection {collectionId}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-gray-400 mb-6">Hier werden die gespeicherten Posts für diese Collection angezeigt.</p>
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl shadow hover:bg-white/[0.03] transition-colors"
                >
                  <p className="text-gray-200 font-semibold mb-1">Beispiel Post {i + 1}</p>
                  <p className="text-gray-500 text-sm">Placeholder für den Inhalt des Posts.</p>
                  <button className="mt-2 text-indigo-400 text-xs hover:underline">
                    Aus Collection entfernen
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}