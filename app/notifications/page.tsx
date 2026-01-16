// /notifications page: list user notifications
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import { fetchNotifications, markNotificationRead } from '@/lib/migo-logic';

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
      <header className="p-6 border-b border-white/10 bg-[#1e1f22]">
        <h1 className="text-2xl font-black tracking-tight italic">Benachrichtigungen</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">Lädt...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500">Keine Benachrichtigungen</p>
        ) : (
          notifications.map((n) => {
            const actorName = n.actor?.username ?? 'Jemand';
            const actorTag = n.actor?.migo_tag ? `#${n.actor.migo_tag}` : '';
            let message = '';
            switch (n.type) {
              case 'follow':
                message = `${actorName}${actorTag} folgt dir jetzt`;
                break;
              case 'friend_request':
                message = `${actorName}${actorTag} hat dir eine Freundschaftsanfrage gesendet`;
                break;
              case 'friend_accept':
                message = `${actorName}${actorTag} hat deine Freundschaftsanfrage angenommen`;
                break;
              case 'post_like':
                message = `${actorName}${actorTag} hat deinen Beitrag geliked`;
                break;
              case 'post_comment':
                message = `${actorName}${actorTag} hat deinen Beitrag kommentiert`;
                break;
              case 'message':
                message = `${actorName}${actorTag} hat dir eine Nachricht geschickt`;
                break;
              default:
                message = 'Aktivität';
                break;
            }
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`p-4 bg-[#1e1f22] border border-white/[0.05] rounded-2xl cursor-pointer hover:bg-[#2b2d31] ${n.read_at ? 'opacity-70' : ''}`}
              >
                <p className="text-sm font-bold text-white mb-1">{message}</p>
                <p className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}