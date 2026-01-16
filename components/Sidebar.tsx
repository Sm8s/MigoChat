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

export default function Sidebar({
  currentUserId,
  mobileOpen,
  onCloseMobile,
}: {
  currentUserId: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const go = (path: string) => {
    router.push(path);
    onCloseMobile(); // mobile drawer schließen
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 md:w-64
          bg-[#1e1f22] border-r border-[#232428]
          flex flex-col
          transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-4 text-white font-black tracking-tight text-lg flex items-center justify-between">
          <span>MIGOCHAT</span>
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={onCloseMobile}
            aria-label="Menü schließen"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {/* Hub / Freunde */}
          <button
            onClick={() => go('/')}
            className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
          >
            Hub
          </button>
          {/* Feed */}
          <button
            onClick={() => go('/feed')}
            className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
          >
            Feed
          </button>
          {/* Explore / Search */}
          <button
            onClick={() => go('/search')}
            className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
          >
            Explore
          </button>
          {/* Messages */}
          <button
            onClick={() => go('/messages')}
            className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
          >
            Nachrichten
          </button>
          {/* Notifications */}
          <button
            onClick={() => go('/notifications')}
            className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]"
          >
            Benachrichtigungen
          </button>
        </nav>

        <div className="border-t border-[#2b2d31]">
          {/* Profil */}
          <button
            type="button"
            onClick={() => go('/profile')}
            className="p-4 w-full bg-[#232428] flex items-center gap-3 text-left hover:bg-[#2b2d31] transition-colors"
          >
            <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {avatarLetter}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-white text-sm font-medium truncate">{fullName}</span>
              <span className="text-gray-400 text-[10px] leading-none truncate">Mein Profil</span>
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="m-4 mt-3 w-[calc(100%-2rem)] px-3 py-2 rounded-md text-sm font-semibold
                       bg-[#3a1f1f] text-red-300 hover:bg-[#4a2323] hover:text-red-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
