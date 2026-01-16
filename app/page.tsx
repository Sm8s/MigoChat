'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import { updateUserStatus } from '@/lib/migo-logic'; // Nutzt die neue Logik-Funktion
import Sidebar from '@/components/Sidebar';
import FriendsList from '@/components/FriendsList';
import AddFriendModal from '@/components/AddFriendModal';

export default function ChatPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending'>('online'); // Standard auf Online
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  // Status-Update Funktion für sauberen Aufruf
  const handleStatusUpdate = useCallback(async (userId: string, status: 'online' | 'offline') => {
    await updateUserStatus(userId, status);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        router.push('/login');
      } else {
        setSession(currentSession);
        // Initial online setzen
        await handleStatusUpdate(currentSession.user.id, 'online');
      }
      setLoading(false);
    };
    getSession();

    // Browser-Tab schließen Cleanup
    const handleTabClose = () => {
      if (session?.user?.id) {
        handleStatusUpdate(session.user.id, 'offline');
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [router, handleStatusUpdate, session?.user?.id]);

  if (loading) return (
    <div className="h-screen bg-[#1e1f22] flex flex-col items-center justify-center text-white">
      <div className="animate-pulse text-2xl font-black tracking-tighter mb-4">MIGOCHAT</div>
      <div className="text-gray-400 text-sm">Lade deine Welt...</div>
    </div>
  );
  
  if (!session) return null;

  return (
    <div className="flex h-screen bg-[#313338] overflow-hidden font-sans select-none">
      {/* Linke Sidebar: Navigation & Profil */}
      <Sidebar currentUserId={session.user.id} />

      {/* Hauptbereich */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Bar */}
        <header className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-md bg-[#313338] shrink-0 z-10">
          <div className="flex items-center gap-4 text-gray-400 font-medium text-sm">
            <div className="flex items-center gap-2 text-white border-r border-gray-700 pr-4">
              <span className="text-gray-500 text-xl font-light">@</span>
              <span className="font-bold">Freunde</span>
            </div>
            
            <nav className="flex gap-1">
              {[
                { id: 'online', label: 'Online' },
                { id: 'all', label: 'Alle' },
                { id: 'pending', label: 'Ausstehend' } // Geändert für besseres UI-Wording
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 rounded-md transition-all duration-200 ${
                    activeTab === tab.id 
                    ? 'bg-[#3f4147] text-white' 
                    : 'hover:bg-[#393c41] hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#248046] hover:bg-[#1a6334] text-white text-xs font-bold py-1.5 px-3 rounded shadow-sm transition-transform active:scale-95"
          >
            Freund hinzufügen
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#313338]">
            {/* Filter-Prop an FriendsList übergeben für Tab-Logik */}
            <FriendsList currentUserId={session.user.id} filter={activeTab} />
          </div>

          {/* Activity-Sidebar: Dynamischer Bereich */}
          <aside className="w-80 border-l border-gray-800 hidden xl:flex flex-col p-4 bg-[#313338]">
            <h3 className="text-white font-black mb-4 tracking-wider text-[11px] uppercase opacity-90">Aktivität</h3>
            <div className="space-y-3">
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-transparent hover:border-gray-700 transition-all group">
                <p className="text-white text-[13px] font-bold mb-1 group-hover:text-indigo-400 transition-colors">
                  Zurzeit ist es ruhig...
                </p>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Sobald deine Freunde zocken, lernen oder Musik hören, erscheint ihre Aktivität hier!
                </p>
              </div>
              
              {/* Optionaler Placeholder für "Eigene Aktivität setzen" */}
              <button className="w-full py-2 border border-dashed border-gray-700 rounded-lg text-gray-500 text-[11px] hover:border-gray-500 hover:text-gray-400 transition-all">
                + Status-Aktivität setzen
              </button>
            </div>
          </aside>
        </main>
      </div>

      {/* Modal für Freund hinzufügen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-[2px] p-4 transition-opacity">
          <div className="w-full max-w-md bg-[#313338] rounded-lg shadow-2xl border border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-[#1e1f22]">
              <h2 className="text-white font-bold text-base">Freund hinzufügen</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-[#2b2d31]">
              <AddFriendModal currentUserId={session.user.id} onSuccess={() => setShowAddModal(false)} />
              <div className="mt-4 p-3 bg-[#1e1f22] rounded border border-gray-800">
                <p className="text-[10px] text-gray-400 leading-tight">
                  TIPP: MigoTags unterscheiden zwischen Groß- und Kleinschreibung beim Teil nach der Raute.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}