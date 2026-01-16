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

// "Migo Aura" als neuer Premium-Standard
type MainView = 'friends' | 'discover' | 'aura' | 'activity' | 'vault';

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
    <div className="h-screen bg-[#0a0a0c] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-[3px] border-indigo-500/10 rounded-full"></div>
        <div className="absolute inset-0 border-t-[3px] border-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-t-[3px] border-purple-500 rounded-full animate-spin-reverse opacity-50"></div>
      </div>
      <div className="text-white font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Syncing Aura System</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      <Sidebar
        currentUserId={session!.user.id}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f22] md:my-2 md:mr-2 md:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.03] overflow-hidden relative">
        
        {/* Navigation Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03] z-20 shrink-0">
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white">☰</button>
            
            <nav className="flex items-center gap-2">
              {[
                { id: 'friends', label: 'Hub', icon: '💎' },
                { id: 'discover', label: 'Explore', icon: '🪐' },
                { id: 'aura', label: 'Migo Aura', icon: '✨' },
                { id: 'vault', label: 'The Vault', icon: '🔐' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setCurrentView(btn.id as MainView)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    currentView === btn.id ? 'bg-white text-black shadow-xl shadow-white/10' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm">{btn.icon}</span> {btn.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex items-center gap-5">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Add Connection
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 relative scrollbar-hide">
            
            {/* View: FRIENDS */}
            {currentView === 'friends' && (
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black tracking-tighter">Your Network</h2>
                  <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/5">
                    {['online', 'all', 'pending'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#313338] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#2b2d31]/30 rounded-[40px] border border-white/[0.03] backdrop-blur-md overflow-hidden min-h-[500px] shadow-inner">
                  <FriendsList currentUserId={session!.user.id} filter={activeTab} />
                </div>
              </div>
            )}

            {/* View: MIGO AURA (Das "krasse" Verkaufs-Feature) */}
            {currentView === 'aura' && (
              <div className="max-w-5xl mx-auto py-10 animate-in zoom-in-95 duration-700">
                <div className="text-center mb-16">
                  <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.3em] border border-indigo-500/20">Elevate your Status</span>
                  <h1 className="text-6xl font-black tracking-tighter mt-6 mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent italic">MIGO AURA</h1>
                  <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed font-medium">Lass die Standard-User hinter dir. Aura ist kein Abo, es ist ein Upgrade deiner digitalen Existenz.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                  {[
                    { title: 'Ghost Mode', desc: 'Werde unsichtbar. Keine Read-Receipts, kein "Tippt gerade...", volle Kontrolle.', icon: '👻' },
                    { title: 'Aura Badges', desc: 'Exklusive, animierte Badges in deinem Profil, die auf deine Stimmung reagieren.', icon: '🛡️' },
                    { title: 'Ultra Streaming', desc: 'Übertrage in 4K bei 120 FPS ohne Verzögerung für deine gesamte Crew.', icon: '🎬' }
                  ].map((f, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-[32px] hover:bg-white/[0.05] transition-all group">
                      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-[1px] rounded-[40px] shadow-[0_20px_50px_rgba(79,70,229,0.3)]">
                  <div className="bg-[#0a0a0c] rounded-[40px] p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                      <h2 className="text-3xl font-black italic">ULTIMATE AURA</h2>
                      <p className="text-gray-400 text-sm mt-2 font-medium">Vollzugriff auf alle Features + Early Access.</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-4xl font-black">€8.99 <span className="text-sm text-gray-500 font-normal">/mo</span></div>
                      <button className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
                        Get Aura Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View: THE VAULT (Exklusives Bonus Feature) */}
            {currentView === 'vault' && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-1000">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-6 border border-white/10 shadow-2xl">🔐</div>
                <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">The Vault</h2>
                <p className="text-gray-500 max-w-sm text-xs font-medium leading-relaxed">
                  Dies ist dein privater, verschlüsselter Speicher. Nur für Aura-Mitglieder verfügbar. Sichere deine wichtigsten Dateien mit Ende-zu-Ende Verschlüsselung.
                </p>
                <button 
                  onClick={() => setCurrentView('aura')}
                  className="mt-8 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                >
                  Upgrade to unlock
                </button>
              </div>
            )}

          </div>

          {/* Activity Sidebar */}
          <aside className="w-80 border-l border-white/[0.03] hidden xl:flex flex-col p-8 bg-black/10 backdrop-blur-md">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-8">Pulse Feed</h3>
            
            <div className="space-y-6">
              {[
                { user: 'System', msg: 'Aura Servers Optimized', time: 'Now', color: 'bg-green-500' },
                { user: 'Dev-Team', msg: 'New "Ghost Mode" deployed', time: '14m', color: 'bg-indigo-500' }
              ].map((log, i) => (
                <div key={i} className="relative pl-6 border-l border-white/5 pb-2">
                  <div className={`absolute -left-[4px] top-0 w-2 h-2 rounded-full ${log.color} shadow-[0_0_10px_inherit]`}></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">{log.user}</span>
                    <span className="text-[9px] text-gray-600 font-bold">{log.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">{log.msg}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto p-6 bg-white/[0.02] border border-white/[0.05] rounded-[24px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">🔥</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Daily Streak</span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Du bist seit 12 Tagen aktiv. Aura-Mitglieder erhalten Bonus-Aura-Points!</p>
            </div>
          </aside>
        </main>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0a0c]/90 flex items-center justify-center z-[100] backdrop-blur-xl p-4">
          <div className="w-full max-w-md bg-[#1e1f22] rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 bg-white/[0.02]">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">New Connection</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white p-2">✕</button>
            </div>
            <div className="p-10">
              <AddFriendModal currentUserId={session!.user.id} onSuccess={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}