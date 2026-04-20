import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../auth/AuthContext";
import { makeUser } from "../test/testUtils";

jest.mock("../auth/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = jest.mocked(useAuth);

describe("ProtectedRoute", () => {
  it("shows a loading state while auth is resolving", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<div>Private page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects guests to the login page", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<div>Private page</div>} />
          </Route>
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    mockUseAuth.mockReturnValue({
      user: makeUser(),
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      refreshMe: jest.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<div>Private page</div>} />
          </Route>
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Private page")).toBeInTheDocument();
  });
});
