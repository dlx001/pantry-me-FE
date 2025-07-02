import { Item } from "@/shared/types";
import { useApiClient } from "@/utils/apiClient";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { TouchableOpacity } from "react-native";
type AddListModalProps = {
  id: Number;
  onDeleted: (deletedId: Number) => void;
};

export const DeleteItemButton = ({ id, onDeleted }: AddListModalProps) => {
  const { request } = useApiClient();

  const handleDelete = async () => {
    try {
      const newList = await request<Item>(`/item/${id}`, "DELETE");
      console.log("delete list:", newList);
      onDeleted(id);
    } catch (error) {
      console.log(error);
      console.error("Failed to delete item", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleDelete}>
      <Ionicons name="trash" size={24} color={"#fff"} />
    </TouchableOpacity>
  );
};
