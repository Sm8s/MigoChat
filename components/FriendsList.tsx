'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/supabaseClient';
import { respondFriendRequest, fetchFriendData } from '@/lib/migo-logic';

type Filter = 'all' | 'online' | 'pending';

type ProfileLite = {
  id: string;
  username: string | null;
  migo_tag: string | null;
  status: string | null;
  custom_status?: string | null;
};

type FriendshipAcceptedRow = {
  id: string;
  sender: ProfileLite | null;
  receiver: ProfileLite | null;
};

type PendingRow = {
  id: string;
  sender: Pick<ProfileLite, 'id' | 'username' | 'migo_tag'> | null;
};

export default function FriendsList({
  currentUserId,
  filter,
}: {
  currentUserId: string;
  filter: Filter;
}) {
  const [friends, setFriends] = useState<ProfileLite[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { accepted, inbound } = await fetchFriendData(currentUserId);
      setFriends(accepted);
      // map inbound to expected structure for pendingRequests
      const pending = inbound.map((prof) => ({ id: prof.id, sender: { id: prof.id, username: prof.username, migo_tag: prof.migo_tag } }));
      setPendingRequests(pending);
    } catch (err) {
      console.error('Fehler beim Laden:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
    // Für Echtzeit-Updates können wir optional auf postgres_changes hören. Falls
    // supabase-js v2 verwendet wird, könnten wir hier einen Channel anmelden.
    const channel = supabase
      .channel(`friends-sync-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchData]);

  if (loading || !currentUserId) {
    return <div className="flex-1 bg-[#313338] p-4 animate-pulse" />;
  }

  // Filter anwenden
  const visibleFriends =
    filter === 'online'
      ? friends.filter((f) => (f.status ?? '').toLowerCase() === 'online')
      : friends;

  return (
    <div className="flex-1 bg-[#313338] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2">
        {filter === 'pending' ? (
          pendingRequests.length === 0 ? (
            <div className="text-gray-400 text-sm p-4">Keine ausstehenden Anfragen.</div>
          ) : (
            pendingRequests.map((req) => {
              const name = req.sender?.username ?? 'Unbekannt';
              const tag = req.sender?.migo_tag ?? '----';

              return (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 hover:bg-[#35373c] rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">
                      {name}
                      <span className="text-gray-400 font-semibold">#{tag}</span>
                    </div>
                    <div className="text-xs text-gray-500">Freundschaftsanfrage</div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => respondFriendRequest(req.sender!.id, 'accepted').then(fetchData)}
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                      title="Annehmen"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => respondFriendRequest(req.sender!.id, 'rejected').then(fetchData)}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                      title="Ablehnen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : visibleFriends.length === 0 ? (
          <div className="text-gray-400 text-sm p-4">
            {filter === 'online' ? 'Keine Freunde online.' : 'Noch keine Freunde.'}
          </div>
        ) : (
          visibleFriends.map((friend) => {
            const name = friend.username ?? 'Unbekannt';
            const tag = friend.migo_tag ?? '----';
            const status = (friend.status ?? 'offline').toLowerCase();

            return (
              <div
                key={friend.id}
                className="flex items-center p-2 hover:bg-[#35373c] rounded-lg cursor-pointer"
              >
                <div className="w-10 h-10 bg-[#4e5058] rounded-full flex items-center justify-center text-white font-bold">
                  {name?.[0]?.toUpperCase()}
                </div>

                <div className="ml-3 min-w-0">
                  <div className="text-white font-bold text-sm truncate">
                    {name}
                    <span className="text-gray-400 font-semibold">#{tag}</span>
                  </div>

                  <div className="text-xs text-gray-400">
                    {status}
                    {friend.custom_status ? ` • ${friend.custom_status}` : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
