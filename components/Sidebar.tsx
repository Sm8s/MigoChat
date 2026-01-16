'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';

interface MyProfile {
  id: string;
  display_name: string;
  migo_tag: string;
}

export default function Sidebar({ currentUserId }: { currentUserId: string }) {
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, migo_tag')
        .eq('id', currentUserId)
        .single();

      if (!error && data) {
        setMyProfile(data);
      }
    };

    loadProfile();
  }, [currentUserId]);

  return (
    <aside className="w-64 bg-[#1e1f22] flex flex-col border-r border-[#232428]">
      {/* Top / Navigation */}
      <div className="p-4 text-white font-black tracking-tight text-lg">
        MIGOCHAT
      </div>

      <nav className="flex-1 px-2 space-y-1">
        <button className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]">
          Freunde
        </button>
        <button className="w-full text-left px-3 py-2 rounded-md text-gray-300 hover:bg-[#2b2d31]">
          Nachrichten
        </button>
      </nav>

      {/* Bottom / eigenes Profil */}
      <div className="p-4 bg-[#232428] flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {myProfile?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-white text-sm font-medium truncate">
            {myProfile?.display_name ?? 'Lädt...'}
          </span>
          <span className="text-gray-400 text-[10px] leading-none truncate">
            {myProfile?.migo_tag}
          </span>
        </div>
      </div>
    </aside>
  );
}
