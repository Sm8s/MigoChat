"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import Sidebar from '@/components/Sidebar';

/**
 * Aura Page
 *
 * Provides a full view of the premium subscription offering. Users can
 * see the list of premium perks, check the current subscription
 * status, and initiate a purchase via Stripe Checkout. The real
 * implementation of the API endpoints and DB logic is required for
 * production but beyond the scope of this placeholder.
 */
export default function AuraPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (!error && currentSession) {
        setSession(currentSession);
        // Load subscription status from the database
        const { data, error: subErr } = await supabase
          .from('aura_subscriptions')
          .select('status, current_period_end')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();
        if (!subErr) setSubscription(data);
      }
      setLoading(false);
    };
    loadSession();
  }, []);

  const handleClaim = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert('Checkout konnte nicht gestartet werden.');
      }
    } catch (err) {
      console.error(err);
      alert('Fehler beim Starten des Checkouts');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-gray-400">
        Lade ...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen bg-[#0a0a0c] flex items-center justify-center text-gray-400">
        Bitte logge dich ein, um auf Aura zuzugreifen.
      </div>
    );
  }

  const perks = [
    { icon: '👻', title: 'Ghost Mode', desc: 'Werde unsichtbar, auch wenn du online bist.' },
    { icon: '🌟', title: 'Animated Avatar', desc: 'Animierter Rahmen für dein Profilbild.' },
    { icon: '🎨', title: 'Premium Themes', desc: 'Gradient‑Hintergründe und exklusive Farben.' },
    { icon: '🏷️', title: 'Custom Badge', desc: 'Wähle deinen eigenen Badge‑Text.' },
    { icon: '✨', title: 'Extra Reactions', desc: 'Exklusive Reaktions‑Emojis.' },
    { icon: '🕒', title: 'Story+', desc: 'Stories halten 48h und können als Highlight angepinnt werden.' },
    { icon: '🔐', title: 'Vault Access', desc: 'Verschlüsselter privater Speicher.' },
    { icon: '🎤', title: 'Message Upgrades', desc: 'Voice‑Notes und größere Uploads.' },
    { icon: '🚀', title: 'Boost Credits', desc: 'Monatlich 3 Boosts für deine Posts.' },
  ];

  const isActive = subscription && subscription.status === 'active';

  return (
    <div className="flex h-screen bg-[#0a0a0c] text-gray-100 font-sans overflow-hidden">
      <Sidebar currentUserId={session.user.id} mobileOpen={false} onCloseMobile={() => {}} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1f22] md:my-2 md:mr-2 md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.03] overflow-hidden relative">
        <header className="h-20 flex items-center px-10 bg-[#1e1f22]/80 backdrop-blur-2xl border-b border-white/[0.03]">
          <h1 className="text-4xl font-black uppercase tracking-widest">Migo Aura</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black italic bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">Ultimate Aura</h2>
              <p className="text-gray-400 font-medium">Entdecke die volle Liste von Premium‑Features und revolutioniere dein Migo‑Erlebnis.</p>
            </div>
            {/* Perk list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {perks.map((perk, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl">
                  <div className="text-3xl">{perk.icon}</div>
                  <div>
                    <p className="text-lg font-bold text-gray-200">{perk.title}</p>
                    <p className="text-xs text-gray-500">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Purchase or status */}
            <div className="flex flex-col items-center space-y-4 bg-white/[0.02] p-8 rounded-3xl border border-white/[0.05]">
              {isActive ? (
                <>
                  <p className="text-green-400 font-bold text-lg">Aura aktiv</p>
                  <p className="text-gray-400 text-sm">Nächste Abrechnung am {new Date(subscription.current_period_end).toLocaleDateString()}</p>
                  <button
                    onClick={() => {}}
                    className="bg-white text-black px-10 py-3 rounded-2xl font-black uppercase text-sm tracking-wide hover:scale-105 active:scale-95 transition-all"
                  >
                    Manage Subscription
                  </button>
                </>
              ) : (
                <>
                  <p className="text-5xl font-black mb-2 italic">€8.99</p>
                  <p className="text-gray-500 text-xs uppercase tracking-widest">Pro Monat</p>
                  <button
                    onClick={handleClaim}
                    className="bg-white text-black px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-wide hover:scale-105 active:scale-95 transition-all"
                  >
                    Claim Your Aura
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}