import { AddItemButton } from "@/components/AddItemButton";
import { AddItemModal } from "@/components/addItemModal";
import { ItemBlock } from "@/components/item";
import LocationCard, {
  LocationType,
  UserLocationType,
} from "@/components/LocationCard";
import ProductCard from "@/components/ProductCard";
import { Item } from "@/shared/types";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Button,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SelectionProvider, useSelection } from "../../shared/SelectionContext";
import { useApiClient } from "../../utils/apiClient";

const Pantry = () => {
  const { user } = useUser();
  const { request } = useApiClient();
  const [items, setItems] = useState<Item[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocationType | null>(
    null
  );
  const [selectedLocationIds, setSelectedLocationIds] = useState<
    (string | number)[]
  >([]);
  const [pressedId, setPressedId] = useState<string | number | null>(null);
  const {
    setSelection,
    selectedItems: contextSelectedItems,
    selectedLocations: contextSelectedLocations,
    userLocation: contextUserLocation,
  } = useSelection();
  const [showProductSuggestion, setShowProductSuggestion] = useState(false);
  const [productsByItemAndLocation, setProductsByItemAndLocation] = useState<{
    [itemId: string]: { [locationId: string]: any[] };
  }>({});
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [selectedProductByItem, setSelectedProductByItem] = useState<{
    [itemId: string]: {
      locationId: string | number;
      productId: string | number;
    };
  }>({});
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await request("/item");
        console.log(data.data);
        setItems(data.data);
      } catch (err) {
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if we should open the modal automatically
  useEffect(() => {
    if (params.openModal === "true") {
      setModalVisible(true);
    }
  }, [params.openModal]);

  // Exit select mode if all items are unselected
  useEffect(() => {
    if (selectMode && selectedItems.length === 0) {
      setSelectMode(false);
    }
  }, [selectedItems, selectMode]);

  const handleDeleteSelected = async () => {
    const idsArray = selectedItems.map((id) => Number(id));
    try {
      console.log(selectedItems);
      const data = await request("/item/batch", "DELETE", { items: idsArray });
      setItems((items) =>
        items.filter((item) => !selectedItems.includes(item.id))
      );
      setSelectedItems([]);
      setSelectMode(false);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  const handleConvertSelected = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const lat = parseFloat(location.coords.latitude.toFixed(4));
      const lng = parseFloat(location.coords.longitude.toFixed(4));
      setUserLocation({ lat, lng });

      // Make your API request to get locations
      let latlong = lat + "," + lng;
      const krogerRes = await request(
        "/grocery/location?latlong=" + latlong + "&store=kroger",
        "GET"
      );
      const walmartRes = await request(
        "/grocery/location?latlong=" + latlong + "&store=walmart",
        "GET"
      );

      let krogerLocations = krogerRes;
      for (let loc of krogerLocations) {
        loc.endpoint = "kroger";
      }
      let walmartLocations = walmartRes;
      if (walmartLocations.length > 5) {
        walmartLocations = walmartLocations.slice(0, 5);
      }
      for (let loc of walmartLocations) {
        loc.endpoint = "walmart";
      }
      let allLocations = [...krogerLocations, ...walmartLocations];
      console.log(allLocations);
      setLocations(allLocations);
      setShowLocationsModal(true);
    } catch (error) {
      alert("Failed to convert to grocery list");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCreateLists = async () => {
    try {
      // Group items by location
      const itemsByLocation: { [locationId: string]: any[] } = {};

      Object.entries(selectedProductByItem).forEach(([itemId, productInfo]) => {
        const locationId = productInfo.locationId.toString();
        if (!itemsByLocation[locationId]) {
          itemsByLocation[locationId] = [];
        }

        // Get the product details from the productsByItemAndLocation
        const products = productsByItemAndLocation[itemId]?.[locationId] || [];
        const selectedProduct = products.find(
          (p: any) => (p.productId || p.productid || p.id) === productInfo.productId
        );

        if (selectedProduct) {
          itemsByLocation[locationId].push({
            name: selectedProduct.description || selectedProduct.name,
            brand: selectedProduct.brand || null,
            unit: selectedProduct.size || selectedProduct.unit || selectedProduct.items?.[0]?.size || selectedProduct.items?.[0]?.unit || "unit",
            price: (selectedProduct.price !== undefined ? selectedProduct.price : (selectedProduct.items?.[0]?.price?.regular))?.toString() || "0",
            img_url: selectedProduct.image || (selectedProduct.images?.[0]?.sizes?.find((s: any) => s.size === "medium")?.url) || null,
            store: "", // Will be set below with location name
          });
        }
      });

      // Create a list for each location
      const locationNames = locations.reduce((acc, location) => {
        acc[location.locationId] = location.name;
        return acc;
      }, {} as { [key: string]: string });

      for (const [locationId, items] of Object.entries(itemsByLocation)) {
        const locationName =
          locationNames[locationId] || `Location ${locationId}`;

        // Set the store name for all items in this location
        const itemsWithStore = items.map((item) => ({
          ...item,
          store: locationName,
        }));

        const listData = {
          name: `${locationName} List`,
          items: itemsWithStore,
        };

        console.log(`Creating list for ${locationName}:`, listData);
        const response = await request("/lists", "POST", listData);
        console.log(`List created for ${locationName}:`, response);
      }

      // Close modals and navigate to lists page
      setShowProductSuggestion(false);
      setShowLocationsModal(false);
      setSelectedItems([]);
      setSelectMode(false);
      setSelectedProductByItem({});

      // Navigate to lists page
      router.push("/lists");
    } catch (error) {
      console.error("Failed to create lists:", error);
      alert("Failed to create lists. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading pantry items...</Text>
      </View>
    );
  }

  return (
    <SelectionProvider>
      <View style={{ flex: 1 }}>
        {selectMode && selectedItems.length > 0 && (
          <View style={styles.actionBar}>
            <Button
              title={`Delete (${selectedItems.length})`}
              onPress={handleDeleteSelected}
            />
            <Button
              title={`Convert to List (${selectedItems.length})`}
              onPress={handleConvertSelected}
            />
            <Button title="Unselect All" onPress={() => setSelectedItems([])} />
          </View>
        )}

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No items in your pantry yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add items to your pantry to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ItemBlock
                item={item}
                onDeleted={(deletedId) => {
                  setItems((items) =>
                    items.filter((item) => item.id !== deletedId)
                  );
                }}
                selected={selectedItems.includes(item.id)}
                onLongPress={() => {
                  if (!selectMode) {
                    setSelectMode(true);
                    setSelectedItems([item.id]);
                  }
                }}
                onPress={() => {
                  if (selectMode) {
                    setSelectedItems((prev) => {
                      const isSelected = prev.includes(item.id);
                      const newSelected = isSelected
                        ? prev.filter((id) => id !== item.id)
                        : [...prev, item.id];
                      // If all items are unselected, exit select mode
                      if (newSelected.length === 0) setSelectMode(false);
                      return newSelected;
                    });
                  }
                }}
              />
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <AddItemButton
          setModalVisible={setModalVisible}
          onScan={() => router.push("/BarcodeScanner")}
        />
        <AddItemModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onItemCreated={(newItem) => {
            setItems((prev) => [...prev, newItem]);
            setModalVisible(false);
          }}
        />

        <Modal visible={showLocationsModal} animationType="slide">
          <View style={{ flex: 1, backgroundColor: "#f3f0fa" }}>
            <TouchableOpacity
              onPress={() => setShowLocationsModal(false)}
              style={{ padding: 16 }}
            >
              <Text style={{ color: "#6c47ff", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
            {locationLoading ? (
              <View style={styles.modalLoadingContainer}>
                <Text style={styles.modalLoadingText}>
                  Finding nearby stores...
                </Text>
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item, idx) =>
                  item?.locationId ? item.locationId.toString() : idx.toString()
                }
                renderItem={({ item }) => {
                  const isSelected = selectedLocationIds.includes(
                    item.locationId
                  );
                  const isPressed = pressedId === item.locationId;
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (isSelected) {
                          setSelectedLocationIds((ids) =>
                            ids.filter((id) => id !== item.locationId)
                          );
                        } else if (selectedLocationIds.length < 2) {
                          setSelectedLocationIds((ids) => [
                            ...ids,
                            item.locationId,
                          ]);
                        } else {
                          alert("You can only select up to 2 locations.");
                        }
                      }}
                      onPressIn={() => setPressedId(item.locationId)}
                      onPressOut={() => setPressedId(null)}
                      activeOpacity={1}
                    >
                      {userLocation && (
                        <LocationCard
                          location={item}
                          userLocation={userLocation}
                          selected={isSelected}
                          pressed={isPressed}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
            <Button
              title="See Suggestions"
              disabled={selectedLocationIds.length === 0}
              onPress={async () => {
                setSuggestionLoading(true);
                const selectedItemObjs = items.filter((item) =>
                  selectedItems.includes(item.id)
                );
                const locationIdsArray = selectedLocationIds.map(Number); // ensure integers
                const newProducts: {
                  [itemId: string]: { [locationId: string]: any[] };
                } = {};
                try {
                  for (const item of selectedItemObjs) {
                    const newSortedProducts: { [locationId: string]: any[] } = {};
                    for (const locationId of locationIdsArray) {
                      const location = locations.find(l => l.locationId === locationId);
                      const store = location?.endpoint || 'kroger';
                      const params = new URLSearchParams();
                      params.append('store', store);
                      params.append('locationIds', locationId.toString());
                      params.append('item', item.name);
                      const res = await request(`/grocery/product?${params.toString()}`);
                      if (Array.isArray(res)) {
                        // Walmart: response is an array of products for this locationId
                        newSortedProducts[locationId] = res.sort((a: any, b: any) => {
                          const priceA = parseFloat(a.price || '0');
                          const priceB = parseFloat(b.price || '0');
                          return priceA - priceB;
                        });
                      } else if (res && typeof res === 'object') {
                        // Kroger: response is an object mapping locationId to array
                        Object.keys(res).forEach((locId) => {
                          const products = res[locId] || [];
                          newSortedProducts[locId] = products.sort((a: any, b: any) => {
                            const priceA = parseFloat(a.price || '0');
                            const priceB = parseFloat(b.price || '0');
                            return priceA - priceB;
                          });
                        });
                      }
                    }
                    newProducts[item.id] = newSortedProducts;
                  }
                  setProductsByItemAndLocation(newProducts);
                  setShowProductSuggestion(true);
                } catch (e) {
                  console.log(e);
                  alert("Failed to fetch product suggestions");
                }
                setSuggestionLoading(false);
              }}
            />
          </View>
        </Modal>

        <Modal visible={showProductSuggestion} animationType="slide">
          <View style={{ flex: 1, backgroundColor: "#f3f0fa" }}>
            <TouchableOpacity
              onPress={() => setShowProductSuggestion(false)}
              style={{ padding: 16 }}
            >
              <Text style={{ color: "#6c47ff", fontWeight: "bold" }}>
                Close
              </Text>
            </TouchableOpacity>
            {suggestionLoading && (
              <View style={styles.modalLoadingContainer}>
                <Text style={styles.modalLoadingText}>
                  Loading product suggestions...
                </Text>
              </View>
            )}
            {selectedItems.length > 0 && (
              <>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 20,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
                  {
                    items.find(
                      (i) => i.id === selectedItems[currentSuggestionIndex]
                    )?.name
                  }
                </Text>
                <View style={{ flex: 1 }}>
                  <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                    {selectedLocationIds.map((locationId) => {
                      const products =
                        productsByItemAndLocation[
                          selectedItems[currentSuggestionIndex]
                        ]?.[locationId] || [];
                      const location = locations.find(
                        (l) => l.locationId === locationId
                      );
                      return (
                        <View key={locationId} style={{ marginBottom: 16 }}>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: "#6c47ff",
                              marginBottom: 8,
                              marginLeft: 16,
                            }}
                          >
                            {location?.name || `Location ${locationId}`}
                          </Text>
                          <FlatList
                            data={products}
                            keyExtractor={(product) => product.productid?.toString() || product.id?.toString() || product.upc || Math.random().toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item: product }) => {
                              const currentItemId =
                                selectedItems[currentSuggestionIndex];
                              const thisId = product.productid || product.id || product.upc;
                              const isSelected =
                                selectedProductByItem[currentItemId]?.locationId === locationId &&
                                selectedProductByItem[currentItemId]?.productId === thisId;
                              return (
                                <ProductCard
                                  key={thisId}
                                  product={{
                                    id: thisId,
                                    name: product.description || product.name,
                                    imageUrl: product.image || (product.images?.[0]?.sizes?.find((s: any) => s.size === "medium")?.url),
                                    price: product.price || product.items?.[0]?.price?.regular,
                                    description: product.brand,
                                    unit: product.size || product.items?.[0]?.size || product.items?.[0]?.unit,
                                  }}
                                  clickable
                                  selected={isSelected}
                                  onPress={() => {
                                    if (isSelected) {
                                      setSelectedProductByItem((prev) => {
                                        const copy = { ...prev };
                                        delete copy[currentItemId];
                                        return copy;
                                      });
                                    } else {
                                      setSelectedProductByItem((prev) => ({
                                        ...prev,
                                        [currentItemId]: {
                                          locationId,
                                          productId: thisId,
                                        },
                                      }));
                                    }
                                  }}
                                />
                              );
                            }}
                            ListEmptyComponent={
                              <Text style={{ color: "#888", marginLeft: 8 }}>
                                No products found.
                              </Text>
                            }
                            contentContainerStyle={{ paddingHorizontal: 8 }}
                          />
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    backgroundColor: "#f3f0fa",
                    borderTopWidth: 1,
                    borderTopColor: "#e0d7fa",
                  }}
                >
                  <Button
                    title="Prev"
                    onPress={async () => {
                      if (currentSuggestionIndex > 0) {
                        setSuggestionLoading(true);
                        const prevIndex = currentSuggestionIndex - 1;
                        const itemId = selectedItems[prevIndex];
                        if (!productsByItemAndLocation[itemId]) {
                          const item = items.find((i) => i.id === itemId);
                          if (item) {
                            const params = new URLSearchParams();
                            params.append("item", item.name);
                            selectedLocationIds
                              .map(Number)
                              .forEach((id) =>
                                params.append("locationIds", id.toString())
                              );
                            const res = await request(
                              `/grocery/product?${params.toString()}`
                            );

                            // Sort products by price (lowest first) for each location
                            const sortedProducts: {
                              [locationId: string]: any[];
                            } = {};
                            Object.keys(res).forEach((locationId) => {
                              const products = res[locationId] || [];
                              sortedProducts[locationId] = products.sort(
                                (a: any, b: any) => {
                                  const priceA = parseFloat(
                                    a.items?.[0]?.price?.regular || "0"
                                  );
                                  const priceB = parseFloat(
                                    b.items?.[0]?.price?.regular || "0"
                                  );
                                  return priceA - priceB;
                                }
                              );
                            });

                            setProductsByItemAndLocation((prev) => ({
                              ...prev,
                              [itemId]: sortedProducts,
                            }));
                          }
                        }
                        setCurrentSuggestionIndex(prevIndex);
                        setSuggestionLoading(false);
                      }
                    }}
                    disabled={currentSuggestionIndex === 0 || suggestionLoading}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#6c47ff",
                      fontWeight: "bold",
                    }}
                  >
                    {currentSuggestionIndex + 1} of {selectedItems.length}
                  </Text>
                  <Button
                    title="Next"
                    onPress={async () => {
                      if (currentSuggestionIndex < selectedItems.length - 1) {
                        setSuggestionLoading(true);
                        const nextIndex = currentSuggestionIndex + 1;
                        const itemId = selectedItems[nextIndex];
                        if (!productsByItemAndLocation[itemId]) {
                          const item = items.find((i) => i.id === itemId);
                          if (item) {
                            const params = new URLSearchParams();
                            params.append("item", item.name);
                            selectedLocationIds
                              .map(Number)
                              .forEach((id) =>
                                params.append("locationIds", id.toString())
                              );
                            const res = await request(
                              `/grocery/product?${params.toString()}`
                            );

                            // Sort products by price (lowest first) for each location
                            const sortedProducts: {
                              [locationId: string]: any[];
                            } = {};
                            Object.keys(res).forEach((locationId) => {
                              const products = res[locationId] || [];
                              sortedProducts[locationId] = products.sort(
                                (a: any, b: any) => {
                                  const priceA = parseFloat(
                                    a.items?.[0]?.price?.regular || "0"
                                  );
                                  const priceB = parseFloat(
                                    b.items?.[0]?.price?.regular || "0"
                                  );
                                  return priceA - priceB;
                                }
                              );
                            });

                            setProductsByItemAndLocation((prev) => ({
                              ...prev,
                              [itemId]: sortedProducts,
                            }));
                          }
                        }
                        setCurrentSuggestionIndex(nextIndex);
                        setSuggestionLoading(false);
                      }
                    }}
                    disabled={
                      currentSuggestionIndex === selectedItems.length - 1 ||
                      suggestionLoading
                    }
                  />
                </View>
                <Button
                  title="Create Lists"
                  onPress={handleCreateLists}
                  disabled={Object.keys(selectedProductByItem).length === 0}
                  color="#6c47ff"
                />
              </>
            )}
          </View>
        </Modal>
      </View>
    </SelectionProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f3f0fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e0d7fa",
  },
  listContainer: {
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoadingText: {
    fontSize: 16,
    color: "#666",
  },
});

export default Pantry;
