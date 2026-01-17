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

// Definition der funktionalen Ansichten
type MainView = 'hub' | 'explore' | 'aura' | 'vault';

export default function ChatPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'pending'>('online');
  const [currentView, setCurrentView] = useState<MainView>('hub');
  const [showAddModal, setShowAddModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const router = useRouter();

  const handleStatusUpdate = useCallback(async (userId: string, status: 'online' | 'offline') => {
    if (!userId) return;
    try { await updateUserStatus(userId, status); } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const getSessionAndProfile = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error || !currentSession) {
        router.push('/login');
        return;
      }
      // fetch profile to check if onboarding completed
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', currentSession.user.id)
        .maybeSingle();
      if (profileError) {
        router.push('/login');
        return;
      }
      // If missing username or display_name -> redirect to onboarding
      if (!profileData?.username || !profileData?.display_name) {
        router.push('/onboarding');
        return;
      }
      if (mounted) {
        setSession(currentSession as UserSession);
        setLoading(false);
        await handleStatusUpdate(currentSession.user.id, 'online');
      }
    };
    getSessionAndProfile();
    return () => {
      mounted = false;
    };
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

      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f22] md:my-2 md:mr-2 md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.03] overflow-hidden relative">
        
        {/* Navigation Header */}
        <header className="h-20 flex items-center justify-between px-10 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03] z-20 shrink-0">
          <div className="flex items-center gap-8">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-400 hover:text-white">☰</button>
            
            <nav className="flex items-center gap-3">
              {[
                { id: 'hub', label: 'Hub', icon: '💎' },
                { id: 'explore', label: 'Explore', icon: '🪐' },
                { id: 'aura', label: 'Migo Aura', icon: '✨' },
                { id: 'vault', label: 'The Vault', icon: '🔐' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setCurrentView(btn.id as MainView)}
                  className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    currentView === btn.id ? 'bg-white text-black shadow-2xl shadow-white/10 scale-105' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <span className="text-base">{btn.icon}</span> {btn.label}
                </button>
              ))}
            </nav>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="hidden lg:block bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-3 px-6 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            Add Connection
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
            
            {/* VIEW: HUB (Netzwerk & Freunde) */}
            {currentView === 'hub' && (
              <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-4xl font-black tracking-tighter italic">Your Network</h2>
                  <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                    {['online', 'all', 'pending'].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === t ? 'bg-[#313338] text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[#2b2d31]/30 rounded-[48px] border border-white/[0.04] backdrop-blur-3xl overflow-hidden min-h-[500px] shadow-2xl">
                  <FriendsList currentUserId={session!.user.id} filter={activeTab} />
                </div>
              </div>
            )}

            {/* VIEW: EXPLORE (Communities) */}
            {currentView === 'explore' && (
              <div className="max-w-6xl mx-auto animate-in slide-in-from-right-4 duration-700">
                <div className="mb-12">
                  <h2 className="text-4xl font-black tracking-tighter italic mb-2">Explore Worlds</h2>
                  <p className="text-gray-500 font-medium">Tritt exklusiven Migo-Zirkeln bei.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { name: 'Elite Developers', tag: 'DEV', members: '1.2k', icon: '⚡' },
                    { name: 'Aura Collectors', tag: 'GOLD', members: '840', icon: '🏆' },
                    { name: 'Midnight Lounge', tag: 'CHAT', members: '2.5k', icon: '🌙' }
                  ].map((room, i) => (
                    <div key={i} className="group bg-white/[0.02] border border-white/[0.05] p-8 rounded-[40px] hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-6 right-6 text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full">{room.tag}</div>
                      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">{room.icon}</div>
                      <h3 className="text-xl font-bold mb-1">{room.name}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{room.members} Online</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW: MIGO AURA (Premium Verkauf) */}
            {currentView === 'aura' && (
              <div className="max-w-5xl mx-auto py-10 animate-in zoom-in-95 duration-700">
                <div className="text-center mb-16 space-y-4">
                  <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.4em] border border-indigo-500/20">Status-Revolution</span>
                  <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent italic">MIGO AURA</h1>
                  <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed font-semibold">Dies ist kein Abo. Es ist das Ende der Standard-Existenz.</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 p-[1px] rounded-[50px] shadow-[0_30px_80px_rgba(79,70,229,0.4)]">
                  <div className="bg-[#0a0a0c] rounded-[50px] p-16 flex flex-col md:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8">
                      <h2 className="text-4xl font-black italic tracking-tight">ULTIMATE AURA</h2>
                      <div className="space-y-5">
                        {[
                          { t: 'Ghost Mode', d: 'Unsichtbar bleiben trotz Online-Status.', i: '👻' },
                          { t: 'Animated Avatar', d: 'Animierter Rahmen für dein Avatar.', i: '🌟' },
                          { t: 'Premium Themes', d: 'Gradient-Hintergründe & exklusive Farben.', i: '🎨' },
                          { t: 'Custom Badge', d: 'Individuelle Badge-Texte.', i: '🏷️' },
                          { t: 'Extra Reactions', d: 'Exklusive Emoji-Pakete.', i: '✨' },
                          { t: 'Story+', d: 'Stories laufen 48h + Highlight.', i: '🕒' },
                          { t: 'Vault Access', d: 'Privater verschlüsselter Speicher.', i: '🔐' },
                          { t: 'Message Upgrades', d: 'Voice Notes & größere Uploads.', i: '🎤' },
                          { t: 'Boost Credits', d: 'Monatliche Post-Boosts.', i: '🚀' },
                        ].map((feat, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <span className="text-2xl">{feat.i}</span>
                            <div>
                              <p className="font-bold text-white">{feat.t}</p>
                              <p className="text-xs text-gray-500">{feat.d}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-6 bg-white/[0.03] p-10 rounded-[40px] border border-white/5">
                      <div className="text-center">
                        <div className="text-5xl font-black mb-1 italic">€8.99</div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Per Month</p>
                      </div>
                      <button
                        onClick={() => router.push('/aura')}
                        className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
                      >
                        Claim Your Aura
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: THE VAULT (Premium Feature Showcase) */}
            {currentView === 'vault' && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 animate-in fade-in duration-1000">
                <div className="w-32 h-32 bg-white/[0.03] rounded-full flex items-center justify-center text-5xl mb-10 border border-white/10 shadow-[0_0_60px_rgba(255,255,255,0.05)] relative">
                  🔐
                  <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-20"></div>
                </div>
                <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">The Vault</h2>
                <p className="text-gray-500 max-w-sm text-xs font-bold leading-loose">
                  Dein privater Sektor. Ende-zu-Ende verschlüsselter Speicherplatz für Dateien, die nur dich etwas angehen.
                </p>
                <button 
                  onClick={() => setCurrentView('aura')}
                  className="mt-12 text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-all bg-indigo-500/5 px-8 py-4 rounded-full border border-indigo-500/20"
                >
                  Upgrade to Aura Elite to Unlock
                </button>
              </div>
            )}

          </div>

          {/* Activity Sidebar */}
          <aside className="w-96 border-l border-white/[0.03] hidden xl:flex flex-col p-10 bg-black/10 backdrop-blur-3xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-10">Pulse Feed</h3>
            
            <div className="space-y-8">
              {[
                { user: 'System', msg: 'Aura Node 7 Optimized', time: 'Now', color: 'bg-green-500' },
                { user: 'Security', msg: 'Vault Encryption verified', time: '12m', color: 'bg-indigo-500' },
                { user: 'Network', msg: 'New High-Speed Tunnel active', time: '1h', color: 'bg-purple-500' }
              ].map((log, i) => (
                <div key={i} className="relative pl-8 border-l border-white/5">
                  <div className={`absolute -left-[4px] top-0 w-2 h-2 rounded-full ${log.color} shadow-[0_0_15px_inherit]`}></div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black uppercase tracking-tight text-white/80">{log.user}</span>
                    <span className="text-[9px] text-gray-600 font-bold">{log.time}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 font-semibold italic">{log.msg}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto p-8 bg-white/[0.02] border border-white/[0.05] rounded-[32px] text-center">
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mb-2">Current Status</p>
              <p className="text-sm font-bold text-white italic">"Your Aura defines you."</p>
            </div>
          </aside>
        </main>
      </div>

      {/* Modal Integration */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0a0a0c]/95 flex items-center justify-center z-[100] backdrop-blur-3xl p-6">
          <div className="w-full max-w-md bg-[#1e1f22] rounded-[50px] shadow-[0_0_120px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-8 bg-white/[0.02]">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.3em]">New Connection</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white p-2">✕</button>
            </div>
            <div className="p-12">
              <AddFriendModal currentUserId={session!.user.id} onSuccess={() => setShowAddModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}