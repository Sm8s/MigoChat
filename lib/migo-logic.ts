import { supabase } from '@/app/supabaseClient';
import { Profile, Friendship } from './types';

/**
 * Suche nach Profilen anhand eines Suchbegriffs.
 * Es werden maximal 10 Treffer zurückgegeben, sortiert nach Username.
 * Das Suchfeld durchläuft username, display_name und migo_tag.
 */
export const searchProfiles = async (query: string): Promise<Profile[]> => {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, username, display_name, migo_tag, avatar_url, presence, custom_status'
    )
    .or(
      `username.ilike.%${q}%,display_name.ilike.%${q}%,migo_tag.ilike.%${q}%`
    )
    .limit(10);
  if (error) throw error;
  return (data ?? []) as unknown as Profile[];
};

/**
 * Aktualisiert den Status und die Aktivität eines Benutzers.
 * Präsenzwerte: offline, online, away, dnd
 */
export const updateUserStatus = async (
  userId: string,
  presence: 'online' | 'offline' | 'away' | 'dnd',
  activity?: string
) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      presence,
      last_seen: new Date().toISOString(),
      current_activity: activity || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
  return true;
};

/**
 * Sendet eine Freundschaftsanfrage basierend auf einem Tag oder Username.
 * Es wird zuerst nach einem exakten migo_tag gesucht. Wenn keiner gefunden wird,
 * wird nach einem Profil mit dem angegebenen Username gesucht (case-insensitive).
 * Anschließend ruft diese Funktion den RPC request_friend auf, um eine Anfrage zu erzeugen.
 */
export const sendFriendRequestByTag = async (
  currentUserId: string,
  input: string
): Promise<{ ok: boolean; message: string }> => {
  try {
    const raw = input.trim();
    if (!raw) return { ok: false, message: 'Bitte MigoTag oder Username eingeben.' };

    // Zunächst versuchen wir, anhand des Tags (Teil nach # oder ganze Eingabe) zu suchen
    let tag = '';
    if (raw.includes('#')) {
      tag = raw.split('#').pop()!.trim().toUpperCase();
    } else if (/^[A-F0-9]{4}$/i.test(raw)) {
      // falls nur ein 4er Hex-Tag eingegeben wird
      tag = raw.toUpperCase();
    }

    let profile: Profile | null = null;
    if (tag) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, migo_tag')
        .eq('migo_tag', tag)
        .maybeSingle();
      if (error) throw error;
      if (data) profile = data as unknown as Profile;
    }

    // Wenn kein Profil über Tag gefunden, suche nach Username (ilike)
    if (!profile) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, migo_tag')
        .ilike('username', raw)
        .maybeSingle();
      if (error) throw error;
      if (data) profile = data as unknown as Profile;
    }

    if (!profile) {
      return { ok: false, message: 'Kein Benutzer mit diesem Tag oder Namen gefunden.' };
    }
    if (profile.id === currentUserId) {
      return { ok: false, message: 'Du kannst dich nicht selbst hinzufügen.' };
    }

    // Versuche den RPC aufzurufen
    const { data, error } = await supabase.rpc('request_friend', {
      other_id: profile.id,
    });
    if (error) {
      // Falls es bereits eine Beziehung gibt, wird eine Fehlermeldung erzeugt
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Freundschaftsanfrage gesendet!' };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? 'Unbekannter Fehler.' };
  }
};

/**
 * Antwortet auf eine Freundschaftsanfrage.
 * Der otherId ist der Benutzer, der dich eingeladen hat (für inbound) oder den du eingeladen hast (für outbound).
 * Status kann 'accepted' oder 'rejected' sein.
 */
export const respondFriendRequest = async (
  otherId: string,
  newStatus: 'accepted' | 'rejected'
) => {
  const { error } = await supabase.rpc('respond_friend', {
    other_id: otherId,
    new_status: newStatus,
  });
  if (error) throw error;
  return true;
};

/**
 * Berechnet die Freundesliste und ausstehende Anfragen für einen Benutzer.
 * acceptedFriends: Profile[]
 * inbound: Profile[] – Benutzer, die dich eingeladen haben
 * outbound: Profile[] – Benutzer, die du eingeladen hast
 */
