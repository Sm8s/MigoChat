"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMessageRequests, respondMessageRequest } from '@/lib/migo-logic';
import { supabase } from '@/app/supabaseClient';

/**
 * Page to manage message requests. Users can see inbound requests from people who
 * want to message them, accept or decline them, and view requests they have
 * sent to others. Accepting a request will open a new DM with the requester.
 */
export default function RequestsPage() {
  const router = useRouter();
  const [inbound, setInbound] = useState<any[]>([]);
  const [outbound, setOutbound] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const { inbound, outbound } = await fetchMessageRequests(user.id);
        setInbound(inbound);
        setOutbound(outbound);
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await respondMessageRequest(id, status);
      setInbound((prev) => prev.filter((req) => req.id !== id));
      if (status === 'accepted') {
        // reload messages to open conversation; for now just navigate to messages page
        router.push('/messages');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Lädt…</div>;
  }
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white mb-4">Nachrichtenanfragen</h1>
      {error && <div className="text-red-500">{error}</div>}
      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Eingehende Anfragen</h2>
        {inbound.length === 0 && (
          <p className="text-gray-400">Keine Nachrichtenanfragen.</p>
        )}
        <ul className="space-y-3">
          {inbound.map((req) => (
            <li key={req.id} className="flex items-center justify-between p-3 bg-[#2b2d31] rounded-lg">
              <div className="text-gray-200">
                Anfrage von&nbsp;
                <strong>{req.requester_id}</strong>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRespond(req.id, 'accepted')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md"
                >
                  Annehmen
                </button>
                <button
                  onClick={() => handleRespond(req.id, 'rejected')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Ablehnen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Ausgehende Anfragen</h2>
        {outbound.length === 0 && (
          <p className="text-gray-400">Du hast keine offenen Anfragen gesendet.</p>
        )}
        <ul className="space-y-2 text-gray-400">
          {outbound.map((req) => (
            <li key={req.id} className="p-2 bg-[#2b2d31] rounded-lg">
              An&nbsp;<strong>{req.recipient_id}</strong>&nbsp;– Status: {req.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}