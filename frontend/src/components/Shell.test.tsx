import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Shell } from "./Shell";
import { useAuth } from "../auth/AuthContext";
import { makeUser } from "../test/testUtils";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);

describe("Shell", () => {
  it("shows guest navigation when nobody is signed in", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Shell>
          <div>Page body</div>
        </Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
  });

  it("shows authenticated navigation and calls logout", async () => {
    const user = userEvent.setup();
    const logout = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: makeUser({ is_staff: true }),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout,
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter>
        <Shell>
          <div>Page body</div>
        </Shell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Online Users" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Logout" }));

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
