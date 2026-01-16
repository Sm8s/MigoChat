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
    // Verhindert Abfragen ohne gültige ID (wichtig für Vercel Build-Sicherheit)
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    
    try {
      // 1. Lade akzeptierte Freunde
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select(`
          id,
          sender:profiles!friendships_sender_id_fkey(id, display_name, migo_tag, status, custom_status),
          receiver:profiles!friendships_receiver_id_fkey(id, display_name, migo_tag, status, custom_status)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      // 2. Lade eingehende ausstehende Anfragen
      const { data: requests, error: reqError } = await supabase
        .from('friendships')
        .select(`id, sender:profiles!friendships_sender_id_fkey(id, display_name, migo_tag)`)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending');

      if (!friendError && friendships) {
        // Sicherstellen, dass Profile existieren bevor darauf zugegriffen wird
        const list = friendships
          .map((f: any) => f.sender?.id === currentUserId ? f.receiver : f.sender)
          .filter(Boolean) as FriendProfile[];

        const sorted = list.sort((a, b) => {
          if (a.status === b.status) return a.display_name.localeCompare(b.display_name);
          return a.status === 'online' ? -1 : 1;
        });
        setFriends(sorted);
      }

      if (!reqError && requests) {
        setPendingRequests(requests.filter((r: any) => r.sender));
      }
    } catch (err) {
      console.error("Fehler beim Laden der Freundesliste:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchData();

    // Optimiertes Realtime: Nur bei Änderungen an Freundschaften dieses Nutzers triggern
    const channel = supabase
      .channel(`friends-realtime-${currentUserId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `or(sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId})` 
        }, 
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchData]);

  // Zeigt ein Ladeskelett an
  if (loading || !currentUserId) return (
    <div className="flex-1 bg-[#313338] p-4 space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-14 bg-gray-700/30 animate-pulse rounded-lg" />
      ))}
    </div>
  );

  return (
    <div className="flex-1 bg-[#313338] flex flex-col overflow-hidden select-none">
      {/* Tab Navigation */}
      <div className="h-12 border-b border-[#1e1f22] flex items-center px-4 space-x-4 shrink-0 bg-[#313338]">
        {(['online', 'all', 'pending'] as const).map(tabId => (
          <button 
            key={tabId}
            onClick={() => setFilter(tabId)} 
            className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
              filter === tabId ? 'bg-[#3f4147] text-white shadow-sm' : 'text-gray-400 hover:bg-[#35373c] hover:text-gray-200'
            } relative`}
          >
            {tabId === 'online' && 'Online'}
            {tabId === 'all' && 'Alle'}
            {tabId === 'pending' && 'Ausstehend'}
            {tabId === 'pending' && pendingRequests.length > 0 && (
              <span className="ml-2 bg-[#f23f42] text-white text-[10px] rounded-full px-1.5 py-0.5 animate-in fade-in zoom-in">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* Ansicht: Ausstehende Anfragen */}
        {filter === 'pending' && (
          pendingRequests.length > 0 ? (
            pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 hover:bg-[#35373c] rounded-lg group border-b border-gray-800/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5865f2] rounded-full flex items-center justify-center text-white font-bold shadow-inner">
                    {req.sender?.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="text-white font-bold leading-tight">{req.sender?.display_name}</div>
                    <div className="text-gray-400 text-xs">#{req.sender?.migo_tag?.split('#')[1] || '0000'}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => { await acceptFriendRequest(req.id); fetchData(); }} 
                    className="bg-[#248046] hover:bg-[#1a6334] text-white p-2 rounded-full transition-all active:scale-90 shadow-md"
                    title="Annehmen"
                  >✓</button>
                  <button 
                    onClick={async () => { await declineFriendRequest(req.id); fetchData(); }} 
                    className="bg-[#da373c] hover:bg-[#a1282c] text-white p-2 rounded-full transition-all active:scale-90 shadow-md"
                    title="Ablehnen"
                  >✕</button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 opacity-60">
              <span className="text-3xl">🏜️</span>
              <p className="text-sm italic font-medium">Keine ausstehenden Anfragen.</p>
            </div>
          )
        )}

        {/* Ansicht: Online/Alle Freunde */}
        {filter !== 'pending' && (
          (() => {
            const filteredFriends = friends.filter(f => filter === 'all' || f.status === 'online');
            return filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-[#35373c] rounded-lg group cursor-pointer transition-all active:bg-[#3f4147]">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 bg-[#4e5058] rounded-full flex items-center justify-center text-white font-bold">
                        {friend.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[3px] border-[#313338] ${
                        friend.status === 'online' ? 'bg-[#23a55a]' : 'bg-[#80848e]'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center gap-1">
                        <span className="text-white font-bold text-sm leading-none">{friend.display_name}</span>
                        <span className="text-gray-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          #{friend.migo_tag?.split('#')[1]}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-medium truncate max-w-[150px]">
                        {friend.custom_status || (friend.status === 'online' ? 'Online' : 'Offline')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 bg-[#1e1f22] text-gray-300 hover:text-white rounded-full transition-colors shadow-sm">💬</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 opacity-60">
                <span className="text-3xl">💬</span>
                <p className="text-sm italic font-medium">Hier ist gerade niemand zu finden.</p>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}