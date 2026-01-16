// /search page: Explore / search for users
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import {
  searchProfiles,
  sendFriendRequestByTag,
  fetchFriendData,
  isFollowing,
  followUser,
  unfollowUser,
  getOrCreateDirectConversation,
} from '@/lib/migo-logic';
import type { Profile } from '@/lib/types';

interface UserSession {
  user: { id: string };
}

export default function SearchPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [friendsMap, setFriendsMap] = useState<Record<string, boolean>>({});
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: sess }, error } = await supabase.auth.getSession();
      if (error || !sess) {
        router.push('/login');
        return;
      }
      setSession(sess as any);
      setLoadingSession(false);
      // load friend data and follow states
      const { accepted } = await fetchFriendData(sess.user.id);
      const map: Record<string, boolean> = {};
      accepted.forEach((p) => { map[p.id] = true; });
      setFriendsMap(map);
    };
    getSession();
  }, [router]);

  const performSearch = async () => {
    if (!query.trim() || !session) return;
    setSearching(true);
    try {
      const profiles = await searchProfiles(query);
      // Exclude yourself
      const filtered = profiles.filter((p) => p.id !== session.user.id);
      setResults(filtered);
      // load follow status for results
      const followStatus: Record<string, boolean> = {};
      for (const prof of filtered) {
        try {
          followStatus[prof.id] = await isFollowing(session.user.id, prof.id);
        } catch {
          followStatus[prof.id] = false;
        }
      }
      setFollowMap(followStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleFriendRequest = async (profile: Profile) => {
    if (!session) return;
    const input = profile.migo_tag ?? profile.username ?? '';
    const res = await sendFriendRequestByTag(session.user.id, input);
    alert(res.message);
  };

  const handleFollow = async (profileId: string) => {
    if (!session) return;
    const current = followMap[profileId];
    try {
      if (current) {
        await unfollowUser(session.user.id, profileId);
        setFollowMap((prev) => ({ ...prev, [profileId]: false }));
      } else {
        await followUser(session.user.id, profileId);
        setFollowMap((prev) => ({ ...prev, [profileId]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async (profileId: string) => {
    if (!session) return;
    try {
      const convId = await getOrCreateDirectConversation(profileId);
      router.push(`/messages?c=${convId}`);
    } catch (err: any) {
      alert(err?.message ?? 'Chat konnte nicht geöffnet werden.');
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f22] text-white">Lädt...</div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0c] text-gray-200">
      <header className="p-6 border-b border-white/10 bg-[#1e1f22]">
        <h1 className="text-2xl font-black tracking-tight italic">Explore / Suche</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex gap-4 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') performSearch();
            }}
            placeholder="Username, Name oder Tag"
            className="flex-1 bg-[#1e1f22] border border-white/[0.1] p-3 rounded-xl text-white outline-none"
          />
          <button
            onClick={performSearch}
            disabled={searching}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-2xl text-sm font-bold"
          >
            {searching ? '...' : 'Suchen'}
          </button>
        </div>
        {results.length === 0 && !searching ? (
          <p className="text-center text-gray-500">Keine Ergebnisse</p>
        ) : null}
        {results.map((prof) => {
          const isFriend = friendsMap[prof.id] || false;
          const isFollow = followMap[prof.id] || false;
          return (
            <div
              key={prof.id}
              className="bg-[#1e1f22] p-4 rounded-2xl border border-white/[0.05] flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#4e5058] flex items-center justify-center text-white font-bold">
                  {prof.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-bold text-sm truncate">
                    {prof.username ?? 'Unbekannt'}
                    {prof.migo_tag ? <span className="text-gray-400">#{prof.migo_tag}</span> : null}
                  </span>
                  {prof.display_name && <span className="text-xs text-gray-500 truncate">{prof.display_name}</span>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {/* Follow/Unfollow */}
                <button
                  onClick={() => handleFollow(prof.id)}
                  className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/[0.1] bg-[#2b2d31] hover:bg-[#35373c] text-white"
                >
                  {isFollow ? 'Unfollow' : 'Follow'}
                </button>
                {/* Friend request / Chat */}
                {isFriend ? (
                  <button
                    onClick={() => handleChat(prof.id)}
                    className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Chat
                  </button>
                ) : (
                  <button
                    onClick={() => handleFriendRequest(prof)}
                    className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}