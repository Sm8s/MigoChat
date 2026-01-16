import { supabase } from '@/app/supabaseClient';

/**
 * Generiert MigoTag wie "emmo#LK55" (4 Zeichen Hex).
 * (Du nutzt aktuell genau dieses Format in der DB)
 */
export const generateMigoTag = (username: string) => {
  const hex = Math.floor(Math.random() * 65536)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');

  return `${username.toLowerCase()}#${hex}`;
};

/**
 * Optional: Profil anlegen/aktualisieren (nur falls du KEINEN Trigger nutzt).
 * Wenn du Trigger nutzt: kannst du diese Funktion irgendwann entfernen.
 */
export const setupUserProfile = async (userId: string, username: string, email: string) => {
  const tag = generateMigoTag(username);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username,
      display_name: username,
      migo_tag: tag,
      email_internal: email,
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Suche nach Usern (optional)
 */
export const searchProfiles = async (query: string) => {
  const q = query.trim();
  if (!q) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, migo_tag, status')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(5);

  if (error) throw error;
  return data ?? [];
};

/**
 * Status updaten
 */
export const updateUserStatus = async (
  userId: string,
  status: 'online' | 'offline' | 'away',
  activity?: string
) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      status,
      last_seen: new Date().toISOString(),
      current_activity: activity || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
  return true;
};

// "Emmo#LK55" -> "LK55"  |  "LK55" -> "LK55"
const extractTag = (input: string) => {
  const raw = input.trim();
  const tag = raw.includes('#') ? raw.split('#').pop()!.trim() : raw;
  return tag.toUpperCase();
};

/**
 * Freundschaftsanfrage senden (RLS-safe, nutzt RPC get_profile_by_migo_tag)
 * Erwartet: input wie "Emmo#LK55" oder "LK55"
 */
export const sendFriendRequest = async (
  currentUserId: string,
  inputMigoTag: string
): Promise<{ ok: boolean; message: string }> => {
  try {
    const tag = extractTag(inputMigoTag);

    if (!tag) return { ok: false, message: 'Bitte MigoTag eingeben.' };

    // Zielprofil via RPC holen (umgeht RLS sauber, ohne email_internal zu leaken)
    const { data: rows, error: rpcErr } = await supabase.rpc('get_profile_by_migo_tag', { tag });

    if (rpcErr) return { ok: false, message: rpcErr.message };

    const targetUser = Array.isArray(rows) ? rows[0] : rows;
    if (!targetUser?.id) return { ok: false, message: 'MigoTag existiert nicht.' };
    if (targetUser.id === currentUserId) return { ok: false, message: 'Selbst-Adden nicht möglich.' };

    // Check: existiert schon eine Beziehung? (beide Richtungen)
    const { data: existing, error: existErr } = await supabase
      .from('friendships')
      .select('id, status')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUserId})`
      )
      .maybeSingle();

    if (existErr) return { ok: false, message: existErr.message };

    if (existing) {
      if (existing.status === 'pending') return { ok: false, message: 'Es gibt schon eine ausstehende Anfrage.' };
      if (existing.status === 'accepted') return { ok: false, message: 'Ihr seid bereits befreundet.' };
    }

    // Anfrage erstellen (passt zu deiner friendships Tabelle!)
    const { error: insErr } = await supabase.from('friendships').insert([
      {
        sender_id: currentUserId,
        receiver_id: targetUser.id,
        initiator_id: currentUserId,
        status: 'pending',
      },
    ]);

    if (insErr) return { ok: false, message: insErr.message };

    return { ok: true, message: 'Freundschaftsanfrage gesendet!' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Unbekannter Fehler.' };
  }
};

export const acceptFriendRequest = async (requestId: string) => {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) throw error;
  return true;
};

export const declineFriendRequest = async (requestId: string) => {
  const { error } = await supabase.from('friendships').delete().eq('id', requestId);
  if (error) throw error;
  return true;
};

export const getMessageType = async (senderId: string, receiverId: string) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('status')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .maybeSingle();

  if (error) return 'request';
  return data?.status === 'accepted' ? 'direct' : 'request';
};
