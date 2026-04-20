import { act } from "@testing-library/react";
import type { Comment, Discussion, DiscussionDetail, OnlineUser, UserProfile } from "../types/api";

export function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    name: "Taylor User",
    email: "taylor@example.com",
    gender: "female",
    birth_date: "1995-07-04",
    date_joined: "2026-03-01T10:00:00Z",
    is_profile_anonymous: false,
    is_staff: false,
    is_superuser: false,
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    author: {
      display_name: "Taylor User",
      user_id: "user-1",
    },
    content: "First comment",
    created_at: "2026-03-01T10:30:00Z",
    updated_at: "2026-03-01T10:30:00Z",
    ...overrides,
  };
}

export function makeDiscussion(overrides: Partial<Discussion> = {}): Discussion {
  return {
    id: "discussion-1",
    title: "Launch plan",
    created_by: {
      display_name: "Taylor User",
      user_id: "user-1",
    },
    is_anonymous: false,
    is_closed: false,
    created_at: "2026-03-01T10:00:00Z",
    last_activity: "2026-03-01T11:00:00Z",
    views_count: 42,
    comments_count: 3,
    ...overrides,
  };
}

export function makeDiscussionDetail(overrides: Partial<DiscussionDetail> = {}): DiscussionDetail {
  return {
    ...makeDiscussion(),
    comments: [makeComment()],
    ...overrides,
  };
}

export function makeOnlineUser(overrides: Partial<OnlineUser> = {}): OnlineUser {
  return {
    id: "online-1",
    name: "Moderator Morgan",
    email: "morgan@example.com",
    is_staff: true,
    is_superuser: false,
    connections_count: 2,
    last_seen: "2026-03-01T11:15:00Z",
    ...overrides,
  };
}

type SocketMessageHandler = ((event: MessageEvent<string>) => void) | null;

export interface MockSocket {
  close: jest.Mock<void, []>;
  send: jest.Mock<void, [string]>;
  readyState: number;
  onmessage: SocketMessageHandler;
  onopen: ((event: Event) => void) | null;
  emitMessage: (payload: unknown) => void;
}

export function createMockSocket(): MockSocket {
  const socket: MockSocket = {
    close: jest.fn(),
    send: jest.fn(),
    readyState: WebSocket.OPEN,
    onmessage: null,
    onopen: null,
    emitMessage(payload: unknown) {
      act(() => {
        this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
      });
    },
  };

  return socket;
}
