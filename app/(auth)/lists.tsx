import { AddListButton } from "@/components/addListButton";
import { AddListModal } from "@/components/addListModal";
import { ListBlock } from "@/components/list";
import { List } from "@/shared/types";
import { useUser } from "@clerk/clerk-expo";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useApiClient } from "../../utils/apiClient";
const Home = () => {
  const { user } = useUser();
  const { request } = useApiClient();
  const [lists, setLists] = useState<List[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await request("/lists");
        console.log(data.data);
        setLists(data.data);
      } catch (err) {
        console.error("API error:", err);
      }
    };

    loadData();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome, Meow</Text>
      {lists.map((list) => (
        <ListBlock
          key={list.id.toString()}
          list={list}
          onDeleted={(deleteId) =>
            setLists((prev) => prev.filter((item) => item.id != deleteId))
          }
        ></ListBlock>
      ))}
      <AddListButton setModalVisible={setModalVisible} />
      <AddListModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onListCreated={(newList) => setLists((prev) => [...prev, newList])}
      />
    </View>
  );
};
export default Home;
