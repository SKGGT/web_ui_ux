import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OnlineUsersPage } from "./OnlineUsersPage";
import { useAuth } from "../auth/AuthContext";
import { adminApi } from "../api/admin";
import { connectRealtime } from "../api/realtime";
import { createMockSocket, makeOnlineUser, makeUser } from "../test/testUtils";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api/admin", () => ({
  adminApi: {
    onlineUsers: jest.fn(),
  },
}));

jest.mock("../api/realtime", () => ({
  connectRealtime: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);
const mockedAdminApi = jest.mocked(adminApi);
const mockConnectRealtime = jest.mocked(connectRealtime);

describe("OnlineUsersPage", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("last seen");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("blocks access for non-admin users", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser({ is_staff: false }),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter>
        <OnlineUsersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin access required.")).toBeInTheDocument();
  });

  it("loads online users and accepts realtime snapshots", async () => {
    const socket = createMockSocket();

    mockUseAuth.mockReturnValue({
      user: makeUser({ is_staff: true }),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });
    mockedAdminApi.onlineUsers.mockResolvedValue([makeOnlineUser()]);
    mockConnectRealtime.mockReturnValue(socket as never);

    render(
      <MemoryRouter>
        <OnlineUsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Online Users" })).toBeInTheDocument();
    expect(screen.getByText("Moderator Morgan")).toBeInTheDocument();
    expect(screen.getByText("last seen")).toBeInTheDocument();

    socket.emitMessage({
      type: "online_users_snapshot",
      users: [makeOnlineUser({ id: "online-2", name: "Admin Avery" })],
    });

    expect(await screen.findByText("Admin Avery")).toBeInTheDocument();
  });
});
