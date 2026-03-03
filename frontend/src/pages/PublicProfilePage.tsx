import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { profileApi } from "../api/profiles";
import type { UserProfile } from "../types/api";
import { ProfileCard } from "../components/ProfileCard";

export function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        const data = await profileApi.getById(id);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    };
    void fetchProfile();
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!profile) return <p>Loading...</p>;

  return <ProfileCard profile={profile} />;
}
