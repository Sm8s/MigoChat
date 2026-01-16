'use client';

import { useState } from 'react';
import { sendFriendRequest } from '@/lib/migo-logic';

type Props = {
  currentUserId: string;
  onSuccess?: () => void;
};

function extractTag(input: string) {
  const raw = input.trim();

  // erlaubt: "AB12" oder "Name#AB12"
  const tag = raw.includes('#') ? raw.split('#').pop()!.trim() : raw;
  return tag.toUpperCase();
}

export default function AddFriendModal({ currentUserId, onSuccess }: Props) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    setStatus('');

    const tag = extractTag(value);

    // 2 Buchstaben + 2 Zahlen
    if (!/^[A-Z]{2}[0-9]{2}$/.test(tag)) {
      setStatus('MigoTag falsch. Beispiel: Name#AB12 (oder nur AB12)');
      return;
    }

    try {
      setBusy(true);
      await sendFriendRequest(currentUserId, tag);
      setStatus('Freundschaftsanfrage gesendet!');
      setValue('');
      onSuccess?.();
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name#AB12 oder AB12"
        className="bg-black text-white p-2 rounded w-full border border-gray-600 mb-2 outline-none focus:border-indigo-500"
      />

      <button
        onClick={handleAdd}
        disabled={busy || !currentUserId}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded w-full font-semibold"
      >
        {busy ? 'Sende...' : 'Freundschaftsanfrage senden'}
      </button>

      {status && <p className="text-sm mt-2 text-gray-400">{status}</p>}
    </div>
  );
}
