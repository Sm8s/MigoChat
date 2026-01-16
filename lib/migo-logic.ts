import { supabase } from '@/app/supabaseClient';

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
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  return true;
}

export async function declineFriendRequest(requestId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  return true;
}

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
