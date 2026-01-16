import { supabase } from '@/app/supabaseClient';

/**
 * Generiert einen eindeutigen MigoTag (z.B. name#A1B2).
 */
export const generateMigoTag = (username: string) => {
  const hex = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  return `${username.toLowerCase()}#${hex}`;
};

/**
 * Erstellt oder aktualisiert das Profil eines neuen Nutzers.
 * Verhindert den "ReferenceError" beim ersten Login.
 */
export const setupUserProfile = async (userId: string, username: string, email: string) => {
  const tag = generateMigoTag(username);
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      display_name: username,
      migo_tag: tag,
      email_internal: email,
      status: 'online',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Sucht Profile basierend auf einem Teil des Namens (für die Suche).
 */
export const searchProfiles = async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, migo_tag, status')
    .ilike('display_name', `%${query}%`)
    .limit(5);

  if (error) throw error;
  return data;
};

/**
 * Sucht die E-Mail eines Users basierend auf seinem MigoTag oder Username.
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
 * Aktualisiert den Online-Status oder die aktuelle Aktivität.
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
 * Akzeptiert eine Anfrage.
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
 * Prüft den Nachrichtentyp (Direktnachricht vs. Anfrage).
 */
export const getMessageType = async (senderId: string, receiverId: string) => {
  const { data } = await supabase
    .from('friendships')
    .select('status')
    .or(`and(user_id.eq.${senderId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${senderId})`)
    .maybeSingle();

  return data?.status === 'accepted' ? 'direct' : 'request';
};