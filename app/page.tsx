"use client";

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function MigoChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  // 1. Nachrichten beim Laden abrufen
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
      if (error) console.error("Fehler beim Laden:", error);
    };

    fetchMessages();

    // 2. Realtime: Auf neue Nachrichten hören
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((current) => [...current, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Nachricht senden
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([{ content: input, user_id: '00000000-0000-0000-0000-000000000000' }]); // Test-ID

    if (error) {
      alert("Fehler beim Senden! Hast du die Tabelle in Supabase erstellt?");
      console.error(error);
    } else {
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      <header className="p-4 border-b border-slate-700 bg-slate-800 shadow-md">
        <h1 className="text-2xl font-bold text-blue-400 text-center">MigoChat</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 w-fit max-w-[80%]">
            <p className="text-sm text-blue-300 font-bold mb-1">User</p>
            <p className="text-gray-100">{msg.content}</p>
          </div>
        ))}
      </main>

      <form onSubmit={sendMessage} className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input 
          className="flex-1 bg-slate-900 border border-slate-600 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nachricht an MigoChat..."
        />
        <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-bold transition">
          Senden
        </button>
      </form>
    </div>
  );
}