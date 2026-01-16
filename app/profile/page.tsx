'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

type ProfileRow = {
  id: string;
  username: string | null;
  migo_tag: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_aura: boolean;
  two_factor_enabled: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'aura' | 'security'>('overview');
  
  // Form States
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username || '');
      setBio(data.bio || '');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username, bio })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, username, bio });
      // Kleiner Erfolgseffekt
      alert("Profil erfolgreich synchronisiert.");
    }
    setSaving(false);
  };

  const toggleTwoFactor = async () => {
    if (!profile) return;
    const newVal = !profile.two_factor_enabled;
    const { error } = await supabase
      .from('profiles')
      .update({ two_factor_enabled: newVal })
      .eq('id', profile.id);
    
    if (!error) setProfile({ ...profile, two_factor_enabled: newVal });
  };

  if (loading) return (
    <div className="h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
      
      {/* High-End Header */}
      <nav className="h-20 border-b border-white/[0.03] bg-[#111214]/80 backdrop-blur-2xl sticky top-0 z-50 px-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/')} className="p-3 hover:bg-white/5 rounded-2xl transition-all group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Account Center</h1>
        </div>
        <div className="flex items-center gap-4">
          {profile?.is_aura && (
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest animate-pulse">AURA ACTIVE</span>
          )}
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors">Abmelden</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 p-10">
        
        {/* Navigation Sidebar */}
        <aside className="space-y-2">
          {[
            { id: 'overview', label: 'Profil Editieren', icon: '👤' },
            { id: 'aura', label: 'Aura Status', icon: '✨' },
            { id: 'security', label: 'Privatsphäre', icon: '🛡️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] text-sm font-black transition-all ${
                activeTab === tab.id ? 'bg-white text-black scale-105 shadow-xl shadow-white/5' : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Profile Card */}
              <section className="bg-[#1e1f22] rounded-[40px] border border-white/[0.03] overflow-hidden shadow-2xl">
                <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-600 relative">
                  <div className="absolute -bottom-14 left-10 p-2 bg-[#1e1f22] rounded-full">
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-[#1e1f22] ${profile?.is_aura ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse' : 'bg-gray-700'}`}>
                      {username[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                </div>

                <div className="pt-20 pb-10 px-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">Anzeigename</label>
                        <input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">Bio / Status</label>
                        <textarea 
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          className="w-full bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold focus:border-indigo-500 outline-none transition-all resize-none"
                          placeholder="Erzähl etwas über dich..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-end gap-4">
                      <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Migo-Tag</p>
                        <p className="text-xl font-mono font-black text-indigo-400">#{profile?.migo_tag}</p>
                      </div>
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                      >
                        {saving ? 'Synchronisiere...' : 'Änderungen speichern'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black italic tracking-tighter">Security & Shield</h2>
              <div className="bg-[#1e1f22] rounded-[40px] border border-white/[0.03] p-10 space-y-6">
                
                <div className="flex items-center justify-between p-6 bg-black/20 rounded-[30px] border border-white/5">
                  <div>
                    <p className="font-black text-white italic">Zwei-Faktor-Authentifizierung (2FA)</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Sichert deinen Account vor unbefugtem Zugriff.</p>
                  </div>
                  <button 
                    onClick={toggleTwoFactor}
                    className={`w-14 h-8 rounded-full relative transition-all ${profile?.two_factor_enabled ? 'bg-green-500' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${profile?.two_factor_enabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-black/20 rounded-[30px] border border-white/5">
                  <div>
                    <p className="font-black text-white italic">Passwort ändern</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Letzte Änderung: Vor 12 Tagen</p>
                  </div>
                  <button className="bg-white/5 hover:bg-white/10 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Anfordern</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'aura' && (
            <div className="space-y-6">
               <h2 className="text-3xl font-black italic tracking-tighter">Migo Aura Status</h2>
               <div className="bg-gradient-to-br from-[#1e1f22] to-[#111214] rounded-[40px] border border-white/5 p-12 text-center">
                  <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border border-indigo-500/20">
                    {profile?.is_aura ? '✨' : '💎'}
                  </div>
                  <h3 className="text-2xl font-black mb-2">{profile?.is_aura ? 'Du hast die Aura!' : 'Keine Aura erkannt'}</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mb-10">
                    {profile?.is_aura 
                      ? 'Dein Profil strahlt. Du hast Zugriff auf alle Elite-Features und The Vault.' 
                      : 'Schalte die Aura frei, um exklusive Badges, höhere Qualität und verschlüsselten Speicher zu erhalten.'}
                  </p>
                  {!profile?.is_aura && (
                    <button 
                      onClick={() => router.push('/?view=aura')}
                      className="bg-indigo-600 hover:bg-indigo-500 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                      Aura erwerben
                    </button>
                  )}
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}