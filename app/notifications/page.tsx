// /notifications page: list user notifications
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/migo-logic';

interface NotificationItem {
  id: string;
  type: string;
  actor_id: string | null;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: { id: string; username: string | null; migo_tag: string | null; avatar_url: string | null } | null;
}

interface UserSession {
  user: { id: string };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    const load = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const data = await fetchNotifications(session.user.id);
        setNotifications(data as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  const handleClick = async (n: NotificationItem) => {
    // mark as read
    if (!n.read_at) {
      try {
        await markNotificationRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      } catch {}
    }
    // navigate based on type
    switch (n.type) {
      case 'post_like':
      case 'post_comment':
        if (n.entity_id) router.push(`/post/${n.entity_id}`);
        break;
      case 'message':
        if (n.entity_id) router.push(`/messages?c=${n.entity_id}`);
        break;
      case 'friend_request':
      case 'friend_accept':
      case 'follow':
        if (n.actor_id) router.push(`/profile?id=${n.actor_id}`);
        break;
      default:
        break;
    }
  };

  if (loadingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f22] text-white">Lädt...</div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0c] text-gray-200">
      <header className="p-6 border-b border-white/10 bg-[#1e1f22] flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight italic">Benachrichtigungen</h1>
        {session && notifications.length > 0 && (
          <button
            onClick={async () => {
              try {
                await markAllNotificationsRead(session.user.id);
                setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
              } catch (err) {
                console.error(err);
              }
            }}
            className="text-xs font-bold uppercase tracking-wider border border-white/[0.1] px-3 py-1 rounded-xl hover:bg-[#2b2d31]"
          >
            Alle lesen
          </button>
        )}
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Lädt...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500">Keine Benachrichtigungen</p>
        ) : (
          (() => {
            // Gruppiere Likes und Kommentare nach Post
            const grouped: any[] = [];
            const groupMap: Record<string, any> = {};
            notifications.forEach((n) => {
              if (n.type === 'post_like' || n.type === 'post_comment') {
                const key = `${n.type}-${n.entity_id}`;
                if (!groupMap[key]) {
                  groupMap[key] = { ...n, count: 0, actors: [] as any[] };
                }
                groupMap[key].count += 1;
                if (n.actor) groupMap[key].actors.push(n.actor);
                // Mark read only if all grouped notifications are read
                if (!n.read_at) groupMap[key].read_at = null;
                // Use most recent date
                if (!groupMap[key].latest_at || new Date(n.created_at) > new Date(groupMap[key].latest_at)) {
                  groupMap[key].latest_at = n.created_at;
                }
              } else {
                grouped.push({ ...n, count: 1, actors: n.actor ? [n.actor] : [] });
              }
            });
            const combined = [...Object.values(groupMap), ...grouped];
            // Sort by latest_at/created_at desc
            combined.sort((a, b) => new Date(b.latest_at ?? b.created_at).getTime() - new Date(a.latest_at ?? a.created_at).getTime());
            return combined.map((n: any) => {
              const actorName = n.actors?.[0]?.username ?? n.actor?.username ?? 'Jemand';
              const actorTag = n.actors?.[0]?.migo_tag ? `#${n.actors[0].migo_tag}` : n.actor?.migo_tag ? `#${n.actor.migo_tag}` : '';
              let message = '';
              if (n.type === 'post_like') {
                if (n.count > 1) {
                  message = `${n.count} Personen haben deinen Beitrag geliked`;
                } else {
                  message = `${actorName}${actorTag} hat deinen Beitrag geliked`;
                }
              } else if (n.type === 'post_comment') {
                if (n.count > 1) {
                  message = `${n.count} Personen haben deinen Beitrag kommentiert`;
                } else {
                  message = `${actorName}${actorTag} hat deinen Beitrag kommentiert`;
                }
              } else if (n.type === 'follow') {
                message = `${actorName}${actorTag} folgt dir jetzt`;
              } else if (n.type === 'friend_request') {
                message = `${actorName}${actorTag} hat dir eine Freundschaftsanfrage gesendet`;
              } else if (n.type === 'friend_accept') {
                message = `${actorName}${actorTag} hat deine Freundschaftsanfrage angenommen`;
              } else if (n.type === 'message') {
                message = `${actorName}${actorTag} hat dir eine Nachricht geschickt`;
              } else {
                message = 'Aktivität';
              }
              return (
                <div
                  key={n.id || `${n.type}-${n.entity_id}`}
                  onClick={() => handleClick(n)}
                  className={`p-4 bg-[#1e1f22] border border-white/[0.05] rounded-2xl cursor-pointer hover:bg-[#2b2d31] ${n.read_at ? 'opacity-70' : ''}`}
                >
                  <p className="text-sm font-bold text-white mb-1">{message}</p>
                  <p className="text-xs text-gray-500">{new Date((n.latest_at ?? n.created_at)).toLocaleString()}</p>
                </div>
              );
            });
          })()
        )}
      </main>
    </div>
  );
}