export const fetchFriendData = async (currentUserId: string) => {
  // Alle Freundschaften des Benutzers laden
  const { data: rows, error } = await supabase
    .from('friendships')
    .select(
      `id, user_low, user_high, initiator_id, status,
      user_low_profile:profiles!friendships_user_low_fkey(id, username, migo_tag, presence, custom_status, avatar_url),
      user_high_profile:profiles!friendships_user_high_fkey(id, username, migo_tag, presence, custom_status, avatar_url)`
    )
    .or(`user_low.eq.${currentUserId},user_high.eq.${currentUserId}`);
  if (error) throw error;

  const accepted: Profile[] = [];
  const inbound: Profile[] = [];
  const outbound: Profile[] = [];

  (rows ?? []).forEach((row: any) => {
    const { id, user_low, user_high, initiator_id, status } = row as Friendship & {
      user_low_profile: Profile;
      user_high_profile: Profile;
    };
    const otherId = user_low === currentUserId ? user_high : user_low;
    const otherProfile = user_low === currentUserId ? row.user_high_profile : row.user_low_profile;
    if (!otherProfile) return;
    if (status === 'accepted') {
      accepted.push(otherProfile);
    } else if (status === 'pending') {
      // inbound: du bist nicht Initiator
      if (initiator_id !== currentUserId) {
        inbound.push(otherProfile);
      } else {
        outbound.push(otherProfile);
      }
    }
  });
  return { accepted, inbound, outbound };
};

/**
 * Erstellt oder holt eine Direkt-Konversation mit einem anderen Benutzer.
 * Diese Funktion ruft den RPC get_or_create_dm auf und liefert die conversation_id zurück.
 */
export const getOrCreateDirectConversation = async (otherId: string) => {
  const { data, error } = await supabase.rpc('get_or_create_dm', {
    other_id: otherId,
  });
  if (error) throw error;
  // Der RPC gibt die ID der Unterhaltung zurück
  return data as string;
};

/**
 * Folgt einem Benutzer. Wenn bereits ein Follow existiert, schlägt die Operation fehl.
 */
export const followUser = async (currentUserId: string, targetUserId: string) => {
  const { error } = await supabase.from('follows').insert({
    follower_id: currentUserId,
    following_id: targetUserId,
  });
  if (error) throw error;
  return true;
};

/**
 * Entfolgt einem Benutzer.
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId);
  if (error) throw error;
  return true;
};

/**
 * Prüft, ob currentUserId dem targetUserId bereits folgt.
 */
export const isFollowing = async (currentUserId: string, targetUserId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
};

/**
 * Erstellt einen neuen Post.
 */
export const createPost = async (
  authorId: string,
  content: string,
  visibility: 'public' | 'followers' | 'friends' | 'private'
) => {
  const { error } = await supabase.from('posts').insert({
    author_id: authorId,
    content,
    visibility,
  });
  if (error) throw error;
  return true;
};

/**
 * Lädt eine Seite an Posts. Supabase RLS sorgt dafür, dass nur sichtbare Posts geliefert werden.
 * Überspringt skip Posts und holt limit Posts sortiert nach created_at desc.
 */
export const fetchPosts = async (skip: number, limit: number = 10) => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, author_id, content, visibility, created_at,
      author:profiles(id, username, migo_tag, avatar_url, presence)`
    )
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);
  if (error) throw error;
  return data ?? [];
};

/**
 * Bevorzugt für das Abrufen eines einzelnen Posts inklusive Kommentare.
 */
export const fetchPostWithComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, author_id, content, visibility, created_at, updated_at,
      author:profiles(id, username, migo_tag, avatar_url, presence),
      comments(id, author_id, content, created_at, deleted_at, author:profiles(id, username, migo_tag, avatar_url))`
    )
    .eq('id', postId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Fügt einen Kommentar zu einem Post hinzu.
 */
export const addComment = async (postId: string, authorId: string, content: string) => {
  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    author_id: authorId,
    content,
  });
  if (error) throw error;
  return true;
};

/**
 * Entfernt einen eigenen Kommentar.
 */
export const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
  return true;
};

/**
 * Liked oder unliked einen Post. Wenn bereits geliked, wird der Like entfernt, andernfalls hinzugefügt.
 */
export const toggleLikePost = async (postId: string, userId: string) => {
  // Prüfen, ob Like existiert
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const { error: delErr } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (delErr) throw delErr;
    return { liked: false };
  }
  const { error: insErr } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: userId,
  });
  if (insErr) throw insErr;
  return { liked: true };
};

/**
 * Holt alle Benachrichtigungen für den aktuellen Benutzer, sortiert nach Erstellungszeit absteigend.
 */
export const fetchNotifications = async (currentUserId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      `id, type, actor_id, entity_id, created_at, read_at, actor:profiles(id, username, migo_tag, avatar_url)`
    )
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

/**
 * Markiert eine Benachrichtigung als gelesen.
 */
export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
  if (error) throw error;
  return true;
};
