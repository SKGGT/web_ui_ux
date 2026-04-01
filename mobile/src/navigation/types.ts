import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Discussions: undefined;
  Info: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login:
    | {
        backTitle?: string;
        redirectTo?: {
          name: keyof RootStackParamList;
          params?: object;
        };
      }
    | undefined;
  Register:
    | {
        backTitle?: string;
      }
    | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  DiscussionDetail: { id: string };
  PublicProfile: { id: string };
  OnlineUsers: undefined;
};
