// /feed page: Social feed for MigoChat
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import {
  createPost,
  fetchPosts,
  toggleLikePost,
} from '@/lib/migo-logic';
import type { PostVisibility } from '@/lib/types';

interface UserSession {
  user: { id: string; email?: string };
}

export default function FeedPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;

  // load session
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

  const loadPosts = useCallback(async () => {
    if (!session) return;
    setLoadingPosts(true);
    try {
      const data = await fetchPosts(skip, POSTS_PER_PAGE);
      setPosts((prev) => [...prev, ...data]);
      if (data.length < POSTS_PER_PAGE) setHasMore(false);
      setSkip((prev) => prev + data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPosts(false);
    }
  }, [session, skip]);

  useEffect(() => {
    // initial load
    if (session) {
      loadPosts();
    }
  }, [session, loadPosts]);

  const handleCreate = async () => {
    if (!session) return;
    const content = postContent.trim();
    if (!content) return;
    try {
      await createPost(session.user.id, content, visibility);
      setPostContent('');
      // reload feed
      setPosts([]);
      setSkip(0);
      setHasMore(true);
      loadPosts();
    } catch (err: any) {
      alert(err?.message ?? 'Fehler beim Posten');
    }
  };

  const handleLike = async (postId: string) => {
    if (!session) return;
    try {
      await toggleLikePost(postId, session.user.id);
      // simple local update: this could be improved by refetching likes count
    } catch (err) {
      console.error(err);
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
        <h1 className="text-2xl font-black tracking-tight italic">Feed</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Post Composer */}
        <div className="bg-[#1e1f22] p-6 rounded-3xl border border-white/[0.05]">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="Was beschäftigt dich?"
            className="w-full min-h-[80px] resize-y bg-[#0a0a0c] text-white p-4 rounded-xl border border-white/[0.1] focus:outline-none mb-3"
          />
          <div className="flex items-center justify-between">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              className="bg-[#2b2d31] text-white text-sm p-2 rounded-xl border border-white/[0.1] focus:outline-none"
            >
              <option value="public">Öffentlich</option>
              <option value="followers">Nur Follower</option>
              <option value="friends">Nur Freunde</option>
              <option value="private">Privat</option>
            </select>
            <button
              onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-2xl text-sm font-bold uppercase tracking-widest"
            >
              Posten
            </button>
          </div>
        </div>
        {/* Posts List */}
        {posts.length === 0 && !loadingPosts ? (
          <p className="text-center text-gray-500 text-sm">Noch keine Posts. Teile als erster etwas!</p>
        ) : null}
        {posts.map((post) => {
          const { id, content, created_at, author } = post;
          const createdDate = new Date(created_at).toLocaleString();
          return (
            <div
              key={id}
              className="bg-[#1e1f22] p-6 rounded-3xl border border-white/[0.05] space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4e5058] flex items-center justify-center text-white font-bold">
                  {author?.username?.[0]?.toUpperCase() ?? '?' }
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-white truncate">
                    {author?.username ?? 'Unbekannt'}
                    {author?.migo_tag ? <span className="text-gray-400">#{author.migo_tag}</span> : null}
                  </span>
                  <span className="text-xs text-gray-500">{createdDate}</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <button
                  onClick={() => handleLike(id)}
                  className="hover:text-white"
                >
                  ♥ Like
                </button>
                <button onClick={() => router.push(`/post/${id}`)} className="hover:text-white">
                  Kommentare
                </button>
              </div>
            </div>
          );
        })}
        {hasMore && !loadingPosts && (
          <button
            onClick={loadPosts}
            className="mx-auto bg-[#1e1f22] hover:bg-[#2b2d31] text-white px-4 py-2 rounded-2xl text-sm font-bold"
          >
            Mehr laden
          </button>
        )}
        {loadingPosts && <p className="text-center text-gray-500">Lädt Posts...</p>}
      </main>
    </div>
  );
}