import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ProfileCard } from "../components/ProfileCard";
import { authApi } from "../api/auth";

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [error, setError] = useState("");
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  if (!user) {
    return <p>Loading profile...</p>;
  }

  const deleteAccount = async (deleteContent: boolean) => {
    setError("");
    try {
      await authApi.deleteAccount(deleteContent);
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  const toggleProfileAnonymous = async () => {
    setError("");
    setSavingPrivacy(true);
    try {
      await authApi.setProfileAnonymous(!user.is_profile_anonymous);
      await refreshMe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile privacy");
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProfileCard profile={user} />
      <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Profile Privacy</h2>
        <p className="mt-1 text-sm text-slate-600">
          Anonymous profile hides your email, gender, and date of birth from other users.
        </p>
        <button
          className="btn btn-primary mt-3 px-3 py-2"
          onClick={() => void toggleProfileAnonymous()}
          disabled={savingPrivacy}
        >
          {user.is_profile_anonymous ? "Disable Anonymous Profile" : "Enable Anonymous Profile"}
        </button>
      </section>
      <section className="max-w-xl rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="text-lg font-semibold text-red-900">Delete Account</h2>
        <p className="mt-1 text-sm text-red-700">Choose whether to remove your content or keep it as [deleted].</p>
        <div className="mt-3 flex gap-3">
          <button className="btn btn-danger px-3 py-2" onClick={() => void deleteAccount(true)}>
            Delete Account + Content
          </button>
          <button className="btn btn-danger-dark px-3 py-2" onClick={() => void deleteAccount(false)}>
            Delete Account, Keep Content
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}
