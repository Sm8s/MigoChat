// Post detail page: view a single post with comments
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import {
  fetchPostWithComments,
  addComment,
  deleteComment,
  toggleLikePost,
  fetchCommentsForPost,
} from '@/lib/migo-logic';

interface UserSession {
  user: { id: string };
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [post, setPost] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loadingPost, setLoadingPost] = useState(false);

  // Comments pagination state
  const [comments, setComments] = useState<any[]>([]);
  const [commentsSkip, setCommentsSkip] = useState(0);
  const COMMENTS_PER_PAGE = 10;
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

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
    const loadPost = async () => {
      if (!postId) return;
      setLoadingPost(true);
      try {
        const data = await fetchPostWithComments(postId as string);
        setPost(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPost(false);
      }
    };
    loadPost();
  }, [postId]);

  // Load comments in pages
  const loadComments = async (initial: boolean = false) => {
    if (!postId) return;
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      let skip = commentsSkip;
      if (initial) {
        skip = 0;
      }
      const data = await fetchCommentsForPost(postId as string, skip, COMMENTS_PER_PAGE);
      if (initial) {
        setComments(data);
      } else {
        setComments((prev) => [...prev, ...data]);
      }
      if (data.length < COMMENTS_PER_PAGE) {
        setCommentsHasMore(false);
      } else {
        setCommentsSkip(skip + data.length);
        setCommentsHasMore(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  // load initial comments when postId changes
  useEffect(() => {
    if (postId) {
      setComments([]);
      setCommentsSkip(0);
      setCommentsHasMore(true);
      loadComments(true);
    }
  }, [postId]);

  const handleAddComment = async () => {
    if (!session || !postId) return;
    const text = newComment.trim();
    if (!text) return;
    try {
      await addComment(postId as string, session.user.id, text);
      setNewComment('');
      // reload comments
      setComments([]);
      setCommentsSkip(0);
      setCommentsHasMore(true);
      await loadComments(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      // reload comments
      setComments([]);
      setCommentsSkip(0);
      setCommentsHasMore(true);
      await loadComments(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!session || !postId) return;
    try {
      await toggleLikePost(postId as string, session.user.id);
      // reload post
      const data = await fetchPostWithComments(postId as string);
      setPost(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingSession || loadingPost || !post) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f22] text-white">Lädt...</div>
    );
  }

  const createdAt = new Date(post.created_at).toLocaleString();
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0c] text-gray-200">
      <header className="p-6 border-b border-white/10 bg-[#1e1f22]">
        <button onClick={() => router.back()} className="text-indigo-400 hover:text-indigo-300 mr-4">← Zurück</button>
        <span className="text-xl font-bold">Beitrag</span>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="bg-[#1e1f22] p-6 rounded-3xl border border-white/[0.05] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4e5058] flex items-center justify-center text-white font-bold">
              {post.author?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {post.author?.username ?? 'Unbekannt'}
                {post.author?.migo_tag ? <span className="text-gray-400">#{post.author.migo_tag}</span> : null}
              </span>
              <span className="text-xs text-gray-500">{createdAt}</span>
            </div>
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <button onClick={handleLike} className="hover:text-white">
              ♥ Like
            </button>
          </div>
        </div>
        {/* Comments */}
        <div className="bg-[#1e1f22] p-6 rounded-3xl border border-white/[0.05] space-y-4">
          <h3 className="text-lg font-bold text-white">Kommentare</h3>
          {comments.length > 0 ? (
            comments.map((c: any) => {
              const isMine = c.author_id === session!.user.id;
              return (
                <div key={c.id} className="bg-[#2b2d31] p-3 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#4e5058] flex items-center justify-center text-white font-bold">
                    {c.author?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white">
                      {c.author?.username ?? 'Unbekannt'}{c.author?.migo_tag ? <span className="text-gray-400">#{c.author.migo_tag}</span> : null}
                    </span>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{c.content}</p>
                    <span className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  {isMine && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-red-400 hover:text-red-200 text-xs">Löschen</button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-sm">Keine Kommentare</p>
          )}
          {commentsHasMore && !loadingComments && (
            <button
              onClick={() => loadComments(false)}
              className="mx-auto mt-4 bg-[#1e1f22] hover:bg-[#2b2d31] text-white px-4 py-2 rounded-2xl text-xs font-bold"
            >
              Weitere laden
            </button>
          )}
          {loadingComments && <p className="text-gray-500 text-xs mt-2">Lädt weitere Kommentare...</p>}
          {/* Add comment */}
          <div className="flex gap-2 mt-4">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
              placeholder="Kommentar schreiben..."
              className="flex-1 bg-[#1e1f22] border border-white/[0.1] p-2 rounded-2xl text-white outline-none"
            />
            <button
              onClick={handleAddComment}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-2xl text-sm font-bold"
            >
              Senden
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}