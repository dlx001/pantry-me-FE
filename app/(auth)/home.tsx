import { useUser } from "@clerk/clerk-expo";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { useApiClient } from "../../utils/apiClient";

const Home = () => {
  const { user } = useUser();
  const { request } = useApiClient();
  const [message, setMessage] = useState("");

  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const data = await request("/test");
  //       setMessage(data.message);
  //     } catch (err) {
  //       console.error("API error:", err);
  //     }
  //   };

  //   loadData();
  // }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome, {user?.emailAddresses[0].emailAddress} 🎉</Text>
      <Text>{message}</Text>
    </View>
  );
};

export default Home;
