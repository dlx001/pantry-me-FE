import { useAuth, useSignIn, useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import { Link } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";

import {
  Button,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Spinner from "react-native-loading-spinner-overlay";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();
const Login = () => {
  const [token, setToken] = useState<string | null>(null);
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    const fetchToken = async () => {
      if (isSignedIn) {
        try {
          const newToken = await getToken();
          console.log("JWT Token:", newToken);

          const response = await fetch(
            "https://pantry-me-dlx001-daniel-xus-projects.vercel.app/test",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${newToken}`,
                "Content-Type": "application/json",
                "x-vercel-protection-bypass":
                  "pantryMeTest12345678910111314151",
              },
            }
          );

          const contentType = response.headers.get("content-type");

          if (!response.ok) {
            const errorText = await response.text(); // handle HTML errors
            console.error("Server error:", errorText);
            return;
          }

          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("Protected API response:", data);
          } else {
            const text = await response.text();
            console.log("Non-JSON response:", text);
          }
          setToken(newToken); // Optional: Store/display token
        } catch (err) {
          console.error("Error fetching protected endpoint:", err);
        }
      }
    };

    fetchToken();
  }, [isSignedIn]);
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          // For web, defaults to current path
          // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
          // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        const token = await getToken();
        console.log("JWT Token:", token);
        setActive!({ session: createdSessionId });
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }, []);
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      alert(err.errors?.[0]?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />

      <TextInput
        autoCapitalize="none"
        placeholder="email"
        value={emailAddress}
        onChangeText={setEmailAddress}
        style={styles.inputField}
        editable={!loading}
      />
      <TextInput
        placeholder="password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.inputField}
        editable={!loading}
      />

      <Button
        onPress={onSignInPress}
        title="Login"
        color="#6c47ff"
        disabled={loading}
      />

      <View style={{ marginVertical: 8 }}>
        <Button title="Sign in with Google" onPress={onPress} />
      </View>

      <Link href="/reset" asChild>
        <Pressable style={styles.button} disabled={loading}>
          <Text>Forgot password?</Text>
        </Pressable>
      </Link>
      <Link href="/register" asChild>
        <Pressable style={styles.button} disabled={loading}>
          <Text>Create Account</Text>
        </Pressable>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#6c47ff",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    margin: 8,
    alignItems: "center",
  },
});

export default Login;
