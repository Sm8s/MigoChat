"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Send, User } from 'lucide-react';

export default function MigoChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatisches Scrollen nach unten
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
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
      .insert([{ 
        content: input, 
        user_id: '00000000-0000-0000-0000-000000000000' 
      }]);

    if (error) {
      alert("Fehler beim Senden! Tabelle 'messages' vorhanden?");
      console.error(error);
    } else {
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-slate-100">
      {/* Header */}
      <header className="p-4 border-b border-slate-700 bg-[#1e293b]/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter text-blue-400">
          MIGO<span className="text-white">CHAT</span>
        </h1>
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
      </header>

      {/* Chat-Bereich */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-10">
            <p>Noch keine Nachrichten. Schreib etwas!</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className="flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="bg-[#1e293b] p-4 rounded-2xl rounded-bl-none border border-slate-700 w-fit max-w-[85%] shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">User</span>
              </div>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
            <span className="text-[9px] text-slate-500 mt-1 ml-1">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Eingabebereich */}
      <form onSubmit={sendMessage} className="p-4 bg-[#1e293b] border-t border-slate-700 flex gap-2 items-center">
        <input 
          className="flex-1 bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Schreibe eine Nachricht..."
        />
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}