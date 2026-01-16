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

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorMsg(null);

      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setErrorMsg(sessionErr.message);
        setLoading(false);
        return;
      }

      const session = sessionRes.session;
      if (!session?.user?.id) {
        router.push('/login');
        return;
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, migo_tag, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        // Wenn Trigger korrekt läuft, sollte das nie passieren.
        setErrorMsg('Profil nicht gefunden. (Trigger/Profil-Setup prüfen)');
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    run();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center text-gray-300">
        Lädt Profil...
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#313338] flex flex-col items-center justify-center text-gray-300 gap-4 p-6">
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

  if (!profile) return null;

  const fullName = `${profile.username ?? 'user'}#${profile.migo_tag ?? '----'}`;

  return (
    <div className="min-h-screen bg-[#313338] text-white">
      <header className="h-12 border-b border-[#1e1f22] flex items-center justify-between px-4 bg-[#313338]">
        <div className="font-bold tracking-wide">Profil</div>
        <button onClick={() => router.push('/')} className="text-sm text-gray-300 hover:text-white">
          Zurück
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-[#2b2d31] border border-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-2xl font-black">
              {(profile.username ?? '?')?.[0]?.toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="text-xl font-black truncate">{fullName}</div>
              <div className="text-sm text-gray-300 truncate">
                Dein MigoTag: <span className="font-semibold">{profile.migo_tag ?? '----'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            User-ID: {profile.id}
          </div>
        </div>
      </main>
    </div>
  );
}
