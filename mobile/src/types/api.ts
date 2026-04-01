export type Gender = "male" | "female" | "prefer_not_to_say";

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  gender: Gender | null;
  birth_date: string | null;
  date_joined: string;
  is_profile_anonymous: boolean;
  is_staff: boolean | null;
  is_superuser: boolean | null;
}

export interface AuthorDisplay {
  display_name: string;
  user_id: string | null;
}

export interface Comment {
  id: number;
  author: AuthorDisplay;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  title: string;
  created_by: AuthorDisplay;
  is_anonymous: boolean;
  is_closed: boolean;
  created_at: string;
  last_activity: string;
  views_count: number;
  comments_count: number;
}

export interface DiscussionDetail extends Discussion {
  comments: Comment[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  connections_count: number;
  last_seen: string;
}

export interface TokenAuthResponse {
  user: UserProfile;
  access: string;
  refresh: string;
}
