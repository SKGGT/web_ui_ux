import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DiscussionsPage } from "./DiscussionsPage";
import { useAuth } from "../auth/AuthContext";
import { discussionApi } from "../api/discussions";
import { connectRealtime } from "../api/realtime";
import { createMockSocket, makeDiscussion, makeUser } from "../test/testUtils";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api/discussions", () => ({
  discussionApi: {
    list: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../api/realtime", () => ({
  connectRealtime: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockedDiscussionApi = jest.mocked(discussionApi);
const mockConnectRealtime = jest.mocked(connectRealtime);

describe("DiscussionsPage", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("formatted date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads discussions, reacts to realtime updates, and creates a discussion", async () => {
    const user = userEvent.setup();
    const socket = createMockSocket();

    mockUseAuth.mockReturnValue({
      user: makeUser(),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });
    mockedDiscussionApi.list.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makeDiscussion()],
    });
    mockedDiscussionApi.create.mockResolvedValue(makeDiscussion({ id: "discussion-2", title: "Second topic" }));
    mockConnectRealtime.mockReturnValue(socket as never);

    render(
      <MemoryRouter initialEntries={["/discussions"]}>
        <Routes>
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/discussions/:id" element={<div>Discussion details</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Launch plan")).toBeInTheDocument();

    socket.emitMessage({
      type: "discussion_created",
      discussion: makeDiscussion({
        id: "discussion-3",
        title: "Newest update",
        views_count: 99,
      }),
    });

    expect(await screen.findByText("Newest update")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Title"), "Second topic");
    await user.type(screen.getByPlaceholderText("First comment"), "Starting the thread");
    await user.click(screen.getByLabelText("Start as anonymous discussion"));
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(mockedDiscussionApi.create).toHaveBeenCalledWith({
        title: "Second topic",
        content: "Starting the thread",
        is_anonymous: true,
      });
    });
    expect(await screen.findByText("Discussion details")).toBeInTheDocument();
  });

  it("hides the create form for guests", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });
    mockedDiscussionApi.list.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [makeDiscussion()],
    });
    mockConnectRealtime.mockReturnValue(createMockSocket() as never);

    render(
      <MemoryRouter>
        <DiscussionsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Launch plan")).toBeInTheDocument();
    expect(screen.queryByText("Create Discussion")).not.toBeInTheDocument();
  });
});
