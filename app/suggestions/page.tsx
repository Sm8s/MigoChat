"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { fetchFriendSuggestions } from '@/lib/migo-logic';
import type { Profile } from '@/lib/types';

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const data = await fetchFriendSuggestions(uid);
      setSuggestions(data);
    };
    load();
  }, []);

  const handleAddFriend = async (suggestedId: string) => {
    setLoadingIds((s) => new Set(s).add(suggestedId));
    try {
      await supabase.rpc('request_friend', { other_id: suggestedId });
    } catch (err) {
      console.error(err);
    }
    setLoadingIds((s) => {
      const newSet = new Set(s);
      newSet.delete(suggestedId);
      return newSet;
    });
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Friend Suggestions</h1>
      {suggestions.length === 0 ? (
        <p className="text-gray-400">No suggestions at this time.</p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((p) => (
            <li
              key={p.id}
              className="p-3 bg-[#232428] rounded-md border border-[#2b2d31] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {p.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-sm font-medium">{p.username}#{p.migo_tag}</span>
              </div>
              <button
                onClick={() => handleAddFriend(p.id)}
                disabled={loadingIds.has(p.id)}
                className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm"
              >
                {loadingIds.has(p.id) ? 'Sending…' : 'Add Friend'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}