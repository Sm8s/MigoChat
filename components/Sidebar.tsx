'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

type MyProfile = {
  id: string;
  username: string | null;
  migo_tag: string | null;
  avatar_url: string | null;
};

export default function Sidebar({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, migo_tag, avatar_url')
        .eq('id', currentUserId)
        .maybeSingle();

      if (!error && data) setMyProfile(data);
    };

    load();
  }, [currentUserId]);

  const fullName = `${myProfile?.username ?? 'Lädt...'}#${myProfile?.migo_tag ?? '----'}`;
  const avatarLetter = (myProfile?.username ?? '?')?.[0]?.toUpperCase();

  return (
    <aside className="w-64 bg-[#1e1f22] flex flex-col border-r border-[#232428]">
      <div className="p-4 text-white font-black tracking-tight text-lg">
        MIGOCHAT
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <button
          onClick={() => router.push('/')}
          className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
        >
          Freunde
        </button>

        <button
          className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
        >
          Nachrichten
        </button>
      </nav>

      {/* Bottom / eigenes Profil */}
      <button
        type="button"
        onClick={() => router.push('/profile')}
        className="p-4 bg-[#232428] flex items-center gap-3 text-left hover:bg-[#2b2d31] transition-colors"
      >
        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {avatarLetter}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm font-medium truncate">
            {fullName}
          </span>
          <span className="text-gray-400 text-[10px] leading-none truncate">
            Mein Profil
          </span>
        </div>
      </button>
    </aside>
  );
}
