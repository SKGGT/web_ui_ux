import { CommonActions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

type PostAuthRedirect = NonNullable<RootStackParamList["Login"]>["redirectTo"];

export function createPostAuthResetAction(redirectTo?: PostAuthRedirect) {
  if (redirectTo?.name === "MainTabs") {
    return CommonActions.reset({
      index: 0,
      routes: [{ name: "MainTabs", params: redirectTo.params }],
    });
  }

  if (redirectTo) {
    return CommonActions.reset({
      index: 1,
      routes: [{ name: "MainTabs" }, { name: redirectTo.name, params: redirectTo.params }],
    });
  }

  return CommonActions.reset({
    index: 0,
    routes: [{ name: "MainTabs", params: { screen: "Discussions" } }],
  });
}
