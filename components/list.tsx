import { List } from "@/shared/types";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { DeleteListButton } from "./deleteListButton";
type ListBlockProps = {
  list: List;
  onDeleted: (deletedId: Number) => void;
};

function renderRightActions(
  listId: Number,
  onDeleted: (deletedId: Number) => void
) {
  return (
    <View style={styles.rightAction}>
      <DeleteListButton id={listId} onDeleted={onDeleted} />
    </View>
  );
}

export const ListBlock = ({ list, onDeleted }: ListBlockProps) => {
  return (
    <GestureHandlerRootView>
      <Swipeable
        friction={2}
        rightThreshold={40}
        renderRightActions={() => renderRightActions(list.id, onDeleted)}
        containerStyle={styles.swipeable}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemText}>{list.name}</Text>
          <Text style={styles.itemSubtext}>{list.items?.length} items</Text>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  swipeable: {
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  itemContent: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rightAction: {
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemSubtext: {
    fontSize: 12,
    color: "#666",
  },
});
