"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import {
  createGroupConversation,
  fetchGroupConversations,
} from '@/lib/migo-logic';
import type { GroupProfile } from '@/lib/types';

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupProfile[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Load existing group conversations for current user
  useEffect(() => {
    const loadGroups = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const convs = await fetchGroupConversations(uid);
      setGroups(convs);
    };
    loadGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      await createGroupConversation(uid, title.trim());
      const convs = await fetchGroupConversations(uid);
      setGroups(convs);
      setTitle('');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Group Conversations</h1>
      <form onSubmit={handleCreate} className="mb-4 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Group title"
          className="w-full p-2 bg-[#2b2d31] text-white rounded-md focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-md"
        >
          {loading ? 'Creating…' : 'Create Group'}
        </button>
      </form>
      <div className="space-y-2">
        {groups.length === 0 ? (
          <p className="text-gray-400">No groups yet.</p>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              className="p-3 bg-[#232428] rounded-md border border-[#2b2d31]"
            >
              <h2 className="text-lg font-semibold">{g.title}</h2>
              <p className="text-xs text-gray-400">Created: {new Date(g.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}