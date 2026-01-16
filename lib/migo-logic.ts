import { supabase } from '@/app/supabaseClient';

/**
 * Generiert einen eindeutigen MigoTag bestehend aus dem Usernamen und einem 4-stelligen Hex-Code.
 * Beispiel: banje#7421
 */
export const generateMigoTag = (username: string) => {
  const hex = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  return `${username.toLowerCase()}#${hex}`;
};

/**
 * Sendet eine Freundschaftsanfrage an einen User basierend auf seinem MigoTag.
 */
export const sendFriendRequest = async (currentUserId: string, targetMigoTag: string) => {
  // 1. Suche den Empfänger in der Profile-Tabelle
  const { data: targetUser, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('migo_tag', targetMigoTag)
    .single();

  if (findError || !targetUser) {
    throw new Error("Dieser MigoTag existiert nicht.");
  }

  if (targetUser.id === currentUserId) {
    throw new Error("Du kannst dich nicht selbst hinzufügen.");
  }

  // 2. Erstelle den Eintrag in der Friendship-Tabelle
  const { error: insertError } = await supabase
    .from('friendships')
    .insert([
      { 
        user_id: currentUserId, 
        friend_id: targetUser.id, 
        status: 'pending' // Die Anfrage muss erst bestätigt werden
      }
    ]);

  if (insertError) throw insertError;
  return true;
};

/**
 * Akzeptiert eine eingehende Freundschaftsanfrage.
 */
export const acceptFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) throw error;
  return true;
};

/**
 * Lehnt eine Freundschaftsanfrage ab oder löscht eine bestehende Freundschaft.
 */
export const declineFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
  return true;
};