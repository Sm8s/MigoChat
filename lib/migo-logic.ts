import { supabase } from '@/app/supabaseClient';

<<<<<<< HEAD
export const generateMigoTag = (username: string) => {
  const hex = Math.floor(Math.random() * 65536)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  return `${username.toLowerCase()}#${hex}`;
};

export const setupUserProfile = async (userId: string, username: string, email: string) => {
  const tag = generateMigoTag(username);

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username: username,         // ✅ bei dir heißt es username
      display_name: username,     // ✅ optional, wenn Spalte existiert
      migo_tag: tag,              // ✅
      email_internal: email,      // ✅
      status: 'online',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const searchProfiles = async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, migo_tag, status')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(5);

  if (error) throw error;
  return data;
};

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

// Helper: "Emmo#LK55" -> "LK55"
const extractTag = (input: string) => {
  const raw = input.trim();
  const tag = raw.includes('#') ? raw.split('#').pop()!.trim() : raw.trim();
  return tag.toUpperCase();
};

export const sendFriendRequest = async (
  currentUserId: string,
  inputMigoTag: string
): Promise<{ ok: boolean; message: string }> => {
  try {
    const tag = extractTag(inputMigoTag);

    if (!tag) return { ok: false, message: 'Bitte MigoTag eingeben.' };

    // 🔥 Zielprofil via RPC holen (RLS-safe)
    const { data: rows, error: rpcErr } = await supabase.rpc('get_profile_by_migo_tag', { tag });

    if (rpcErr) return { ok: false, message: rpcErr.message };

    const targetUser = Array.isArray(rows) ? rows[0] : rows;
    if (!targetUser?.id) return { ok: false, message: 'MigoTag existiert nicht.' };
    if (targetUser.id === currentUserId) return { ok: false, message: 'Selbst-Adden nicht möglich.' };

    // Check: Beziehung existiert schon? (beide Richtungen)
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

    // ✅ Insert passt zu deiner friendships Tabelle
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
=======
/**
 * MigoTag: 2 Buchstaben + 2 Zahlen (z.B. AB12)
 */
export function generateMigoTag(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';

  const a = letters[Math.floor(Math.random() * letters.length)];
  const b = letters[Math.floor(Math.random() * letters.length)];
  const n1 = nums[Math.floor(Math.random() * nums.length)];
  const n2 = nums[Math.floor(Math.random() * nums.length)];

  return `${a}${b}${n1}${n2}`;
}

/**
 * Sendet eine Freundschaftsanfrage über friendships:
 * sender_id, receiver_id, initiator_id, status
 */
export async function sendFriendRequest(currentUserId: string, targetMigoTag: string) {
  const tag = targetMigoTag.trim().toUpperCase();

  // Zielprofil finden
  const { data: targetUser, error: findError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('migo_tag', tag)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  if (!targetUser?.id) throw new Error('MigoTag existiert nicht.');
  if (targetUser.id === currentUserId) throw new Error('Selbst-Adden nicht möglich.');

  // Check: gibt’s schon eine Beziehung (in beide Richtungen)
  const { data: existing, error: existErr } = await supabase
    .from('friendships')
    .select('id, status')
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (existErr) throw new Error(existErr.message);
  if (existing) {
    if (existing.status === 'pending') throw new Error('Es gibt schon eine ausstehende Anfrage.');
    if (existing.status === 'accepted') throw new Error('Ihr seid bereits befreundet.');
  }

  // Anfrage erstellen
  const { error } = await supabase.from('friendships').insert([
    {
      sender_id: currentUserId,
      receiver_id: targetUser.id,
      initiator_id: currentUserId,
      status: 'pending',
    },
  ]);

  if (error) throw new Error(error.message);
  return true;
}

export async function acceptFriendRequest(requestId: string) {
>>>>>>> 0a5225071d35d94e803babc0d69e420798a44c16
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  return true;
}

<<<<<<< HEAD
export const declineFriendRequest = async (requestId: string) => {
  const { error } = await supabase.from('friendships').delete().eq('id', requestId);
  if (error) throw error;
=======
export async function declineFriendRequest(requestId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);

  if (error) throw new Error(error.message);
>>>>>>> 0a5225071d35d94e803babc0d69e420798a44c16
  return true;
}

<<<<<<< HEAD
export const getMessageType = async (senderId: string, receiverId: string) => {
  const { data } = await supabase
    .from('friendships')
    .select('status')
    .or(
      `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
    )
    .maybeSingle();

  return data?.status === 'accepted' ? 'direct' : 'request';
};
=======
/**
 * Optional: Online Status (nur wenn Spalten existieren: status, last_seen, current_activity)
 */
export async function updateUserStatus(
  userId: string,
  status: 'online' | 'offline' | 'away',
  activity?: string
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      status,
      last_seen: new Date().toISOString(),
      current_activity: activity ?? null,
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  return true;
}
>>>>>>> 0a5225071d35d94e803babc0d69e420798a44c16
