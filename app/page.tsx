'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Wenn nicht eingeloggt, schicke den User sofort zur Login-Seite
        router.push('/login');
      } else {
        setSession(session);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) return <div className="bg-[#1e1f22] h-screen" />; // Kurzer Ladebildschirm

  return (
    <div className="flex h-screen bg-[#313338]">
      <Sidebar currentUserId={session.user.id} />
      <main className="flex-1 flex items-center justify-center text-gray-500">
        <p>Wähle einen Freund aus oder suche per MigoTag!</p>
      </main>
    </div>
  );
}