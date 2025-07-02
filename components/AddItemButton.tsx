import { Ionicons } from '@expo/vector-icons';
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Add a new prop for scan action
export type AddItemButtonProps = {
  setModalVisible: (visible: boolean) => void;
  onScan?: () => void;
};

export const AddItemButton = ({ setModalVisible, onScan }: AddItemButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleMainPress = () => {
    setOpen((prev) => !prev);
  };

  const handleAddPress = () => {
    setModalVisible(true);
    setOpen(false);
  };

  const handleScanPress = () => {
    if (onScan) onScan();
    setOpen(false);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {open && (
        <View style={styles.ellipse}>
          <TouchableOpacity style={styles.circleButton} onPress={handleScanPress}>
            <View style={styles.iconWrapper}>
              <Ionicons name="scan-outline" size={28} color="#6c47ff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleButton} onPress={handleAddPress}>
            <View style={styles.iconWrapper}>
              <Ionicons name="document-text-outline" size={28} color="#6c47ff" />
            </View>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        onPress={handleMainPress}
        style={styles.fab}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>{open ? "×" : "+"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 24,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  ellipse: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 12,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    backgroundColor: "#6c47ff",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    lineHeight: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
});
