import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
