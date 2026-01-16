import { supabase } from '@/app/supabaseClient';

/**
 * Generiert einen eindeutigen MigoTag (z.B. name#A1B2).
 */
export const generateMigoTag = (username: string) => {
  const hex = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  return `${username.toLowerCase()}#${hex}`;
};

/**
 * Sucht die E-Mail eines Users basierend auf seinem MigoTag oder Username.
 * Hilfreich für den "Username vergessen" Flow.
 */
export const getEmailByMigoTag = async (migoTag: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_internal')
    .eq('migo_tag', migoTag)
    .single();
  
  if (error) throw new Error("MigoTag nicht gefunden.");
  return data.email_internal;
};

/**
 * Aktualisiert den Online-Status oder die aktuelle Aktivität (Gaming, Lernen etc.).
 */
export const updateUserStatus = async (userId: string, status: 'online' | 'offline' | 'away', activity?: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ 
      status: status,
      last_seen: new Date().toISOString(),
      current_activity: activity || null 
    })
    .eq('id', userId);

  if (error) throw error;
  return true;
};

/**
 * Sendet eine Freundschaftsanfrage.
 */
export const sendFriendRequest = async (currentUserId: string, targetMigoTag: string) => {
  const { data: targetUser, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .eq('migo_tag', targetMigoTag)
    .single();

  if (findError || !targetUser) throw new Error("MigoTag existiert nicht.");
  if (targetUser.id === currentUserId) throw new Error("Selbst-Adden nicht möglich.");

  const { error } = await supabase
    .from('friendships')
    .insert([{ user_id: currentUserId, friend_id: targetUser.id, status: 'pending' }]);

  if (error) throw error;
  return true;
};

/**
 * Akzeptiert eine Anfrage und schiebt sie in die Freundesliste.
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
 * Lehnt eine Anfrage ab oder löscht eine Freundschaft.
 */
export const declineFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
  return true;
};

/**
 * Prüft, ob eine Nachricht als "Anfrage" (von Fremden) oder "Direktnachricht" (von Freunden) gewertet wird.
 */
export const getMessageType = async (senderId: string, receiverId: string) => {
  const { data } = await supabase
    .from('friendships')
    .select('status')
    .or(`and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`)
    .single();

  return data?.status === 'accepted' ? 'direct' : 'request';
};