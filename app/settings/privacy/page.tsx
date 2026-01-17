"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Privacy Settings Page
 *
 * Allows users to toggle privacy options such as Ghost Mode and
 * controlling whether non‑friends can send message requests. In the
 * future this page will persist the settings to the database and use
 * entitlements to determine available options. For now, it is a
 * placeholder with toggle switches.
 */
export default function PrivacySettingsPage() {
  const [session, setSession] = useState<any>(null);
  const [settings, setSettings] = useState({
    ghostMode: false,
    allowMessageRequests: true,
  });

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (!error) setSession(currentSession);
    };
    loadSession();
  }, []);

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!session) {
    return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-gray-400">
        Lade ...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans overflow-hidden">
      <Sidebar currentUserId={session.user.id} mobileOpen={false} onCloseMobile={() => {}} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f22] md:my-2 md:mr-2 md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.03] overflow-hidden relative">
        <header className="h-20 flex items-center px-10 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03]">
          <h1 className="text-3xl font-black uppercase tracking-widest">Privatsphäre</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold mb-4">Privatsphäre & Sicherheit</h2>
            {(
              [
                { key: 'ghostMode', label: 'Ghost Mode (unsichtbar erscheinen)' },
                { key: 'allowMessageRequests', label: 'Nachrichtenanfragen von Nicht‑Freunden' },
              ] as { key: keyof typeof settings; label: string }[]
            ).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl">
                <span className="text-gray-200 font-medium">{label}</span>
                <button
                  onClick={() => toggle(key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? 'bg-indigo-600' : 'bg-gray-600'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}