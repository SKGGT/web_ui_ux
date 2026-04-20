import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DiscussionDetailPage } from "./DiscussionDetailPage";
import { useAuth } from "../auth/AuthContext";
import { discussionApi } from "../api/discussions";
import { connectRealtime } from "../api/realtime";
import { createMockSocket, makeComment, makeDiscussion, makeDiscussionDetail, makeUser } from "../test/testUtils";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api/discussions", () => ({
  discussionApi: {
    trackView: jest.fn(),
    get: jest.fn(),
    addComment: jest.fn(),
    setClosed: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../api/realtime", () => ({
  connectRealtime: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockedDiscussionApi = jest.mocked(discussionApi);
const mockConnectRealtime = jest.mocked(connectRealtime);

describe("DiscussionDetailPage", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("formatted date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads a discussion and lets the owner moderate and comment", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();
    const detail = makeDiscussionDetail({
      created_by: {
        display_name: "Taylor User",
        user_id: "user-1",
      },
    });

    mockUseAuth.mockReturnValue({
      user: makeUser(),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });
    mockedDiscussionApi.trackView.mockResolvedValue({ counted: true });
    mockedDiscussionApi.get.mockResolvedValue(detail);
    mockedDiscussionApi.setClosed.mockResolvedValue(
      makeDiscussion({
        id: detail.id,
        title: detail.title,
        is_closed: true,
        created_by: detail.created_by,
      }),
    );
    mockedDiscussionApi.addComment.mockResolvedValue(
      makeComment({
        id: 2,
        content: "A fresh reply",
        updated_at: "2026-03-01T12:00:00Z",
      }),
    );
    mockedDiscussionApi.delete.mockResolvedValue(undefined);
    mockConnectRealtime.mockReturnValue(socket as never);

    render(
      <MemoryRouter initialEntries={["/discussions/discussion-1"]}>
        <Routes>
          <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
          <Route path="/discussions" element={<div>Back on list</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Launch plan" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close Discussion" }));

    await waitFor(() => {
      expect(mockedDiscussionApi.setClosed).toHaveBeenCalledWith("discussion-1", true);
    });
    expect(screen.getByText("This discussion is closed.")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "A fresh reply");
    await user.click(screen.getByRole("button", { name: "Post Comment" }));

    await waitFor(() => {
      expect(mockedDiscussionApi.addComment).toHaveBeenCalledWith("discussion-1", "A fresh reply");
    });
    expect(await screen.findByText("A fresh reply")).toBeInTheDocument();

    socket.emitMessage({
      type: "discussion_updated",
      discussion: makeDiscussion({
        title: "Launch plan updated",
        created_by: detail.created_by,
      }),
    });
    expect(await screen.findByRole("heading", { name: "Launch plan updated" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete Discussion" }));

    await waitFor(() => {
      expect(mockedDiscussionApi.delete).toHaveBeenCalledWith("discussion-1");
    });
    expect(await screen.findByText("Back on list")).toBeInTheDocument();
  });

  it("shows the read-only message for logged-out users on closed threads", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });
    mockedDiscussionApi.trackView.mockResolvedValue({ counted: true });
    mockedDiscussionApi.get.mockResolvedValue(makeDiscussionDetail({ is_closed: true }));
    mockConnectRealtime.mockReturnValue(createMockSocket() as never);

    render(
      <MemoryRouter initialEntries={["/discussions/discussion-1"]}>
        <Routes>
          <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Login to comment. If closed, only the owner can comment.")).toBeInTheDocument();
    expect(screen.queryByText("Add Comment")).not.toBeInTheDocument();
  });
});
