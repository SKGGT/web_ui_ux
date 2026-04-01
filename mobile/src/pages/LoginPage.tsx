import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import { Button, Card, ErrorText, Field, Heading, Screen } from "../components/ui";
import { createPostAuthResetAction } from "../navigation/authRedirect";
import type { RootStackParamList } from "../navigation/types";
import type { RouteProp } from "@react-navigation/native";

export function LoginPage() {
  const { login } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Login">>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const onSubmit = async () => {
    setError("");
    setIsLoggingIn(true);
    try {
      await login({ email, password });
      navigation.dispatch(createPostAuthResetAction(route.params?.redirectTo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Heading>Login</Heading>
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <ErrorText message={error} />
        <Button label={isLoggingIn ? "Logging in..." : "Login"} onPress={() => void onSubmit()} disabled={isLoggingIn} />
        <Button label="Create account" tone="secondary" onPress={() => navigation.navigate("Register", { backTitle: "Login" })} />
      </Card>
    </Screen>
  );
}
