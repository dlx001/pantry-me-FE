import { List } from "@/shared/types";
import { useApiClient } from "@/utils/apiClient";
import { useState } from "react";
import { Button, Modal, StyleSheet, Text, TextInput, View } from "react-native";
type AddListModalProps = {
  visible: boolean;
  onClose: () => void;
  onListCreated: (newList: List) => void;
};

export const AddListModal = ({
  visible,
  onClose,
  onListCreated,
}: AddListModalProps) => {
  const [name, setName] = useState("");
  const { request } = useApiClient();

  const handleSubmit = async () => {
    try {
      const newList = await request<List>("/lists", "POST", { name });
      console.log("Created list:", newList);
      setName("");
      onListCreated(newList);
      onClose();
    } catch (error) {
      console.log(error);
      console.error("Failed to create list", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text>Name:</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter list name"
            style={styles.input}
          />
          <Button title="Submit" onPress={handleSubmit} />
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 16,
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginVertical: 12,
    paddingHorizontal: 8,
  },
});
