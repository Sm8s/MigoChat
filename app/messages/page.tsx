'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MessagesPage() {
  const router = useRouter();
  
  // Beispiel-Daten für die Eleganz
  const contacts = [
    { id: 1, name: 'Maximilian', status: 'Online', lastMsg: 'Das Design sieht Hammer aus.', time: '14:20' },
    { id: 2, name: 'Sarah Schmidt', status: 'Abwesend', lastMsg: 'Schickst du mir die Files?', time: 'Gestern' },
  ];

  return (
    <div className="flex h-screen bg-[#111214] text-gray-100 font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar: Kontaktliste */}
      <aside className="w-80 border-r border-white/5 bg-[#2b2d31] flex flex-col">
        <header className="h-16 flex items-center px-6 border-b border-white/5 justify-between">
          <h1 className="text-xl font-bold tracking-tight text-white">Messages</h1>
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200 border border-transparent hover:border-white/10">
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {contact.name[0]}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#2b2d31] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold truncate">{contact.name}</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">{contact.time}</span>
                </div>
                <p className="text-sm text-gray-400 truncate group-hover:text-gray-300">{contact.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-[#313338]">
        {/* Chat Header */}
        <header className="h-16 flex items-center px-8 border-b border-white/5 bg-[#313338]/80 backdrop-blur-md sticky top-0 z-10 justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-2xl font-light">#</span>
            <span className="font-bold text-white tracking-wide">maximilian_vibe</span>
          </div>
          <div className="flex gap-4 text-gray-400">
            <button className="hover:text-white transition-colors">🔍</button>
            <button className="hover:text-white transition-colors">🔔</button>
          </div>
        </header>

        {/* Messages Flow */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Beispiel Nachricht Empfangen */}
          <div className="flex gap-4 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-indigo-600 shrink-0 shadow-inner"></div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-indigo-400">Maximilian</span>
                <span className="text-[10px] text-gray-500">14:20</span>
              </div>
              <div className="bg-[#2b2d31] p-4 rounded-2xl rounded-tl-none border border-white/5 text-gray-200 leading-relaxed shadow-sm">
                Hey! Hast du die neuen UI-Komponenten schon gesehen? Wir spielen jetzt in einer ganz anderen Liga. 🚀
              </div>
            </div>
          </div>

          {/* Beispiel Nachricht Gesendet */}
          <div className="flex gap-4 max-w-2xl ml-auto flex-row-reverse">
            <div className="w-10 h-10 rounded-full bg-gray-700 shrink-0 shadow-inner"></div>
            <div className="space-y-1 items-end flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-gray-500">14:22</span>
                <span className="font-bold text-white">Du</span>
              </div>
              <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none text-white leading-relaxed shadow-xl shadow-indigo-500/10">
                Sieht extrem clean aus. Besonders die Transparenz-Effekte!
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <footer className="p-6">
          <div className="max-w-4xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Nachricht an #maximilian_vibe"
              className="w-full bg-[#383a40] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 text-gray-200 placeholder-gray-500 transition-all shadow-2xl"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 text-gray-400">
              <button className="hover:text-indigo-400 transition-colors">🎁</button>
              <button className="hover:text-indigo-400 transition-colors">😊</button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}