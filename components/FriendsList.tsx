'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/supabaseClient';
import { acceptFriendRequest, declineFriendRequest } from '@/lib/migo-logic';

interface FriendProfile {
  id: string;
  display_name: string;
  migo_tag: string;
  status: string;
  custom_status?: string;
}

export default function FriendsList({ currentUserId }: { currentUserId: string }) {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'online' | 'pending'>('online');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Verhindert Absturz während des Vercel-Prerenderings
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    
    try {
      const [friendRes, reqRes] = await Promise.all([
        supabase
          .from('friendships')
          .select(`
            id,
            sender:profiles!friendships_sender_id_fkey(id, display_name, migo_tag, status, custom_status),
            receiver:profiles!friendships_receiver_id_fkey(id, display_name, migo_tag, status, custom_status)
          `)
          .eq('status', 'accepted')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`),
        supabase
          .from('friendships')
          .select(`id, sender:profiles!friendships_sender_id_fkey(id, display_name, migo_tag)`)
          .eq('receiver_id', currentUserId)
          .eq('status', 'pending')
      ]);

      if (friendRes.data) {
        const list = friendRes.data
          .map((f: any) => f.sender?.id === currentUserId ? f.receiver : f.sender)
          .filter(Boolean) as FriendProfile[];
        setFriends(list);
      }

      if (reqRes.data) {
        setPendingRequests(reqRes.data.filter((r: any) => r.sender));
      }
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`friends-sync-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, fetchData]);

  if (loading || !currentUserId) return <div className="flex-1 bg-[#313338] p-4 animate-pulse" />;

  return (
    <div className="flex-1 bg-[#313338] flex flex-col overflow-hidden">
      <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 space-x-4 shrink-0">
        {(['online', 'all', 'pending'] as const).map(tabId => (
          <button 
            key={tabId}
            onClick={() => setFilter(tabId)} 
            className={`px-3 py-1 rounded-md text-sm font-semibold ${filter === tabId ? 'bg-[#3f4147] text-white' : 'text-gray-400'}`}
          >
            {tabId.toUpperCase()}
            {tabId === 'pending' && pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] rounded-full px-1.5">{pendingRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filter === 'pending' ? (
          pendingRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between p-3 hover:bg-[#35373c] rounded-lg">
              <div className="text-white font-bold">{req.sender?.display_name || 'Unbekannt'}</div>
              <div className="flex gap-2">
                <button onClick={() => acceptFriendRequest(req.id).then(fetchData)} className="bg-green-600 p-1 rounded">✓</button>
                <button onClick={() => declineFriendRequest(req.id).then(fetchData)} className="bg-red-600 p-1 rounded">✕</button>
              </div>
            </div>
          ))
        ) : (
          friends.filter(f => filter === 'all' || f.status === 'online').map(friend => (
            <div key={friend.id} className="flex items-center p-2 hover:bg-[#35373c] rounded-lg cursor-pointer">
              <div className="w-10 h-10 bg-[#4e5058] rounded-full flex items-center justify-center text-white font-bold">
                {friend.display_name?.[0]?.toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="text-white font-bold text-sm">{friend.display_name}</div>
                <div className="text-xs text-gray-400">{friend.status}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}