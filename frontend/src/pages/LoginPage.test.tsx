import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { useAuth } from "../auth/AuthContext";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);

describe("LoginPage", () => {
  it("submits credentials and navigates to discussions", async () => {
    const user = userEvent.setup();
    const login = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/discussions" element={<div>Discussion list</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Email"), "taylor@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "hunter22");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "taylor@example.com",
        password: "hunter22",
      });
    });
    expect(await screen.findByText("Discussion list")).toBeInTheDocument();
  });

  it("shows the API error when login fails", async () => {
    const user = userEvent.setup();
    const login = jest.fn().mockRejectedValue(new Error("Bad credentials"));

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login,
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Email"), "taylor@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Bad credentials")).toBeInTheDocument();
  });
});
