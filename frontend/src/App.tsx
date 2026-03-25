import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { Shell } from "./components/Shell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DiscussionDetailPage } from "./pages/DiscussionDetailPage";
import { DiscussionsPage } from "./pages/DiscussionsPage";
import { InfoPage } from "./pages/InfoPage";
import { LoginPage } from "./pages/LoginPage";
import { OnlineUsersPage } from "./pages/OnlineUsersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { RegisterPage } from "./pages/RegisterPage";

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  return <Navigate to={user ? "/discussions" : "/login"} replace />;
}

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/discussions" element={<DiscussionsPage />} />
        <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
        <Route path="/users/:id" element={<PublicProfilePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/online-users" element={<OnlineUsersPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default App;
