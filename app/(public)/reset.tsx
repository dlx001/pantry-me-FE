import { useSignIn } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import React, { useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";

const PwReset = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const { signIn, setActive } = useSignIn();

  const onRequestReset = async () => {
    try {
      if (!signIn) return alert("Sign-in object not ready yet.");

      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      setSuccessfulCreation(true);
    } catch (err: any) {
      alert(err.errors[0]?.message || "Unknown error");
    }
  };

  const onReset = async () => {
    try {
      if (!signIn) return alert("Sign-in object not ready yet.");

      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });
      alert("Password reset successfully");

      await setActive({ session: result.createdSessionId });
    } catch (err: any) {
      alert(err.errors[0]?.message || "Unknown error");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !successfulCreation }} />

      {!successfulCreation && (
        <>
          <TextInput
            autoCapitalize="none"
            placeholder="email"
            value={emailAddress}
            onChangeText={setEmailAddress}
            style={styles.inputField}
          />

          <Button
            onPress={onRequestReset}
            title="Send Reset Email"
            color={"#6c47ff"}
          ></Button>
        </>
      )}

      {successfulCreation && (
        <>
          <View>
            <TextInput
              value={code}
              placeholder="Code..."
              style={styles.inputField}
              onChangeText={setCode}
            />
            <TextInput
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.inputField}
            />
          </View>
          <Button
            onPress={onReset}
            title="Set new Password"
            color={"#6c47ff"}
          ></Button>
        </>
      )}
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

export default PwReset;
