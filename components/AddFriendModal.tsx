'use client';

import { useState } from 'react';
import { sendFriendRequestByTag } from '@/lib/migo-logic';

type Props = {
  currentUserId: string;
  onSuccess?: () => void;
};

function extractTag(input: string) {
  const raw = input.trim();
  const tag = raw.includes('#') ? raw.split('#').pop()!.trim() : raw;
  return tag.toUpperCase();
}

export default function AddFriendModal({ currentUserId, onSuccess }: Props) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    setStatus('');

    if (!currentUserId) {
      setStatus('Nicht eingeloggt.');
      return;
    }

    const userInput = input.trim();
    if (!userInput) {
      setStatus('Bitte MigoTag oder Username eingeben. Beispiel: Emmo#ABCD');
      return;
    }
    try {
      setBusy(true);
      const result = await sendFriendRequestByTag(currentUserId, userInput);
      setStatus(result.message);
      if (result.ok) {
        setInput('');
        onSuccess?.();
      }
    } catch (e: any) {
      setStatus(e?.message ?? 'Fehler beim Senden.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-white mb-2">Freund hinzufügen</h3>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Name#TAG (z.B. Emmo#LK55)"
        className="bg-black text-white p-2 rounded w-full border border-gray-600 mb-2 outline-none focus:border-indigo-500"
      />

      <button
        onClick={handleAdd}
        disabled={busy}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded w-full font-semibold"
      >
        {busy ? 'Sende...' : 'Freundschaftsanfrage senden'}
      </button>

      {status && <p className="text-sm mt-2 text-gray-400">{status}</p>}
    </div>
  );
}
