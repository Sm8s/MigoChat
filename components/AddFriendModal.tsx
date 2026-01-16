'use client';
import { useState } from 'react';
import { sendFriendRequest } from '@/lib/migo-logic';

export default function AddFriendModal({ currentUserId }: { currentUserId: string }) {
  const [migoTag, setMigoTag] = useState('');
  const [status, setStatus] = useState('');

  const handleAdd = async () => {
    const result = await sendFriendRequest(currentUserId, migoTag);
    setStatus(result.message);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-white mb-2">Freund hinzufügen</h3>
      <input 
        value={migoTag}
        onChange={(e) => setMigoTag(e.target.value)}
        placeholder="Name#1234"
        className="bg-black text-white p-2 rounded w-full border border-gray-600 mb-2"
      />
      <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
        Freundschaftsanfrage senden
      </button>
      {status && <p className="text-sm mt-2 text-gray-400">{status}</p>}
    </div>
  );
}