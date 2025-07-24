import { BarCodeScannerResult } from "expo-barcode-scanner";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useApiClient } from "../utils/apiClient";
const { width, height } = Dimensions.get('window');
const SCAN_AREA_SIZE = Math.min(width, height) * 0.6;

const BarcodeScanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showUnrecognizedModal, setShowUnrecognizedModal] = useState(false);
  const [showRecognizedModal, setShowRecognizedModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const { request } = useApiClient();
  const router = useRouter();

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Camera permission is required to scan barcodes
        </Text>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true);
    try {
      const response = await request("/item/scan", "POST", { data });
      console.log("Success", `Item scanned: ${data}`);
      console.log("API Response:", JSON.stringify(response, null, 2));
      
      if (response.data === null) {
        // Item not found in database - store the barcode data for display
        setScannedItem({ barcode: data });
        setShowUnrecognizedModal(true);
      } else {
        // Store the full response data for debugging
        console.log("Scanned item data:", JSON.stringify(response.data, null, 2));
        setScannedItem(response.data);
        setShowRecognizedModal(true);
      }
    } catch (error) {
      console.error("Failed to scan item:", error);
      Alert.alert("Error", "Failed to process scanned item");
      setScanned(false); // Allow scanning again on error
    }
  };

  const handleGoToPantry = () => {
    setShowUnrecognizedModal(false);
    setScanned(false);
    router.push('/pantry?openModal=true');
  };

  const handleCloseUnrecognizedModal = () => {
    setShowUnrecognizedModal(false);
    setScanned(false);
  };

  const handleCloseRecognizedModal = () => {
    setShowRecognizedModal(false);
    setScanned(false);
  };

  const handleAdditem = async (data: any) => {
    try {
      console.log("Adding item with data:", JSON.stringify(data, null, 2));
      
      // Prepare the item data for the API
      const itemData = {
        name: data.name || data.title || data.product_name || "Unknown Item",
        listId: 1, // Default list ID - you might want to make this configurable
        // Add any other required fields from the scan response
        ...data
      };
      
      console.log("Sending to API:", JSON.stringify(itemData, null, 2));
      
      const response = await request("/item", "POST", itemData);
      console.log("Add item response:", JSON.stringify(response, null, 2));
      
      setShowSuccessModal(true);
      setShowRecognizedModal(false);
    } catch (error) {
      console.error("Failed to add item:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert("Error", `Failed to Add Item: ${errorMessage}`);
    }
  };
  

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          {/* Corner indicators */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Position barcode within the frame
          </Text>
        </View>
      </View>

      {/* Unrecognized Item Modal */}
      <Modal
        visible={showUnrecognizedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseUnrecognizedModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Item Not Recognized</Text>
            <Text style={styles.modalMessage}>
              This item was not found in our database. You can add it manually to your pantry.
            </Text>
            {scannedItem?.barcode && (
              <Text style={styles.barcodeInfo}>
                Barcode: {scannedItem.barcode}
              </Text>
            )}
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleGoToPantry}
            >
              <Text style={styles.modalButtonText}>Go to Pantry</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={handleCloseUnrecognizedModal}
            >
              <Text style={styles.modalCancelText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recognized Item Modal */}
      <Modal
        visible={showRecognizedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseRecognizedModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Item Found!</Text>
            <Text style={styles.modalMessage}>
              "{scannedItem?.name || scannedItem?.title || scannedItem?.product_name || 'Item'}" was recognized successfully.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => handleAdditem(scannedItem)}
            >
              <Text style={styles.modalButtonText}>Add Item</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleCloseRecognizedModal}
            >
              <Text style={styles.modalButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>
              "{scannedItem?.name || scannedItem?.title || scannedItem?.product_name || 'Item'}" was added to your pantry.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.push('/pantry');
              }}
            >
              <Text style={styles.modalButtonText}>Go to Pantry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalCancelText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#fff",
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructions: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: "center",
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#666",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#6c47ff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  modalCancelText: {
    color: "#666",
    fontSize: 16,
  },
  barcodeInfo: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    fontFamily: "monospace",
  },
}); 

export default BarcodeScanner;