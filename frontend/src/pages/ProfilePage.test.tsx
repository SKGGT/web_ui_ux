import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfilePage } from "./ProfilePage";
import { useAuth } from "../auth/AuthContext";
import { authApi } from "../api/auth";
import { makeUser } from "../test/testUtils";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../api/auth", () => ({
  authApi: {
    deleteAccount: jest.fn(),
    setProfileAnonymous: jest.fn(),
  },
}));

const mockUseAuth = jest.mocked(useAuth);
const mockedAuthApi = jest.mocked(authApi);

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("joined date");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("updates profile privacy and refreshes the current user", async () => {
    const user = userEvent.setup();
    const refreshMe = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: makeUser({ is_profile_anonymous: false }),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe,
    });
    mockedAuthApi.setProfileAnonymous.mockResolvedValue(makeUser({ is_profile_anonymous: true }));

    render(<ProfilePage />);

    await user.click(screen.getByRole("button", { name: "Enable Anonymous Profile" }));

    await waitFor(() => {
      expect(mockedAuthApi.setProfileAnonymous).toHaveBeenCalledWith(true);
    });
    expect(refreshMe).toHaveBeenCalledTimes(1);
  });

  it("shows an error when account deletion fails", async () => {
    const user = userEvent.setup();

    mockUseAuth.mockReturnValue({
      user: makeUser(),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });
    mockedAuthApi.deleteAccount.mockRejectedValue(new Error("Deletion blocked"));

    render(<ProfilePage />);

    await user.click(screen.getByRole("button", { name: "Delete Account, Keep Content" }));

    expect(await screen.findByText("Deletion blocked")).toBeInTheDocument();
  });
});
