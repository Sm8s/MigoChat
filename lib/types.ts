// Shared TypeScript types for MigoChat
// These interfaces describe the shape of records stored in Supabase.
// They are used throughout the application to provide type safety
// when dealing with rows returned from the database.

export type UUID = string;

// Basic profile information stored in the profiles table
export interface Profile {
  id: UUID;
  username: string | null;
  migo_tag: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  header_url: string | null;
  presence: 'offline' | 'online' | 'away' | 'dnd';
  custom_status: string | null;
  last_seen: string | null;
  current_activity: string | null;
  created_at: string;
  updated_at: string;
}

// Poll definitions
// Represents a poll attached to a post
export interface Poll {
  id: UUID;
  post_id: UUID;
  question: string;
  created_at: string;
  expires_at: string | null;
}

// Options available on a poll
export interface PollOption {
  id: UUID;
  poll_id: UUID;
  option_text: string;
}

// A vote on a poll by a user
export interface PollVote {
  poll_id: UUID;
  option_id: UUID;
  user_id: UUID;
  created_at: string;
}

// Event scheduling
export interface Event {
  id: UUID;
  creator_id: UUID;
  title: string;
  description: string | null;
  event_time: string;
  location: string | null;
  created_at: string;
}

// Achievements that a user can earn
export interface Achievement {
  id: UUID;
  user_id: UUID;
  name: string;
  description: string;
  created_at: string;
}

// Group profile for group chats
export interface GroupProfile {
  id: UUID;
  title: string;
  created_at: string;
}

// Friend suggestion entry
export interface FriendSuggestion {
  user_id: UUID;
  suggested_id: UUID;
}

// Friendship relationship. A single row represents the relationship between two users.
export interface Friendship {
  id: UUID;
  user_low: UUID;
  user_high: UUID;
  initiator_id: UUID;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  updated_at: string;
}

// Conversation record. Direct conversations have exactly two members, group chats may have many.
export interface Conversation {
  id: UUID;
  type: 'direct' | 'group';
  title: string | null;
  created_by: UUID | null;
  created_at: string;
}

export interface ConversationMember {
  conversation_id: UUID;
  user_id: UUID;
  joined_at: string;
  last_read_at: string | null;
  muted: boolean;
}

export interface Message {
  id: UUID;
  conversation_id: UUID;
  author_id: UUID;
  content: string;
  created_at: string;
  /**
   * Timestamp when the message was last edited. Null if never edited.
   */
  edited_at: string | null;
  /**
   * Timestamp when the message was soft-deleted. A non-null value means the message
   * should not be rendered, but remains in the database for audit purposes.
   */
  deleted_at: string | null;
  /**
   * Kind of message. text for normal messages, audio for voice notes,
   * file for arbitrary attachments. Clients should use this to decide how to render
   * the message content. See migrations for supported values.
   */
  kind?: 'text' | 'audio' | 'file';
  /**
   * If kind !== 'text', this holds a URL to the uploaded media in Supabase Storage.
   */
  media_url?: string | null;
  /**
   * Original filename of an uploaded attachment.
   */
  file_name?: string | null;
  /**
   * Size of an uploaded attachment in bytes.
   */
  file_size?: number | null;
}

// A request to open a conversation with a user you are not yet friends with.
export interface MessageRequest {
  id: UUID;
  requester_id: UUID;
  recipient_id: UUID;
  status: 'pending' | 'accepted' | 'rejected';
  conversation_id: UUID | null;
  created_at: string;
  updated_at: string;
}

// Preferences controlling which types of notifications a user wants to receive and
// whether they want a periodic digest. These map to the notification_preferences table.
export interface NotificationPreference {
  user_id: UUID;
  notify_follow: boolean;
  notify_friend_request: boolean;
  notify_friend_accept: boolean;
  notify_post_like: boolean;
  notify_post_comment: boolean;
  notify_message: boolean;
  digest_enabled: boolean;
  digest_frequency: string; // e.g. 'daily' or 'weekly'
  digest_time_utc: string; // HH:MM:SS
  updated_at: string;
}

export type PostVisibility = 'public' | 'followers' | 'friends' | 'private';

export interface Post {
  id: UUID;
  author_id: UUID;
  content: string;
  visibility: PostVisibility;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostLike {
  post_id: UUID;
  user_id: UUID;
  created_at: string;
}

export interface Comment {
  id: UUID;
  post_id: UUID;
  author_id: UUID;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

// --- Addons Types ---

// Reaction on a post with arbitrary emoji
export interface PostReaction {
  post_id: UUID;
  user_id: UUID;
  emoji: string;
  created_at: string;
}

// Story record; expires_at indicates when it will be removed
export interface Story {
  id: UUID;
  author_id: UUID;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  visibility: PostVisibility; // reuse visibilities for stories
  created_at: string;
  expires_at: string;
  deleted_at: string | null;
}

export interface StoryView {
  story_id: UUID;
  viewer_id: UUID;
  viewed_at: string;
}

export interface Repost {
  post_id: UUID;
  user_id: UUID;
  created_at: string;
}

export interface PostBookmark {
  post_id: UUID;
  user_id: UUID;
  created_at: string;
}

export interface Collection {
  id: UUID;
  user_id: UUID;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  collection_id: UUID;
  post_id: UUID;
  added_at: string;
}

export interface MessageReaction {
  message_id: UUID;
  user_id: UUID;
  emoji: string;
  created_at: string;
}

export interface Entitlement {
  user_id: UUID;
  key: string;
  value: any;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  type:
    | 'follow'
    | 'friend_request'
    | 'friend_accept'
    | 'post_like'
    | 'post_comment'
    | 'message';
  actor_id: UUID | null;
  entity_id: UUID | null;
  created_at: string;
  read_at: string | null;
}