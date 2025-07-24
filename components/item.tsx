import { Item } from "@/shared/types";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type ItemBlockProps = {
  item: Item;
  onDeleted: (deletedId: Number) => void;
  selected?: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
};

export const ItemBlock = ({ item, onDeleted, selected = false, onLongPress, onPress }: ItemBlockProps) => {
  // Type guards for new product structure
  const isProduct = (it: any): it is { description?: string; brand?: string; price?: number|string; size?: string; unit?: string } =>
    typeof it === 'object' && ('description' in it || 'brand' in it || 'price' in it || 'size' in it || 'unit' in it);

  const name = isProduct(item) && item.description ? item.description : item.name;
  const brand = isProduct(item) ? item.brand : undefined;
  const price = isProduct(item) ? item.price : undefined;
  const size = isProduct(item) ? (item.size || item.unit) : undefined;
  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      onPress={onPress}
      style={[styles.itemContent, selected && styles.selected]}
      delayLongPress={300}
    >
      <Text style={styles.itemText}>{name}</Text>
      {brand && <Text style={styles.itemSubtext}>{brand}</Text>}
      {size && <Text style={styles.itemSubtext}>{size}</Text>}
      {price !== undefined && <Text style={styles.itemSubtext}>${parseFloat(price as string).toFixed(2)}</Text>}
      {item.expirationDate && (
        <Text style={styles.itemSubtext}>
          Exp: {new Date(item.expirationDate).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 8,
  },
  selected: {
    backgroundColor: "#e0d7fa",
    borderColor: "#6c47ff",
    borderWidth: 2,
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
    width: "100%",
  },
  itemSubtext: {
    fontSize: 12,
    color: "#666",
    width: "100%",
  },
});
