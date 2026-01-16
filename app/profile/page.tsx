'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

type ProfileRow = {
  id: string;
  username: string | null;
  migo_tag: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'security'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setErrorMsg(null);

      const { data, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setErrorMsg(sessionErr.message);
        setLoading(false);
        return;
      }

      const session = data.session;
      if (!session?.user?.id) {
        router.push('/login');
        return;
      }

      const { data: row, error } = await supabase
        .from('profiles')
        .select('id, username, migo_tag, avatar_url')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) setErrorMsg(error.message);
      else setProfile(row);

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const copyTag = async () => {
    if (!profile?.migo_tag) return;
    try {
      await navigator.clipboard.writeText(profile.migo_tag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: nichts
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111214] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#111214] flex flex-col items-center justify-center text-gray-300 gap-4 p-6">
        <div className="text-center">
          <div className="font-bold text-white mb-2">Fehler beim Laden</div>
          <div className="text-sm text-gray-400 break-all">{errorMsg}</div>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded bg-[#248046] text-white font-semibold"
        >
          Zurück
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#111214] flex flex-col items-center justify-center text-gray-300 gap-4">
        <div>Profil nicht gefunden.</div>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 rounded bg-[#248046] text-white font-semibold"
        >
          Zurück
        </button>
      </div>
    );
  }

  const fullName = `${profile.username ?? 'User'}#${profile.migo_tag ?? '----'}`;
  const initial = (profile.username ?? 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#111214] text-gray-100 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="h-16 border-b border-white/5 bg-[#2b2d31]/50 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            aria-label="Zurück"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="font-bold text-lg sm:text-xl tracking-tight truncate">Account Settings</span>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all duration-200 text-sm font-bold border border-red-500/20"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto flex gap-8 p-4 sm:p-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0 space-y-1 hidden md:block">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'hover:bg-white/5 text-gray-400'
            }`}
          >
            User Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full text-left px-4 py-2.5 rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                : 'hover:bg-white/5 text-gray-400'
            }`}
          >
            Privacy & Safety
          </button>

          <div className="h-[1px] bg-white/5 my-4" />
          <p className="px-4 text-[10px] uppercase tracking-widest text-gray-500 mb-2">App Settings</p>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 transition-all">
            Appearance
          </button>
          <button className="w-full text-left px-4 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 transition-all">
            Notifications
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Header Card */}
          <section className="bg-[#2b2d31] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
              <div className="absolute -bottom-12 left-8 p-1.5 bg-[#2b2d31] rounded-full">
                <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center text-4xl font-black shadow-inner border-4 border-[#2b2d31]">
                  {initial}
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8 flex justify-between items-end gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">{fullName}</h2>
                <p className="text-gray-400 text-sm">Mitglied seit: {new Date().toLocaleDateString()}</p>
              </div>

              <button className="bg-indigo-500 hover:bg-indigo-400 px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap">
                Edit Profile
              </button>
            </div>
          </section>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* MigoTag Card */}
            <div className="bg-[#232428] p-6 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
                Personal MigoTag
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl font-mono text-indigo-400 font-bold truncate">
                  {profile.migo_tag ?? '----'}
                </span>
                <button
                  onClick={copyTag}
                  className="p-2 bg-white/5 rounded-lg hover:bg-indigo-500 transition-all text-gray-400 hover:text-white shrink-0"
                  title="Tag kopieren"
                >
                  {copied ? '✅' : '📋'}
                </button>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-[#232428] p-6 rounded-xl border border-white/5">
              <label className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2">
                Account Status
              </label>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white font-bold">Verifiziert & Aktiv</span>
              </div>
            </div>
          </div>

          {/* Advanced Section */}
          <section className="bg-[#2b2d31] p-6 sm:p-8 rounded-2xl border border-white/5 space-y-6">
            <h3 className="font-bold text-lg">System-Informationen</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 bg-[#111214] rounded-xl border border-white/5">
                <div className="min-w-0">
                  <p className="font-semibold text-white">User ID</p>
                  <p className="text-xs text-gray-500 font-mono break-all">{profile.id}</p>
                </div>
                <button className="text-xs bg-white/5 px-3 py-1 rounded hover:bg-white/10 transition-colors shrink-0">
                  Details
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 bg-[#111214] rounded-xl border border-white/5">
                <div className="min-w-0">
                  <p className="font-semibold text-white">Zwei-Faktor-Authentifizierung</p>
                  <p className="text-xs text-gray-400">
                    Schütze deinen Account mit einer extra Ebene.
                  </p>
                </div>

                <div className="w-12 h-6 bg-gray-700 rounded-full relative cursor-pointer group shrink-0">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-gray-400 rounded-full group-hover:translate-x-6 transition-all" />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
