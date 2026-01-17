"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Vault Page
 *
 * Provides a private encrypted storage area for Aura subscribers. This
 * placeholder page demonstrates the UI for uploading and listing files
 * in the vault. The real implementation will interact with a
 * Supabase Storage bucket and the `vault_files` table.
 */
export default function VaultPage() {
  const [session, setSession] = useState<any>(null);
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (!error) setSession(currentSession);
    };
    loadSession();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      setFiles((prev) => [...prev, fileList[0].name]);
    }
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
          <h1 className="text-3xl font-black uppercase tracking-widest">Vault</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-gray-400">Der Vault ist dein privater, verschlüsselter Speicher für Dateien. Nur du hast Zugriff auf deine Inhalte.</p>
            <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl">
              <label className="block text-gray-200 font-medium mb-2">Datei hochladen</label>
              <input type="file" onChange={handleFileChange} className="w-full text-gray-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-3">Deine Dateien</h2>
              <ul className="space-y-2">
                {files.length === 0 ? (
                  <li className="text-gray-500">Noch keine Dateien hochgeladen.</li>
                ) : (
                  files.map((fname, i) => (
                    <li key={i} className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl">
                      <span className="text-gray-200 text-sm">{fname}</span>
                      <button className="text-red-400 text-xs hover:underline">Löschen</button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}