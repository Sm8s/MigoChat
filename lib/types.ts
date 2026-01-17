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
  edited_at: string | null;
  deleted_at: string | null;
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