'use client';

import { useEffect, useState, useRef } from 'react';
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
  banner_color?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'aura' | 'security'>('overview');
  
  // Form States
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState('from-indigo-600 via-purple-700 to-blue-600');

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
      setAvatarUrl(data.avatar_url);
      if (data.banner_color) setBannerColor(data.banner_color);
    }
    setLoading(false);
  };

  // AVATAR UPLOAD LOGIK
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

    // 1. Upload zu Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload fehlgeschlagen: " + uploadError.message);
      setSaving(false);
      return;
    }

    // 2. Öffentliche URL holen
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. In Datenbank speichern
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);

    if (!updateError) {
      setAvatarUrl(publicUrl);
      setProfile({ ...profile, avatar_url: publicUrl });
    }
    setSaving(false);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username, 
        bio,
        banner_color: bannerColor 
      })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, username, bio, banner_color: bannerColor });
      alert("Profil erfolgreich mit der Cloud synchronisiert.");
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
    <div className="h-screen bg-[#0a0a0c] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
      <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.3em]">Accessing Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
      
      <nav className="h-20 border-b border-white/[0.03] bg-[#111214]/80 backdrop-blur-2xl sticky top-0 z-50 px-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/')} className="p-3 hover:bg-white/5 rounded-2xl transition-all group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-xl font-black tracking-tighter uppercase italic">Account Center</h1>
        </div>
        <div className="flex items-center gap-4">
          {profile?.is_aura && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black tracking-widest text-indigo-400">AURA ACTIVE</span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 p-10">
        
        <aside className="space-y-2">
          {[
            { id: 'overview', label: 'Profil Editieren', icon: '👤' },
            { id: 'aura', label: 'Aura Status', icon: '✨' },
            { id: 'security', label: 'Privatsphäre', icon: '🛡️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[24px] text-sm font-black transition-all duration-300 ${
                activeTab === tab.id ? 'bg-white text-black scale-105 shadow-[0_20px_40px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span> {tab.label}
            </button>
          ))}
          
          <div className="pt-10">
             <button 
              onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
              className="w-full text-left px-6 py-4 text-red-500/50 hover:text-red-500 text-xs font-black uppercase tracking-widest transition-colors"
             >
               Logout Instance
             </button>
          </div>
        </aside>

        <main className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <section className="bg-[#1e1f22] rounded-[48px] border border-white/[0.03] overflow-hidden shadow-2xl relative">
                
                {/* Dynamischer Banner */}
                <div className={`h-48 bg-gradient-to-br ${bannerColor} relative transition-all duration-500`}>
                   <div className="absolute top-6 right-8 flex gap-2">
                      {['from-indigo-600 to-blue-600', 'from-rose-600 to-orange-500', 'from-emerald-600 to-teal-500'].map((col) => (
                        <button 
                          key={col} 
                          onClick={() => setBannerColor(col)}
                          className={`w-6 h-6 rounded-full border-2 border-white/20 ${col} hover:scale-125 transition-all`}
                        />
                      ))}
                   </div>
                </div>

                <div className="absolute top-28 left-10 group">
                  <div className="p-1.5 bg-[#1e1f22] rounded-full relative">
                    <div className={`w-32 h-32 rounded-full overflow-hidden flex items-center justify-center text-5xl font-black shadow-2xl border-4 border-[#1e1f22] bg-[#2b2d31] ${profile?.is_aura ? 'ring-4 ring-indigo-500/30' : ''}`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        username[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    {/* Upload Overlay */}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-black uppercase tracking-widest"
                    >
                      Change
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div className="pt-24 pb-12 px-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 block">Identity</label>
                        <input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          className="w-full bg-black/40 border border-white/5 rounded-3xl px-8 py-5 text-sm font-bold focus:border-indigo-500 outline-none transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 block">Aura Bio</label>
                        <textarea 
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={4}
                          className="w-full bg-black/40 border border-white/5 rounded-3xl px-8 py-5 text-sm font-bold focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                          placeholder="Define your presence..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-end gap-6">
                      <div className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5 backdrop-blur-md">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Global Migo-Tag</p>
                        <p className="text-3xl font-mono font-black text-indigo-400">#{profile?.migo_tag}</p>
                        <p className="text-[10px] text-gray-600 mt-4 leading-relaxed font-medium">Dein Tag ist permanent und dient zur Identifizierung im Migo-Netzwerk.</p>
                      </div>
                      <button 
                        onClick={handleUpdateProfile}
                        disabled={saving}
                        className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-95 ${saving ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}
                      >
                        {saving ? 'Syncing...' : 'Save Configuration'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-4xl font-black italic tracking-tighter mb-10">Security & Shield</h2>
              <div className="grid gap-6">
                
                <div className="group flex items-center justify-between p-8 bg-[#1e1f22] rounded-[32px] border border-white/[0.03] hover:border-indigo-500/30 transition-all">
                  <div className="flex gap-6 items-center">
                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl">🔐</div>
                    <div>
                      <p className="font-black text-white italic text-lg">Zwei-Faktor-Authentifizierung</p>
                      <p className="text-xs text-gray-500 mt-1 font-semibold">Zusätzliche Sicherheitsebene für Logins.</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleTwoFactor}
                    className={`w-16 h-9 rounded-full relative transition-all duration-500 ${profile?.two_factor_enabled ? 'bg-indigo-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all shadow-xl ${profile?.two_factor_enabled ? 'left-8' : 'left-1.5'}`} />
                  </button>
                </div>

                <div className="p-8 bg-[#1e1f22] rounded-[32px] border border-white/[0.03]">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-6 text-center">Danger Zone</h4>
                  <button className="w-full py-4 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                    Delete Account & Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'aura' && (
            <div className="max-w-3xl mx-auto py-10">
               <div className="relative group p-[2px] rounded-[50px] bg-gradient-to-br from-indigo-500 via-purple-600 to-transparent">
                  <div className="bg-[#0a0a0c] rounded-[48px] p-16 text-center">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl mx-auto mb-10 border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] ${profile?.is_aura ? 'animate-pulse' : ''}`}>
                      {profile?.is_aura ? '✨' : '💎'}
                    </div>
                    <h3 className="text-4xl font-black mb-4 italic tracking-tighter">
                      {profile?.is_aura ? 'Aura Elite Status' : 'No Aura Detected'}
                    </h3>
                    <p className="text-gray-500 font-bold text-sm leading-relaxed mb-12">
                      {profile?.is_aura 
                        ? 'Dein Status ist im Netzwerk verifiziert. Du genießt maximale Privatsphäre und exklusive UI-Anpassungen.' 
                        : 'Schalte die Aura frei, um exklusive Badges, 4K Streaming und den verschlüsselten Vault zu erhalten.'}
                    </p>
                    {!profile?.is_aura && (
                      <button 
                        onClick={() => router.push('/?view=aura')}
                        className="bg-white text-black px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl"
                      >
                        Get Aura Now
                      </button>
                    )}
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}