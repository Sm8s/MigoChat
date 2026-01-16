'use client';
import { useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { generateMigoTag } from '@/lib/migo-logic';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Eindeutiger Migo-Name
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const router = useRouter();

  const checkStrength = (pw: string) => {
    if (pw.length === 0) return { w: '0%', c: 'bg-gray-600', t: '' };
    if (pw.length < 6) return { w: '30%', c: 'bg-red-500', t: 'Schwach' };
    if (pw.length < 10) return { w: '60%', c: 'bg-yellow-500', t: 'Mittel' };
    return { w: '100%', c: 'bg-green-500', t: 'Stark' };
  };

  const strength = checkStrength(password);

  // LOGIK: Username vergessen
  const handleForgotUsername = async () => {
    if (!email) return setErrorMsg("Gib deine E-Mail an, um deinen Username zu finden.");
    const { data, error } = await supabase
      .from('profiles')
      .select('migo_tag')
      .eq('email_internal', email) // Wir nutzen ein internes Feld für die Suche
      .single();
    
    if (data) setInfoMsg(`Dein MigoTag ist: ${data.migo_tag}`);
    else setErrorMsg("Kein Account mit dieser E-Mail gefunden.");
  };

  // LOGIK: Passwort vergessen
  const handleForgotPassword = async () => {
    if (!email) return setErrorMsg("Gib deine E-Mail ein.");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErrorMsg(error.message);
    else setInfoMsg("Check deine E-Mails zum Zurücksetzen.");
  };

  const handleAuth = async () => {
    setErrorMsg('');
    setInfoMsg('');
    
    if (isRegister) {
      if (!username) return setErrorMsg("Username fehlt!");
      if (password !== confirmPassword) return setErrorMsg("Passwörter ungleich!");
      
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return setErrorMsg(error.message);
      
      if (data.user) {
        const tag = generateMigoTag(username);
        // Profil erstellen inklusive E-Mail für die spätere Suche
        await supabase.from('profiles').insert([{ 
          id: data.user.id, 
          display_name: username, 
          migo_tag: tag,
          email_internal: email 
        }]);
        setInfoMsg("Account erstellt! Bitte E-Mail bestätigen.");
      }
    } else {
      // LOGIN: Entweder per E-Mail oder Username
      let loginEmail = email;
      
      if (!email.includes('@')) {
        // Wenn kein @ im Feld ist, suchen wir den Usernamen in der DB
        const { data } = await supabase
          .from('profiles')
          .select('email_internal')
          .eq('display_name', email)
          .single();
        if (data) loginEmail = data.email_internal;
      }

      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) setErrorMsg("Login fehlgeschlagen. Daten prüfen.");
      else router.push('/'); // Weiterleitung zum Chat
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center font-sans">
      <div className="bg-[#313338] p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-800">
        <h1 className="text-white text-3xl font-black mb-8 text-center tracking-tighter italic">MIGOCHAT</h1>
        
        <div className="space-y-4">
          {isRegister && (
            <input type="text" placeholder="Wähle deinen Username" onChange={e => setUsername(e.target.value)}
              className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all" />
          )}
          
          <input type="text" placeholder={isRegister ? "E-Mail Adresse" : "Username oder E-Mail"} 
            onChange={e => setEmail(e.target.value)}
            className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all" />
          
          <div className="relative">
            <input type="password" placeholder="Passwort" onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all" />
            {isRegister && (
              <div className="mt-2 h-1 w-full bg-gray-700 rounded overflow-hidden">
                <div className={`h-full transition-all duration-500 ${strength.c}`} style={{ width: strength.w }}></div>
              </div>
            )}
          </div>

          {isRegister && (
            <input type="password" placeholder="Passwort wiederholen" onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-[#1e1f22] text-white rounded outline-none border border-transparent focus:border-indigo-500 transition-all" />
          )}

          {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
          {infoMsg && <p className="text-green-400 text-xs text-center">{infoMsg}</p>}

          <button onClick={handleAuth} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded transition-colors shadow-lg">
            {isRegister ? 'JETZT REGISTRIEREN' : 'EINLOGGEN'}
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-sm text-center">
          <button onClick={() => setIsRegister(!isRegister)} className="text-indigo-400 hover:text-indigo-300">
            {isRegister ? 'Doch lieber einloggen?' : 'Noch kein Migo? Account erstellen'}
          </button>
          
          <div className="flex justify-around text-[11px] text-gray-500">
            <button onClick={handleForgotUsername} className="hover:text-gray-300">Username vergessen?</button>
            <button onClick={handleForgotPassword} className="hover:text-gray-300">Passwort vergessen?</button>
          </div>
        </div>
      </div>
    </div>
  );
}