import { Text, TouchableOpacity } from "react-native";

type AddListButtonProps = {
  setModalVisible: (visible: boolean) => void;
};

export const AddListButton = ({ setModalVisible }: AddListButtonProps) => {
  return (
    <TouchableOpacity onPress={() => setModalVisible(true)}>
      <Text style={{ fontSize: 24 }}>+</Text>
    </TouchableOpacity>
  );
};
