import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RegisterPage } from "./RegisterPage";
import { useAuth } from "../auth/AuthContext";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);

describe("RegisterPage", () => {
  it("submits registration details and navigates to discussions", async () => {
    const user = userEvent.setup();
    const register = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register,
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/discussions" element={<div>Discussion list</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;

    await user.type(screen.getByPlaceholderText("Name"), "Taylor User");
    await user.type(screen.getByPlaceholderText("Email"), "taylor@example.com");
    await user.selectOptions(screen.getByRole("combobox"), "prefer_not_to_say");
    await user.type(dateInput, "1995-07-04");
    await user.type(screen.getByPlaceholderText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: "Taylor User",
        email: "taylor@example.com",
        gender: "prefer_not_to_say",
        birth_date: "1995-07-04",
        password: "supersecret",
      });
    });
    expect(await screen.findByText("Discussion list")).toBeInTheDocument();
  });

  it("shows a registration error without navigating away", async () => {
    const user = userEvent.setup();
    const register = jest.fn().mockRejectedValue(new Error("Email already exists"));

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register,
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;

    await user.type(screen.getByPlaceholderText("Name"), "Taylor User");
    await user.type(screen.getByPlaceholderText("Email"), "taylor@example.com");
    await user.type(dateInput, "1995-07-04");
    await user.type(screen.getByPlaceholderText("Password"), "supersecret");
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(await screen.findByText("Email already exists")).toBeInTheDocument();
  });
});
