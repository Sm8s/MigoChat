"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/app/supabaseClient';
import { useRouter } from 'next/navigation';

/**
 * Onboarding page shown on first login. Collects username, display name, avatar,
 * interests and some preferences like ghost mode and notifications. Once
 * completed, the user is redirected to the home page. If the user already has
 * a username and display name, this page simply redirects to the root.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [notifyFollow, setNotifyFollow] = useState(true);
  const [notifyFriendRequest, setNotifyFriendRequest] = useState(true);
  const [notifyFriendAccept, setNotifyFriendAccept] = useState(true);
  const [notifyPostLike, setNotifyPostLike] = useState(true);
  const [notifyPostComment, setNotifyPostComment] = useState(true);
  const [notifyMessage, setNotifyMessage] = useState(true);
  const [interests, setInterests] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error(sessionError);
        setLoading(false);
        return;
      }
      const user = session?.user;
      if (!user) {
        router.push('/login');
        return;
      }
      // Load profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      if (data && data.username && data.display_name) {
        // Already onboarded
        router.push('/');
        return;
      }
      setProfile(data);
      setUsername(data?.username || '');
      setDisplayName(data?.display_name || '');
      // Load notification prefs if any
      const { data: prefData } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (prefData) {
        setNotifyFollow(prefData.notify_follow);
        setNotifyFriendRequest(prefData.notify_friend_request);
        setNotifyFriendAccept(prefData.notify_friend_accept);
        setNotifyPostLike(prefData.notify_post_like);
        setNotifyPostComment(prefData.notify_post_comment);
        setNotifyMessage(prefData.notify_message);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setErrorMsg('Nicht eingeloggt.');
      return;
    }
    // Validate username
    const uname = username.trim();
    if (!uname) {
      setErrorMsg('Bitte gib einen Benutzernamen ein.');
      return;
    }
    const dname = displayName.trim();
    if (!dname) {
      setErrorMsg('Bitte gib einen Anzeigenamen ein.');
      return;
    }
    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', uname)
      .neq('id', user.id)
      .maybeSingle();
    if (existing) {
      setErrorMsg('Dieser Benutzername ist bereits vergeben.');
      return;
    }
    // Upload avatar if provided
    let avatarUrl: string | null = profile?.avatar_url || null;
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);
      if (uploadErr) {
        setErrorMsg('Fehler beim Upload des Avatars.');
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      avatarUrl = publicUrlData.publicUrl;
    }
    // Update profile
    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        username: uname,
        display_name: dname,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (updErr) {
      setErrorMsg(updErr.message);
      return;
    }
    // Update notification prefs
    const prefs = {
      user_id: user.id,
      notify_follow: notifyFollow,
      notify_friend_request: notifyFriendRequest,
      notify_friend_accept: notifyFriendAccept,
      notify_post_like: notifyPostLike,
      notify_post_comment: notifyPostComment,
      notify_message: notifyMessage,
      digest_enabled: false,
      digest_frequency: 'daily',
      digest_time_utc: '09:00:00',
      updated_at: new Date().toISOString(),
    };
    // Upsert preferences
    await supabase
      .from('notification_preferences')
      .upsert(prefs, { onConflict: 'user_id' });
    // Insert interests
    const interestList = interests
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);
    if (interestList.length > 0) {
      // Remove existing interests
      await supabase.from('user_interests').delete().eq('user_id', user.id);
      const rows = interestList.map((interest) => ({ user_id: user.id, interest }));
      await supabase.from('user_interests').insert(rows);
    }
    // Set ghost mode via entitlements
    const { data: ghostEnt } = await supabase
      .from('entitlements')
      .select('key')
      .eq('user_id', user.id)
      .eq('key', 'ghost_mode')
      .maybeSingle();
    if (ghostMode && !ghostEnt) {
      await supabase.from('entitlements').insert({
        user_id: user.id,
        key: 'ghost_mode',
        value: {},
        source: 'user',
      });
    }
    if (!ghostMode && ghostEnt) {
      await supabase
        .from('entitlements')
        .delete()
        .eq('user_id', user.id)
        .eq('key', 'ghost_mode');
    }
    router.push('/');
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Lädt…</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">Willkommen bei MigoChat</h1>
      {errorMsg && <div className="text-red-500">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="username">
            Benutzername
          </label>
          <input
            id="username"
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded-md bg-[#2b2d31] text-white focus:outline-none"
            placeholder="Benutzername"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="display">
            Anzeigename
          </label>
          <input
            id="display"
            value={displayName || ''}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-2 rounded-md bg-[#2b2d31] text-white focus:outline-none"
            placeholder="Anzeigename"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="avatar">
            Avatar hochladen
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            className="text-gray-300"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-1" htmlFor="interests">
            Interessen (Komma-getrennt)
          </label>
          <input
            id="interests"
            value={interests || ''}
            onChange={(e) => setInterests(e.target.value)}
            className="w-full p-2 rounded-md bg-[#2b2d31] text-white focus:outline-none"
            placeholder="z.B. Tech, Gaming, Kunst"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="ghost"
            type="checkbox"
            checked={ghostMode}
            onChange={(e) => setGhostMode(e.target.checked)}
          />
          <label htmlFor="ghost" className="text-gray-300">
            Ghost Mode (unsichtbar bleiben)
          </label>
        </div>
        <div>
          <h2 className="text-gray-300 font-semibold mb-1">Benachrichtigungen</h2>
          <div className="flex flex-col space-y-2 text-sm text-gray-300">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyFollow}
                onChange={(e) => setNotifyFollow(e.target.checked)}
              />
              <span>Bei Follows informieren</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyFriendRequest}
                onChange={(e) => setNotifyFriendRequest(e.target.checked)}
              />
              <span>Bei Freundesanfragen informieren</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyFriendAccept}
                onChange={(e) => setNotifyFriendAccept(e.target.checked)}
              />
              <span>Bei angenommenen Freundschaften informieren</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyPostLike}
                onChange={(e) => setNotifyPostLike(e.target.checked)}
              />
              <span>Bei Likes informieren</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyPostComment}
                onChange={(e) => setNotifyPostComment(e.target.checked)}
              />
              <span>Bei Kommentaren informieren</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.checked)}
              />
              <span>Bei neuen Nachrichten informieren</span>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md"
        >
          Fertig
        </button>
      </form>
    </div>
  );
}