import { useEffect, useState } from "react";
import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { profileApi } from "../api/profiles";
import type { UserProfile } from "../types/api";
import { ProfileCard } from "../components/ProfileCard";
import { BodyText, Card, ErrorText, Heading, Screen } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";

export function PublicProfilePage() {
  const route = useRoute<RouteProp<RootStackParamList, "PublicProfile">>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getById(route.params.id);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      }
    };
    void fetchProfile();
  }, [route.params.id]);

  if (error || !profile) {
    return (
      <Screen>
        <Card>
          <Heading>Profile</Heading>
          <ErrorText message={error} />
          {!error ? <BodyText muted>Loading profile...</BodyText> : null}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ProfileCard profile={profile} />
    </Screen>
  );
}
