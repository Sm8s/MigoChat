'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';
import FriendsList from '@/components/FriendsList';
import AddFriendModal from '@/components/AddFriendModal';

export default function ChatPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Erweitertes Tab-System
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/login');
      } else {
        setSession(currentSession);
        
        // Presence-Update: Setzt User beim Betreten automatisch auf online
        await supabase.from('profiles')
          .update({ status: 'online' })
          .eq('id', currentSession.user.id);
      }
      setLoading(false);
    };
    getSession();

    // Optional: Offline-Status beim Schließen des Tabs (über Supabase Realtime besser lösbar)
  }, [router]);

  if (loading) return <div className="h-screen bg-[#1e1f22] flex items-center justify-center text-white font-bold">MigoChat wird geladen...</div>;
  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#313338] overflow-hidden font-sans">
      {/* Layout-Struktur: Linke Sidebar (Navigation & Profil) */}
      <Sidebar currentUserId={session.user.id} />

      {/* Hauptbereich */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Bar: Design näher an Discord/Instagram */}
        <header className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-sm bg-[#313338] shrink-0">
          <div className="flex items-center gap-4 text-gray-400 font-medium text-sm">
            <div className="flex items-center gap-2 text-white border-r border-gray-700 pr-4">
              <span className="text-gray-500 text-xl">@</span>
              Freunde
            </div>
            
            {/* Tab-System: Wechsel zwischen Online, Alle und Anfragen */}
            <nav className="flex gap-2">
              <button 
                onClick={() => setActiveTab('online')}
                className={`px-3 py-1 rounded-md transition ${activeTab === 'online' ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-gray-200'}`}
              >
                Online
              </button>
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md transition ${activeTab === 'all' ? 'bg-gray-700 text-white' : 'hover:bg-gray-800 hover:text-gray-200'}`}
              >
                Alle
              </button>
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1 rounded-md transition ${activeTab === 'pending' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-800 hover:text-gray-200'}`}
              >
                Anfragen
              </button>
            </nav>
          </div>

          {/* Add-Friend Integration */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-bold py-1.5 px-3 rounded transition-all"
          >
            Freund hinzufügen
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#313338]">
            {/* Die FriendsList übernimmt hier die Filterung basierend auf dem activeTab */}
            <FriendsList currentUserId={session.user.id} />
          </div>

          {/* Activity-Sidebar: Bereich für Gaming/Lernen/Musik */}
          <aside className="w-80 border-l border-gray-800 hidden xl:flex flex-col p-4 bg-[#313338]">
            <h3 className="text-white font-black mb-4 tracking-wider text-xs uppercase">Aktivität</h3>
            <div className="bg-[#2b2d31] p-4 rounded-xl border border-transparent hover:border-gray-700 transition duration-200">
              <p className="text-white text-sm font-bold mb-1">Zurzeit ist es ruhig...</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Wenn deine Freunde anfangen zu zocken, zu lernen oder Musik zu hören, siehst du es hier!
              </p>
            </div>
          </aside>
        </main>
      </div>

      {/* Modal für Freund hinzufügen: MigoTag Suche */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#313338] rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-white font-bold">Freund hinzufügen</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-4">
              <AddFriendModal currentUserId={session.user.id} />
              <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">
                Du kannst Freunde mit ihrem MigoTag adden. (z.B. Name#1234)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}