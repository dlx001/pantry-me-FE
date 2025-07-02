import { Item } from "@/shared/types";
import { useApiClient } from "@/utils/apiClient";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from "react";
import { Button, Dimensions, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import React from "react";

type AddItemModalProps = {
  visible: boolean;
  onClose: () => void;
  onItemCreated: (newItem: Item) => void;
};

const screenHeight = Dimensions.get("window").height;

export const AddItemModal = ({
  visible,
  onClose,
  onItemCreated,
}: AddItemModalProps) => {
  const [name, setName] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { request } = useApiClient();

  const handleSubmit = async () => {
    try {
      const newItem = await request<Item>("/item", "POST", {
        name,
        expirationDate: expirationDate ? expirationDate.toISOString() : null,
      });
      setName("");
      setExpirationDate(undefined);
      onItemCreated(newItem);
      onClose();
    } catch (error) {
      console.error("Failed to create list", error);
    }
  };

  const handleCancel = () => {
    setName("");
    setExpirationDate(undefined);
    onClose();
  };

  return (
    visible && (
      <Modal animationType="slide" transparent={true} onRequestClose={handleCancel} presentationStyle="overFullScreen">
        <SafeAreaView style={styles.centeredView}>
          <View style={[styles.modalView, { maxHeight: screenHeight - 50 }]}> 
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Add a New Item</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter item name"
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text style={expirationDate ? styles.dateText : styles.placeholderText}>
                  {expirationDate ? expirationDate.toLocaleDateString() : "Enter expiration date (optional)"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={expirationDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setExpirationDate(selectedDate);
                  }}
                />
              )}
              <Button title="Submit" onPress={handleSubmit} />
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    )
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  cancelButton: {
    marginTop: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "blue",
  },
  dateText: {
    color: "#000",
  },
  placeholderText: {
    color: "#999",
  },
});
