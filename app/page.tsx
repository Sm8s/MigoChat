import React, { useState } from 'react';

export default function MigoChat() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey! Willkommen bei MigoChat", user: "System" },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    setMessages([...messages, { id: Date.now(), text: input, user: "Du" }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 p-4 text-white text-center font-bold text-xl shadow-lg">
        MigoChat 💬
      </header>

      {/* Nachrichtenbereich */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.user === 'Du' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs p-3 rounded-lg ${msg.user === 'Du' ? 'bg-blue-500 text-white' : 'bg-white shadow'}`}>
              <p className="text-xs opacity-70 mb-1">{msg.user}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </main>

      {/* Eingabebereich */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Schreibe eine Nachricht..." 
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
          Senden
        </button>
      </form>
    </div>
  );
}