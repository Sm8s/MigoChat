import { supabase } from '@/app/supabaseClient';

export const ensureUserProfile = async (userId: string, email: string) => {
  // Prüfen, ob Profil existiert
  const { data: existing } = await supabase
    .from('profiles')
    .select('migo_tag')
    .eq('id', userId)
    .single();

  if (existing) return existing;

  // Wenn nicht, neues Profil mit MigoTag erstellen
  const username = email.split('@')[0];
  const hexCode = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  const migoTag = `${username}#${hexCode}`;

  const { data, error } = await supabase
    .from('profiles')
    .insert([{ 
      id: userId, 
      display_name: username, 
      migo_tag: migoTag,
      status: 'online' 
    }])
    .select()
    .single();

  return data;
};