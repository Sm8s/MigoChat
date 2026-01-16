'use client';
import { supabase } from '@/app/supabaseClient';
import { generateMigoTag } from '@/lib/migo-logic';

export default function ProfileSetup() {
  const setupProfile = async (userId: string, username: string) => {
    const tag = generateMigoTag(username); // Erstellt eindeutigen MigoTag
    
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      display_name: username,
      migo_tag: tag,
      status: 'online'
    });

    if (!error) alert(`Dein MigoTag ist: ${tag}`);
  };

  return (
    <div className="text-white p-10">
      <h1>Willkommen bei MigoChat</h1>
      {/* Hier würdest du ein Eingabefeld für den Usernamen platzieren */}
    </div>
  );
}