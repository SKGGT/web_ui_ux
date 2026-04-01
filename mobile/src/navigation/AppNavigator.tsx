import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { palette } from "../theme";
import { DiscussionDetailPage } from "../pages/DiscussionDetailPage";
import { DiscussionsPage } from "../pages/DiscussionsPage";
import { InfoPage } from "../pages/InfoPage";
import { LoginPage } from "../pages/LoginPage";
import { OnlineUsersPage } from "../pages/OnlineUsersPage";
import { ProfilePage } from "../pages/ProfilePage";
import { PublicProfilePage } from "../pages/PublicProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import type { MainTabParamList, RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.card },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "700", paddingBottom: 2 },
      }}
    >
      <Tabs.Screen name="Discussions" component={DiscussionsPage} options={{ title: "Discussion", tabBarLabel: "Discussion", tabBarIcon: () => <Text></Text> }} />
      <Tabs.Screen name="Info" component={InfoPage} options={{ title: "Info", tabBarLabel: "Info", tabBarIcon: () => <Text></Text> }} />
      <Tabs.Screen name="Profile" component={ProfilePage} options={{ title: "Profile", tabBarLabel: "Profile", tabBarIcon: () => <Text></Text> }} />
    </Tabs.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: palette.card },
        headerTintColor: palette.text,
        contentStyle: { backgroundColor: palette.canvas },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Login"
        component={LoginPage}
        options={({ route }) => ({
          title: "Login",
          headerBackTitle: route.params?.backTitle ?? "Back",
        })}
      />
      <Stack.Screen
        name="Register"
        component={RegisterPage}
        options={({ route }) => ({
          title: "Create account",
          headerBackTitle: route.params?.backTitle ?? "Back",
        })}
      />
      <Stack.Screen name="DiscussionDetail" component={DiscussionDetailPage} options={{ title: "Discussion", headerBackTitle: "Discussions" }} />
      <Stack.Screen name="PublicProfile" component={PublicProfilePage} options={{ title: "Profile" }} />
      <Stack.Screen name="OnlineUsers" component={OnlineUsersPage} options={{ title: "Online Users" }} />
    </Stack.Navigator>
  );
}
