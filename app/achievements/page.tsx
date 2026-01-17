"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { fetchAchievements } from '@/lib/migo-logic';
import type { Achievement } from '@/lib/types';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const list = await fetchAchievements(uid);
      setAchievements(list);
    };
    load();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Achievements</h1>
      {achievements.length === 0 ? (
        <p className="text-gray-400">You have not earned any achievements yet.</p>
      ) : (
        <ul className="space-y-3">
          {achievements.map((ach) => (
            <li
              key={ach.id}
              className="p-3 bg-[#232428] rounded-md border border-[#2b2d31]"
            >
              <h2 className="text-lg font-semibold">{ach.name}</h2>
              <p className="text-sm text-gray-300">{ach.description}</p>
              <p className="text-xs text-gray-500">{new Date(ach.created_at).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}