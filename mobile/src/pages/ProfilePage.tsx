import { useState } from "react";
import { Alert } from "react-native";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import { ProfileCard } from "../components/ProfileCard";
import { authApi } from "../api/auth";
import { BodyText, Button, Card, ErrorText, Heading, Screen } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";

export function ProfilePage() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, refreshMe, logout } = useAuth();
  const [error, setError] = useState("");
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  if (!user) {
    return (
      <Screen>
        <Card>
          <Heading>Your Profile</Heading>
          <BodyText muted>Sign in to manage your profile, privacy settings, and account.</BodyText>
          <Button
            label="Login"
            onPress={() =>
              navigation.push("Login", {
                backTitle: "Profile",
                redirectTo: { name: "MainTabs", params: { screen: "Profile" } },
              })
            }
          />
          <Button label="Register" tone="secondary" onPress={() => navigation.push("Register", { backTitle: "Profile" })} />
        </Card>
      </Screen>
    );
  }

  const deleteAccount = async (deleteContent: boolean) => {
    setError("");
    Alert.alert(
      deleteContent ? "Delete account and content" : "Delete account only",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await authApi.deleteAccount(deleteContent);
                await logout();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "MainTabs" }],
                  }),
                );
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete account");
              }
            })();
          },
        },
      ],
    );
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
    <Screen>
      <ProfileCard profile={user} />
      <Card>
        <Heading>Profile Privacy</Heading>
        <BodyText muted>Anonymous profile hides your email, gender, and date of birth from other users.</BodyText>
        <Button
          label={savingPrivacy ? "Saving..." : user.is_profile_anonymous ? "Disable Anonymous Profile" : "Enable Anonymous Profile"}
          onPress={() => void toggleProfileAnonymous()}
          disabled={savingPrivacy}
        />
        {user.is_staff ? <Button label="View Online Users" tone="secondary" onPress={() => navigation.navigate("OnlineUsers")} /> : null}
        <Button label="Logout" tone="secondary" onPress={() => void logout()} />
      </Card>
      <Card tone="danger">
        <Heading>Delete Account</Heading>
        <BodyText>Choose whether to remove your content or keep it as [deleted].</BodyText>
        <Button label="Delete Account + Content" tone="danger" onPress={() => void deleteAccount(true)} />
        <Button label="Delete Account, Keep Content" tone="danger" onPress={() => void deleteAccount(false)} />
        <ErrorText message={error} />
      </Card>
    </Screen>
  );
}
