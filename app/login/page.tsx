'use client';
import { useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { generateMigoTag } from '@/lib/migo-logic';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Passwort-Stärke berechnen
  const getPasswordStrength = (pw: string) => {
    if (pw.length === 0) return { label: '', color: 'bg-gray-700', width: '0%' };
    if (pw.length < 6) return { label: 'Schwach', color: 'bg-red-500', width: '33%' };
    if (pw.length < 10) return { label: 'Gut', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Stark', color: 'bg-green-500', width: '100%' };
  };

  const strength = getPasswordStrength(password);

  const handleAuth = async () => {
    if (isRegister) {
      if (password !== confirmPassword) {
        alert("Passwörter stimmen nicht überein!");
        return;
      }
      
      // 1. Registrierung bei Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authData.user) {
        // 2. MigoTag generieren und Profil erstellen
        const migoTag = generateMigoTag(username); 
        await supabase.from('profiles').insert([
          { id: authData.user.id, display_name: username, migo_tag: migoTag }
        ]);
        alert(`Registriert! Dein Tag: ${migoTag}`);
      }
    } else {
      // Login Logik (Username/Email Handling)
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1f22] flex items-center justify-center text-white p-4">
      <div className="bg-[#313338] p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isRegister ? 'Konto erstellen' : 'Willkommen zurück!'}
        </h1>
        
        <div className="space-y-4">
          {isRegister && (
            <input 
              type="text" placeholder="Username" 
              className="w-full p-2 bg-[#1e1f22] rounded border border-gray-700"
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
          
          <input 
            type="email" placeholder="Email" 
            className="w-full p-2 bg-[#1e1f22] rounded border border-gray-700"
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <input 
            type="password" placeholder="Passwort" 
            className="w-full p-2 bg-[#1e1f22] rounded border border-gray-700"
            onChange={(e) => setPassword(e.target.value)}
          />

          {isRegister && (
            <>
              <input 
                type="password" placeholder="Passwort bestätigen" 
                className="w-full p-2 bg-[#1e1f22] rounded border border-gray-700"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {/* Passwort-Stärke-Anzeige */}
              <div className="w-full h-1 bg-gray-700 rounded mt-1">
                <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Stärke: {strength.label}</p>
            </>
          )}

          <button onClick={handleAuth} className="w-full bg-indigo-600 hover:bg-indigo-700 p-2 rounded font-bold">
            {isRegister ? 'Registrieren' : 'Anmelden'}
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 text-sm">
          <button onClick={() => setIsRegister(!isRegister)} className="text-indigo-400 hover:underline">
            {isRegister ? 'Bereits ein Konto? Login' : 'Noch kein Konto? Registrieren'}
          </button>
          
          {!isRegister && (
            <div className="flex gap-4">
              <button className="text-gray-400 hover:text-white text-xs">Username vergessen?</button>
              <button className="text-gray-400 hover:text-white text-xs">Passwort vergessen?</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}