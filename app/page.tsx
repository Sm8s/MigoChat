'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import { updateUserStatus } from '@/lib/migo-logic';
import Sidebar from '@/components/Sidebar';
import FriendsList from '@/components/FriendsList';
import AddFriendModal from '@/components/AddFriendModal';

// Definition eines Interfaces für bessere Typensicherheit
interface UserSession {
  user: {
    id: string;
    email?: string;
  };
}

export default function ChatPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending'>('online');
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  // Status-Update Funktion (verhindert Fehler durch fehlende IDs)
  const handleStatusUpdate = useCallback(async (userId: string, status: 'online' | 'offline') => {
    if (!userId) return;
    try {
      await updateUserStatus(userId, status);
    } catch (err) {
      console.error("Status-Update fehlgeschlagen:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error || !currentSession) {
        router.push('/login');
        return;
      }

      if (mounted) {
        setSession(currentSession as UserSession);
        setLoading(false);
        // User beim Einloggen online setzen
        await handleStatusUpdate(currentSession.user.id, 'online');
      }
    };

    getSession();

    const handleTabClose = () => {
      if (session?.user?.id) {
        handleStatusUpdate(session.user.id, 'offline');
      }
    };

    window.addEventListener('beforeunload', handleTabClose);
    
    return () => {
      mounted = false;
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [router, handleStatusUpdate, session?.user?.id]);

  // WICHTIG: Verhindert Prerendering-Fehler auf Vercel
  if (loading) {
    return (
      <div className="h-screen bg-[#1e1f22] flex flex-col items-center justify-center text-white">
        <div className="animate-pulse text-2xl font-black tracking-tighter mb-4 italic uppercase">MIGOCHAT</div>
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="bg-indigo-500 h-full animate-progress shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        </div>
      </div>
    );
  }
  
  // Rendert erst, wenn die Session sicher existiert
  if (!session?.user?.id) return null;

  return (
    <div className="flex h-screen bg-[#313338] overflow-hidden font-sans select-none text-rendering-optimizeLegibility">
      {/* Übergabe der ID an Sidebar */}
      <Sidebar currentUserId={session.user.id} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 shadow-md bg-[#313338] shrink-0 z-10">
          <div className="flex items-center gap-4 text-gray-400 font-medium text-sm">
            <div className="flex items-center gap-2 text-white border-r border-gray-700 pr-4">
              <span className="text-gray-500 text-xl font-light">@</span>
              <span className="font-bold tracking-wide">Freunde</span>
            </div>
            
            <nav className="flex gap-1">
              {[
                { id: 'online', label: 'Online' },
                { id: 'all', label: 'Alle' },
                { id: 'pending', label: 'Ausstehend' }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1 rounded-md transition-all duration-200 font-semibold ${
                    activeTab === tab.id 
                    ? 'bg-[#3f4147] text-white shadow-inner' 
                    : 'hover:bg-[#393c41] hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'pending' && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">!</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#248046] hover:bg-[#1a6334] active:bg-[#14522b] text-white text-xs font-bold py-1.5 px-3 rounded shadow-lg transition-all active:scale-95"
          >
            Freund hinzufügen
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-[#313338] relative">
            <FriendsList 
               currentUserId={session.user.id} 
               filter={activeTab} 
            />
          </div>

          <aside className="w-80 border-l border-gray-800 hidden xl:flex flex-col p-4 bg-[#313338]">
            <h3 className="text-white font-black mb-4 tracking-wider text-[11px] uppercase opacity-70">Aktivität</h3>
            <div className="space-y-3">
              <div className="bg-[#2b2d31] p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-all cursor-default">
                <p className="text-white text-[13px] font-bold mb-1">Zurzeit ist es ruhig...</p>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Wenn deine Freunde aktiv sind, siehst du das hier in Echtzeit!
                </p>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-[4px] p-4">
          <div className="w-full max-w-md bg-[#313338] rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-[#2b2d31]">
              <h2 className="text-white font-bold text-base uppercase tracking-tight">Freund hinzufügen</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {/* Prop-Korrektur: currentUserId statt session direkt */}
              <AddFriendModal 
                currentUserId={session.user.id} 
                onSuccess={() => setShowAddModal(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}