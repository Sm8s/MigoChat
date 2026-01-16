'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import { updateUserStatus } from '@/lib/migo-logic';
import Sidebar from '@/components/Sidebar';
import FriendsList from '@/components/FriendsList';
import AddFriendModal from '@/components/AddFriendModal';

interface UserSession {
  user: { id: string; email?: string; };
}

// Neue Typen für die erweiterten Funktionen
type MainView = 'friends' | 'discover' | 'nitro' | 'activity';

export default function ChatPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending'>('online');
  const [currentView, setCurrentView] = useState<MainView>('friends');
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const router = useRouter();

  const handleStatusUpdate = useCallback(async (userId: string, status: 'online' | 'offline') => {
    if (!userId) return;
    try { await updateUserStatus(userId, status); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) { router.push('/login'); return; }
      if (mounted) {
        setSession(currentSession as UserSession);
        setLoading(false);
        await handleStatusUpdate(currentSession.user.id, 'online');
      }
    };
    getSession();
    return () => { mounted = false; };
  }, [router, handleStatusUpdate]);

  if (loading) return (
    <div className="h-screen bg-[#111214] flex flex-col items-center justify-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
      </div>
      <div className="text-indigo-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Initializing Migo</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#111214] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Markellose Sidebar */}
      <Sidebar
        currentUserId={session!.user.id}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Container mit edlem Radius */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#313338] md:my-2 md:mr-2 md:rounded-[24px] shadow-2xl border border-white/5 overflow-hidden">
        
        {/* High-End Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-[#313338]/95 backdrop-blur-md border-b border-white/5 z-20 shrink-0">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white text-xl">☰</button>
            
            <div className="flex items-center gap-3 pr-4 border-r border-white/10 shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
              <span className="font-bold tracking-tight">Migo Dashboard</span>
            </div>
            
            {/* Main Navigation Buttons */}
            <nav className="flex items-center gap-1">
              {[
                { id: 'friends', label: 'Freunde', icon: '👥' },
                { id: 'discover', label: 'Entdecken', icon: '🌍' },
                { id: 'nitro', label: 'Migo Nitro', icon: '💎' },
                { id: 'activity', label: 'Aktivität', icon: '📊' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setCurrentView(btn.id as MainView)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    currentView === btn.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <span>{btn.icon}</span> {btn.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Schnellsuche..." 
                className="bg-[#1e1f22] border border-transparent focus:border-indigo-500/50 rounded-lg py-1.5 px-3 text-xs w-40 focus:w-60 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="absolute right-3 top-1.5 text-[10px] text-gray-600 font-bold group-focus-within:hidden">ALT+S</span>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#248046] hover:bg-[#1a6334] text-white text-[11px] font-black uppercase tracking-widest py-2 px-4 rounded-lg shadow-lg active:scale-95 transition-all"
            >
              Hinzufügen
            </button>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 flex overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-6 relative bg-gradient-to-br from-transparent to-black/5">
            <div className="max-w-6xl mx-auto space-y-6">
              
              {/* Conditional Rendering der Seiten */}
              {currentView === 'friends' && (
                <>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-black tracking-tighter">Deine Kontakte</h2>
                    <div className="flex bg-[#1e1f22] p-1 rounded-lg">
                      {['online', 'all', 'pending'].map((t) => (
                        <button 
                          key={t}
                          onClick={() => setActiveTab(t as any)}
                          className={`px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#3f4147] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#2b2d31]/40 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden min-h-[400px]">
                    <FriendsList currentUserId={session!.user.id} filter={activeTab} />
                  </div>
                </>
              )}

              {currentView === 'discover' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="group bg-[#2b2d31] rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all">
                      <div className="h-24 bg-indigo-900/50 relative">
                        <div className="absolute top-4 right-4 bg-black/40 px-2 py-1 rounded text-[10px] font-bold">TOP COMMUNITY</div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-white mb-1">Migo Community #{i}</h3>
                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">Tritt dieser exklusiven Gruppe bei und entdecke neue Leute.</p>
                        <button className="w-full py-2 bg-white/5 hover:bg-indigo-600 text-xs font-bold rounded-lg transition-all">Beitreten</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentView === 'nitro' && (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
                  <div className="text-6xl mb-6">💎</div>
                  <h2 className="text-3xl font-black tracking-tighter mb-2 italic">MIGO NITRO</h2>
                  <p className="text-gray-400 max-w-md mb-8">Schalte exklusive Badges, größere Uploads und HD-Streaming frei. Werde Teil der Elite.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl hover:scale-105 transition-all cursor-pointer">
                      <h3 className="text-xl font-bold mb-1">Monthly</h3>
                      <div className="text-3xl font-black mb-4">9,99€</div>
                      <button className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl">Abonnieren</button>
                    </div>
                    <div className="p-8 bg-[#2b2d31] rounded-3xl border border-white/10 hover:border-indigo-500 transition-all cursor-pointer">
                      <h3 className="text-xl font-bold mb-1 text-gray-300">Yearly</h3>
                      <div className="text-3xl font-black mb-4">99,99€</div>
                      <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">Sparen & Abonnieren</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity Sidebar (Andere Liga) */}
          <aside className="w-80 border-l border-white/5 hidden xl:flex flex-col p-6 bg-[#2b2d31]/30 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Live Status</h3>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'System', text: 'Migo-Server stabil (99.9%)', time: 'Now', color: 'text-green-400' },
                { name: 'Updates', text: 'Neues UI-Update eingespielt.', time: '2m', color: 'text-indigo-400' }
              ].map((log, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#1e1f22]/50 border border-white/5 hover:bg-[#1e1f22] transition-all group">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${log.color}`}>{log.name}</span>
                    <span className="text-[10px] text-gray-600">{log.time}</span>
                  </div>
                  <p className="text-[12px] text-gray-300 leading-snug">{log.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
              <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Wusstest du schon?</p>
              <p className="text-[10px] text-gray-500">Du kannst jetzt Freunde über den Migo-Tag weltweit finden.</p>
            </div>
          </aside>
        </main>
      </div>

      {/* Modal Integration */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-[8px] p-4">
          <div className="w-full max-w-md bg-[#313338] rounded-[24px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 bg-[#2b2d31]">
              <h2 className="text-white font-black text-sm uppercase tracking-widest">Connect People</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all">✕</button>
            </div>
            <div className="p-8">
              <AddFriendModal currentUserId={session!.user.id} onSuccess={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}