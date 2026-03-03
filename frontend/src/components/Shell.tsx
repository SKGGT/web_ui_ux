import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/discussions" className="font-semibold text-slate-900">Forum</Link>
          <nav className="flex items-center gap-4 text-sm text-slate-700">
            <NavLink to="/discussions">Discussions</NavLink>
            <NavLink to="/info">Info</NavLink>
            {user ? (
              <>
                <NavLink to="/profile">Profile</NavLink>
                <button className="btn btn-primary px-3 py-1.5 text-sm" onClick={() => void logout()}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/register">Register</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
