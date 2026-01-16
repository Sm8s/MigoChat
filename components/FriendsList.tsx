'use client';
import { useEffect, useState } from 'react';
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
  const [filter, setFilter] = useState<'all' | 'online' | 'pending'>('all');

  const fetchData = async () => {
    // 1. Lade akzeptierte Freunde
    const { data: friendships } = await supabase
      .from('friendships')
      .select(`
        id,
        sender:profiles!friendships_sender_id_fkey(id, display_name, migo_tag, status, custom_status),
        receiver:profiles!friendships_receiver_id_fkey(id, display_name, migo_tag, status, custom_status)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    // 2. Lade ausstehende Anfragen
    const { data: requests } = await supabase
      .from('friendships')
      .select(`id, sender:profiles!friendships_sender_id_fkey(display_name, migo_tag)`)
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending');

    if (friendships) {
      const list = friendships.map((f: any) => 
        f.sender.id === currentUserId ? f.receiver : f.sender
      );
      // Sortierung: Online zuerst, dann Alphabet
      const sorted = list.sort((a, b) => (a.status === 'online' ? -1 : 1) || a.display_name.localeCompare(b.display_name));
      setFriends(sorted);
    }
    if (requests) setPendingRequests(requests);
  };

  useEffect(() => { fetchData(); }, [currentUserId]);

  return (
    <div className="flex-1 bg-[#313338] flex flex-col overflow-hidden">
      {/* Tab-Navigation für die Liste */}
      <div className="h-12 border-b border-gray-800 flex items-center px-4 space-x-4">
        <button onClick={() => setFilter('online')} className={`px-2 py-1 rounded ${filter === 'online' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Online</button>
        <button onClick={() => setFilter('all')} className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Alle</button>
        <button onClick={() => setFilter('pending')} className={`px-2 py-1 rounded relative ${filter === 'pending' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>
          Ausstehend
          {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{pendingRequests.length}</span>}
        </button>
      </div>

      <div className="p-4 overflow-y-auto">
        {/* Anzeige der Anfragen (Flow 8.1) */}
        {filter === 'pending' && pendingRequests.map(req => (
          <div key={req.id} className="flex items-center justify-between p-3 border-b border-gray-700">
            <div>
              <span className="text-white font-bold">{req.sender.display_name}</span>
              <span className="text-gray-500 text-sm ml-1">#{req.sender.migo_tag.split('#')[1]}</span>
            </div>
            <div className="space-x-2">
              <button onClick={async () => { await acceptFriendRequest(req.id); fetchData(); }} className="bg-green-600 text-white p-1 rounded">Annehmen</button>
              <button onClick={async () => { await declineFriendRequest(req.id); fetchData(); }} className="bg-red-600 text-white p-1 rounded">Ablehnen</button>
            </div>
          </div>
        ))}

        {/* Anzeige der Freunde (Sortierung 5.1) */}
        {filter !== 'pending' && friends.filter(f => filter === 'all' || f.status === 'online').map(friend => (
          <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-gray-700 rounded-lg group">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gray-600 rounded-full" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#313338] ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="text-white font-bold">{friend.display_name}</span>
                  <span className="text-gray-500 text-xs ml-1 invisible group-hover:visible">#{friend.migo_tag.split('#')[1]}</span>
                </div>
                <div className="text-xs text-gray-400">{friend.custom_status || friend.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}