// /messages page: direct messages chat
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import {
  fetchFriendData,
  getOrCreateDirectConversation,
} from '@/lib/migo-logic';

interface UserSession {
  user: { id: string };
}

interface ConversationListItem {
  id: string;
  otherUser: { id: string; username: string | null; migo_tag: string | null };
}

interface ChatMessage {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: { id: string; username: string | null; migo_tag: string | null } | null;
}

function MessagesPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

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

  // Load conversations for user
  const loadConversations = useCallback(async () => {
    if (!session) return;
    setLoadingConvs(true);
    try {
      // Step 1: fetch conversation_ids for current user
      const { data: memberRows, error: memberErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', session.user.id);
      if (memberErr) throw memberErr;
      const convIds = (memberRows ?? []).map((row: any) => row.conversation_id);
      const list: ConversationListItem[] = [];
      // For each conversation, find other member
      for (const convId of convIds) {
        // fetch conversation to check type
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('id, type')
          .eq('id', convId)
          .maybeSingle();
        if (convErr || !conv) continue;
        if (conv.type !== 'direct') continue;
        // get other member's profile
        const { data: members, error: memErr } = await supabase
          .from('conversation_members')
          .select('user_id, profiles(id, username, migo_tag)')
          .eq('conversation_id', convId);
        if (memErr) continue;
        const others = (members ?? []).filter((m: any) => m.user_id !== session.user.id);
        if (others.length > 0) {
          const other = others[0].profiles;
          list.push({ id: convId, otherUser: other });
        }
      }
      setConversations(list);
      // If there is a query param, select conversation automatically
      const paramConv = params.get('c');
      if (paramConv) {
        setSelectedConvId(paramConv);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvs(false);
    }
  }, [session, params]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (convId: string) => {
    if (!session) return;
    setLoadingMsgs(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          'id, author_id, content, created_at, author:profiles(id, username, migo_tag)'
        )
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data as any);
      // update last_read_at
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('user_id', session.user.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [session]);

  useEffect(() => {
    if (selectedConvId) {
      loadMessages(selectedConvId);
    }
  }, [selectedConvId, loadMessages]);

  // handle sending message
  const handleSend = async () => {
    if (!session || !selectedConvId) return;
    const text = newMessage.trim();
    if (!text) return;
    try {
      await supabase.from('messages').insert({
        conversation_id: selectedConvId,
        author_id: session.user.id,
        content: text,
      });
      setNewMessage('');
      // reload messages
      loadMessages(selectedConvId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectConversation = (conv: ConversationListItem) => {
    setSelectedConvId(conv.id);
    // update query param
    router.push(`/messages?c=${conv.id}`);
  };

  const handleStartConversation = async (profileId: string) => {
    if (!session) return;
    try {
      const convId = await getOrCreateDirectConversation(profileId);
      await loadConversations();
      setSelectedConvId(convId);
      router.push(`/messages?c=${convId}`);
    } catch (err: any) {
      alert(err?.message ?? 'Konnte Chat nicht starten.');
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f22] text-white">Lädt...</div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0a0a0c] text-gray-200">
      {/* conversation list */}
      <aside className="w-72 border-r border-white/[0.1] bg-[#1e1f22] flex flex-col">
        <div className="p-4 border-b border-white/[0.1]">
          <h2 className="text-xl font-bold">Nachrichten</h2>
        </div>
        {loadingConvs ? (
          <p className="p-4 text-gray-500">Lädt...</p>
        ) : conversations.length === 0 ? (
          <p className="p-4 text-gray-500">Keine Konversationen</p>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <li
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`px-4 py-3 cursor-pointer hover:bg-[#2b2d31] ${selectedConvId === conv.id ? 'bg-[#2b2d31]' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#4e5058] flex items-center justify-center text-white font-bold">
                    {conv.otherUser.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">
                      {conv.otherUser.username ?? 'Unbekannt'}
                      {conv.otherUser.migo_tag ? <span className="text-gray-400">#{conv.otherUser.migo_tag}</span> : null}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
      {/* chat view */}
      <div className="flex-1 flex flex-col">
        {!selectedConvId ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Wähle eine Unterhaltung oder starte einen Chat aus der Freundesliste.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMsgs ? (
                <p className="text-gray-500">Lädt Nachrichten...</p>
              ) : messages.length === 0 ? (
                <p className="text-gray-500">Keine Nachrichten</p>
              ) : (
                messages.map((m) => {
                  const mine = m.author_id === session!.user.id;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[70%] p-3 rounded-2xl ${mine ? 'bg-indigo-600 text-white self-end' : 'bg-[#2b2d31] text-gray-200 self-start'}`}
                    >
                      {!mine && (
                        <span className="text-xs font-bold text-indigo-400 block mb-1">
                          {m.author?.username ?? 'Unbekannt'}
                          {m.author?.migo_tag ? `#${m.author.migo_tag}` : ''}
                        </span>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      <span className="text-[10px] text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                  );
                })
              )}
            </div>
            {/* message input */}
            <div className="p-4 border-t border-white/[0.1] flex items-center gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Nachricht schreiben..."
                className="flex-1 bg-[#1e1f22] border border-white/[0.1] p-3 rounded-2xl text-white outline-none"
              />
              <button
                onClick={handleSend}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-2xl text-sm font-bold"
              >
                Senden
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Next.js (App Router) requires `useSearchParams()` to be wrapped in a Suspense boundary.
export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center">
          <div className="text-sm text-white/70">Lade Nachrichten…</div>
        </div>
      }
    >
      <MessagesPageClient />
    </Suspense>
  );
}