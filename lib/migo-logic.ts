import { supabase } from '@/app/supabaseClient';

// WICHTIG: Das "export" muss hier stehen!
export const generateMigoTag = (username: string) => {
  const hex = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  return `${username.toLowerCase()}#${hex}`; // Beispiel: banje#7421
};