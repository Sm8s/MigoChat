'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  // Single email state for both login and registration
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // only used when registering
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const strength = useMemo(() => {
    if (password.length === 0) return { w: '0%', c: 'bg-gray-600', t: '' };
    if (password.length < 6) return { w: '30%', c: 'bg-red-500', t: 'Schwach' };
    if (password.length < 10) return { w: '60%', c: 'bg-yellow-500', t: 'Mittel' };
    return { w: '100%', c: 'bg-green-500', t: 'Stark' };
  }, [password]);

  // Login erfolgt nur über die E‑Mail. Eine Auflösung von Benutzernamen zu E‑Mail findet nicht mehr statt.

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!email.trim()) {
      setErrorMsg('Bitte gib deine E-Mail ein.');
      return;
    }
    try {
      setBusy(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) setErrorMsg(error.message);
      else setInfoMsg('Check deine E-Mails zum Zurücksetzen.');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Fehler beim Zurücksetzen.');
    } finally {
      setBusy(false);
    }
  };

  const handleAuth = async () => {
    setErrorMsg('');
    setInfoMsg('');

    try {
      setBusy(true);

      if (isRegister) {
        const mail = email.trim().toLowerCase();
        const name = username.trim();

        if (!mail.includes('@')) throw new Error('Bitte eine gültige E-Mail eingeben.');
        if (!name) throw new Error('Username fehlt!');
        if (password !== confirmPassword) throw new Error('Passwörter sind ungleich.');

        const { error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            data: { username: name }, // <-- wichtig für Trigger
          },
        });

        if (error) throw new Error(error.message);

        setInfoMsg('Account erstellt! Bitte E-Mail bestätigen.');
        return;
      }

      // LOGIN: nur über E-Mail möglich
      const mail = email.trim().toLowerCase();
      if (!mail.includes('@')) throw new Error('Bitte eine gültige E-Mail eingeben.');
      const { error } = await supabase.auth.signInWithPassword({
        email: mail,
        password,
      });

      if (error) throw new Error('Login fehlgeschlagen. Daten prüfen.');

      router.push('/');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Unbekannter Fehler.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center font-sans">
      <div className="bg-[#313338] p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-800">
        <h1 className="text-white text-3xl font-black mb-8 text-center tracking-tighter italic">
          MIGOCHAT
        </h1>

        <div className="space-y-4">
          {isRegister ? (
            <>
              <input
                type="text"
                placeholder="Wähle deinen Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
              />

              <input
                type="email"
                placeholder="E-Mail Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
              />
            </>
          ) : (
            <input
              type="email"
              placeholder="E-Mail Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
            />
          )}

          <div className="relative">
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
            />

            {isRegister && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Stärke</span>
                  <span>{strength.t}</span>
                </div>
                <div className="h-1 w-full bg-gray-700 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${strength.c}`}
                    style={{ width: strength.w }}
                  />
                </div>
              </div>
            )}
          </div>

          {isRegister && (
            <input
              type="password"
              placeholder="Passwort wiederholen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all"
            />
          )}

          {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
          {infoMsg && <p className="text-green-400 text-xs text-center">{infoMsg}</p>}

          <button
            disabled={busy}
            onClick={handleAuth}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold p-3 rounded transition-colors shadow-lg"
          >
            {busy ? '...' : isRegister ? 'JETZT REGISTRIEREN' : 'EINLOGGEN'}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-center">
          <button
            onClick={() => {
              setErrorMsg('');
              setInfoMsg('');
              setPassword('');
              setConfirmPassword('');
              setIsRegister(!isRegister);
            }}
            className="text-indigo-400 hover:text-indigo-300"
          >
            {isRegister ? 'Doch lieber einloggen?' : 'Noch kein Migo? Account erstellen'}
          </button>

          {!isRegister && (
            <div className="flex justify-around text-[11px] text-gray-500">
              <button disabled={busy} onClick={handleForgotPassword} className="hover:text-gray-300">
                Passwort vergessen?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
