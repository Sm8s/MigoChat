// Dynamische Profilseite eines Nutzers
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import {
  fetchProfileByUsername,
  fetchPostsByUser,
  fetchFriendData,
  isFollowing,
  followUser,
  unfollowUser,
  sendFriendRequestByTag,
  getOrCreateDirectConversation,
  blockUser,
  unblockUser,
} from '@/lib/migo-logic';
import type { Profile, Post } from '@/lib/types';

interface UserSession {
  user: { id: string };
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const usernameParam = params?.username as string | undefined;
  const username = usernameParam ? decodeURIComponent(usernameParam) : '';

  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postSkip, setPostSkip] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [friend, setFriend] = useState(false);
  const [follow, setFollow] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: sess }, error } = await supabase.auth.getSession();
      if (error || !sess) {
        router.push('/login');
        return;
      }
      setSession(sess as any);
      setLoadingSession(false);
    };
    getSession();
  }, [router]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username || !session) return;
      setLoadingProfile(true);
      try {
        const prof = await fetchProfileByUsername(username);
        if (!prof) {
          setProfile(null);
          setLoadingProfile(false);
          return;
        }
        setProfile(prof);
        // load posts
        const ps = await fetchPostsByUser(prof.id, 0, 10);
        setPosts(ps);
        setPostSkip(10);
        setHasMorePosts(ps.length === 10);
        // friend status
        const { accepted } = await fetchFriendData(session.user.id);
        setFriend(accepted.some((p) => p.id === prof.id));
        // follow status
        try {
          const f = await isFollowing(session.user.id, prof.id);
          setFollow(f);
        } catch {}
        // TODO: blocked status could be loaded via RPC, not implemented
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [username, session]);

  const loadMorePosts = async () => {
    if (!profile) return;
    const ps = await fetchPostsByUser(profile.id, postSkip, 10);
    setPosts((prev) => [...prev, ...ps]);
    setPostSkip((prev) => prev + 10);
    setHasMorePosts(ps.length === 10);
  };

  const handleFollow = async () => {
    if (!session || !profile) return;
    try {
      if (follow) {
        await unfollowUser(session.user.id, profile.id);
        setFollow(false);
      } else {
        await followUser(session.user.id, profile.id);
        setFollow(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendRequest = async () => {
    if (!session || !profile) return;
    const input = profile.migo_tag ?? profile.username ?? '';
    const res = await sendFriendRequestByTag(session.user.id, input);
    alert(res.message);
  };

  const handleChat = async () => {
    if (!session || !profile) return;
    try {
      const convId = await getOrCreateDirectConversation(profile.id);
      router.push(`/messages?c=${convId}`);
    } catch (err: any) {
      alert(err?.message ?? 'Chat konnte nicht geöffnet werden.');
    }
  };

  const handleBlockToggle = async () => {
    if (!session || !profile) return;
    try {
      if (blocked) {
        await unblockUser(session.user.id, profile.id);
        setBlocked(false);
      } else {
        await blockUser(session.user.id, profile.id);
        setBlocked(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingSession || loadingProfile) {
    return <div className="h-screen flex items-center justify-center bg-[#1e1f22] text-white">Lädt...</div>;
  }

  if (!profile) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f22] text-white">
        Profil nicht gefunden.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0c] text-gray-200">
      <header className="p-6 border-b border-white/10 bg-[#1e1f22] flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-[#4e5058] overflow-hidden">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="avatar" className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
              {profile.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <span className="text-white text-xl font-black">
            {profile.username}
            {profile.migo_tag && <span className="text-gray-400 text-sm ml-1">#{profile.migo_tag}</span>}
          </span>
          {profile.display_name && <span className="text-sm text-gray-500 italic">{profile.display_name}</span>}
          {profile.bio && <p className="text-xs text-gray-400 mt-1 max-w-sm line-clamp-2">{profile.bio}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleFollow}
            className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/[0.1] bg-[#2b2d31] hover:bg-[#35373c] text-white"
          >
            {follow ? 'Unfollow' : 'Follow'}
          </button>
          {friend ? (
            <button
              onClick={handleChat}
              className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Chat
            </button>
          ) : (
            <button
              onClick={handleFriendRequest}
              className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-green-600 hover:bg-green-500 text-white"
            >
              Add Friend
            </button>
          )}
          <button
            onClick={handleBlockToggle}
            className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
          >
            {blocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">Keine Posts</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="bg-[#1e1f22] p-4 rounded-2xl border border-white/[0.05]">
              <p className="text-white text-sm whitespace-pre-line mb-2">{p.content}</p>
              <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
        {hasMorePosts && (
          <button
            onClick={loadMorePosts}
            className="w-full text-center py-2 border border-white/[0.1] rounded-xl text-sm text-gray-400 hover:bg-[#1e1f22]"
          >
            Mehr laden
          </button>
        )}
      </main>
    </div>
  );
}