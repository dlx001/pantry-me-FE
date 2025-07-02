import { AddItemButton } from "@/components/AddItemButton";
import { AddItemModal } from "@/components/addItemModal";
import { ItemBlock } from "@/components/item";
import LocationCard, { LocationType, UserLocationType } from "@/components/LocationCard";
import ProductCard from "@/components/ProductCard";
import { Item } from "@/shared/types";
import { useUser } from "@clerk/clerk-expo";
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Button, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [userLocation, setUserLocation] = useState<UserLocationType | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<(string | number)[]>([]);
  const [savedLocations, setSavedLocations] = useState<LocationType[]>([]);
  const [pressedId, setPressedId] = useState<string | number | null>(null);
  const { setSelection, selectedItems: contextSelectedItems, selectedLocations: contextSelectedLocations, userLocation: contextUserLocation } = useSelection();
  const [showProductSuggestion, setShowProductSuggestion] = useState(false);
  const [productsByItemAndLocation, setProductsByItemAndLocation] = useState<{
    [itemId: string]: { [locationId: string]: any[] }
  }>({});
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [selectedProductByItem, setSelectedProductByItem] = useState<{ [itemId: string]: { locationId: string | number, productId: string | number } }>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await request("/item");
        console.log(data.data);
        setItems(data.data);
      } catch (err) {
        console.error("API error:", err);
      }
    };

    loadData();
  }, []);

  // Check if we should open the modal automatically
  useEffect(() => {
    if (params.openModal === 'true') {
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
    const idsArray = selectedItems.map(id => Number(id));
     try {
        console.log(selectedItems);
        const data = await request("/item/batch", "DELETE", { items: idsArray });
        setItems(items => items.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
        setSelectMode(false);
      } catch (err) {
        console.error("API error:", err);
      }
    }
  

  const handleConvertSelected = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access location was denied');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lng = location.coords.longitude;
    setUserLocation({ lat, lng });

    // Make your API request to get locations
    try {
      let latlong = lat + ',' + lng;
      const response = await request('/item/location?latlong=' + latlong, 'GET');
      setLocations(response.data); 
      setShowLocationsModal(true);
    } catch (error) {
      alert('Failed to convert to grocery list');
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
        const selectedProduct = products.find((p: any) => 
          (p.productId || p.id) === productInfo.productId
        );
        
        if (selectedProduct) {
          itemsByLocation[locationId].push({
            name: selectedProduct.description || selectedProduct.name,
            brand: selectedProduct.brand || null,
            unit: selectedProduct.items?.[0]?.size || selectedProduct.items?.[0]?.unit || 'unit',
            price: selectedProduct.items?.[0]?.price?.regular?.toString() || '0',
            image_url: selectedProduct.images?.[0]?.sizes?.find((s: any) => s.size === 'medium')?.url || null,
            store: '' // Will be set below with location name
          });
        }
      });
      
      // Create a list for each location
      const locationNames = locations.reduce((acc, location) => {
        acc[location.locationId] = location.name;
        return acc;
      }, {} as { [key: string]: string });
      
      for (const [locationId, items] of Object.entries(itemsByLocation)) {
        const locationName = locationNames[locationId] || `Location ${locationId}`;
        
        // Set the store name for all items in this location
        const itemsWithStore = items.map(item => ({
          ...item,
          store: locationName
        }));
        
        const listData = {
          name: `${locationName} List`,
          items: itemsWithStore
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
      router.push('/lists');
    } catch (error) {
      console.error('Failed to create lists:', error);
      alert('Failed to create lists. Please try again.');
    }
  };

  return (
    <SelectionProvider>
      <View style={{ flex: 1 }}>
        {selectMode && selectedItems.length > 0 && (
          <View style={styles.actionBar}>
            <Button title={`Delete (${selectedItems.length})`} onPress={handleDeleteSelected} />
            <Button title={`Convert to List (${selectedItems.length})`}onPress={handleConvertSelected} />
            <Button title="Unselect All" onPress={() => setSelectedItems([])} />
          </View>
        )}
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ItemBlock
              item={item}
              onDeleted={(deleteId) =>
                setItems((prev) => prev.filter((i) => i.id !== deleteId))
              }
              selected={selectedItems.includes(item.id)}
              onLongPress={() => {
                setSelectMode(true);
                setSelectedItems([item.id]);
              }}
              onPress={() => {
                if (selectMode) {
                  setSelectedItems(selectedItems => {
                    const isSelected = selectedItems.includes(item.id);
                    const newSelected = isSelected
                      ? selectedItems.filter(id => id !== item.id)
                      : [...selectedItems, item.id];
                    // If all items are unselected, exit select mode
                    if (newSelected.length === 0) setSelectMode(false);
                    return newSelected;
                  });
                }
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          scrollEnabled={!modalVisible}
          pointerEvents={modalVisible ? "none" : "auto"}
        />

        <AddItemButton
          setModalVisible={setModalVisible}
          onScan={() => router.push('/BarcodeScanner')}
        />
        <AddItemModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onItemCreated={(newItem) => setItems((prev) => [...prev, newItem])}
        />

        <Modal visible={showLocationsModal} animationType="slide">
          <View style={{ flex: 1, backgroundColor: "#f3f0fa" }}>
            <TouchableOpacity onPress={() => setShowLocationsModal(false)} style={{ padding: 16 }}>
              <Text style={{ color: "#6c47ff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
            <FlatList
              data={locations}
              keyExtractor={(item, idx) => (item?.locationId ? item.locationId.toString() : idx.toString())}
              renderItem={({ item }) => {
                const isSelected = selectedLocationIds.includes(item.locationId);
                const isPressed = pressedId === item.locationId;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (isSelected) {
                        setSelectedLocationIds(ids => ids.filter(id => id !== item.locationId));
                      } else if (selectedLocationIds.length < 2) {
                        setSelectedLocationIds(ids => [...ids, item.locationId]);
                      } else {
                        alert('You can only select up to 2 locations.');
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
            <Button
              title="See Suggestions"
              disabled={selectedLocationIds.length === 0}
              onPress={async () => {
                setSuggestionLoading(true);
                const selectedItemObjs = items.filter(item => selectedItems.includes(item.id));
                const locationIdsArray = selectedLocationIds.map(Number); // ensure integers
                const newProducts: { [itemId: string]: { [locationId: string]: any[] } } = {};
                try {
                  for (const item of selectedItemObjs) {
                    const params = new URLSearchParams();
                    params.append('item', item.name);
                    locationIdsArray.forEach(id => params.append('locationIds', id.toString()));
                    const res = await request(`/item/kroger?${params.toString()}`);
                    newProducts[item.id] = res;
                    console.log('Full response:', JSON.stringify(res, null, 2));
                  }
                  setProductsByItemAndLocation(newProducts);
                  setShowProductSuggestion(true);
                } catch (e) {
                  console.log(e); 
                  alert('Failed to fetch product suggestions');
                }
                setSuggestionLoading(false);
              }}
            />
          </View>
        </Modal>

        <Modal visible={showProductSuggestion} animationType="slide">
          <View style={{ flex: 1, backgroundColor: "#f3f0fa" }}>
            <TouchableOpacity onPress={() => setShowProductSuggestion(false)} style={{ padding: 16 }}>
              <Text style={{ color: "#6c47ff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
            {suggestionLoading && <Text style={{textAlign:'center',margin:10}}>Loading suggestions...</Text>}
            {selectedItems.length > 0 && (
              <>
                <Text style={{ fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 12 }}>
                  {items.find(i => i.id === selectedItems[currentSuggestionIndex])?.name}
                </Text>
                <View style={{ flex: 1 }}>
                  <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                    {selectedLocationIds.map(locationId => {
                      const products = productsByItemAndLocation[selectedItems[currentSuggestionIndex]]?.[locationId] || [];
                      const location = locations.find(l => l.locationId === locationId);
                      return (
                        <View key={locationId} style={{ marginBottom: 16 }}>
                          <FlatList
                            data={products}
                            keyExtractor={product => product.productId || product.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item: product }) => {
                              const currentItemId = selectedItems[currentSuggestionIndex];
                              const thisId = product.productId || product.id;
                              const isSelected = selectedProductByItem[currentItemId]?.locationId === locationId &&
                                                 selectedProductByItem[currentItemId]?.productId === thisId;
                              return (
                                <ProductCard
                                  product={{
                                    id: thisId,
                                    name: product.description || product.name,
                                    imageUrl: product.images?.[0]?.sizes?.find((s: any) => s.size === 'medium')?.url,
                                    price: product.items?.[0]?.price?.regular,
                                    description: product.brand,
                                    unit: product.items?.[0]?.size || product.items?.[0]?.unit
                                  }}
                                  clickable
                                  selected={isSelected}
                                  onPress={() => {
                                    if (isSelected) {
                                      setSelectedProductByItem(prev => {
                                        const copy = { ...prev };
                                        delete copy[currentItemId];
                                        return copy;
                                      });
                                    } else {
                                      setSelectedProductByItem(prev => ({
                                        ...prev,
                                        [currentItemId]: { locationId, productId: thisId }
                                      }));
                                    }
                                  }}
                                />
                              );
                            }}
                            ListEmptyComponent={<Text style={{ color: '#888', marginLeft: 8 }}>No products found.</Text>}
                            contentContainerStyle={{ paddingHorizontal: 8 }}
                          />
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  backgroundColor: '#f3f0fa',
                  borderTopWidth: 1,
                  borderTopColor: '#e0d7fa'
                }}>
                  <Button
                    title="Prev"
                    onPress={async () => {
                      if (currentSuggestionIndex > 0) {
                        setSuggestionLoading(true);
                        const prevIndex = currentSuggestionIndex - 1;
                        const itemId = selectedItems[prevIndex];
                        if (!productsByItemAndLocation[itemId]) {
                          const item = items.find(i => i.id === itemId);
                          if (item) {
                            const params = new URLSearchParams();
                            params.append('item', item.name);
                            selectedLocationIds.map(Number).forEach(id => params.append('locationIds', id.toString()));
                            const res = await request(`/item/kroger?${params.toString()}`);
                            setProductsByItemAndLocation(prev => ({ ...prev, [itemId]: res }));
                          }
                        }
                        setCurrentSuggestionIndex(prevIndex);
                        setSuggestionLoading(false);
                      }
                    }}
                    disabled={currentSuggestionIndex === 0 || suggestionLoading}
                  />
                  <Text style={{ fontSize: 16, color: '#6c47ff', fontWeight: 'bold' }}>
                    {currentSuggestionIndex + 1} / {selectedItems.length}
                  </Text>
                  <Button
                    title="Next"
                    onPress={async () => {
                      if (currentSuggestionIndex < selectedItems.length - 1) {
                        setSuggestionLoading(true);
                        const nextIndex = currentSuggestionIndex + 1;
                        const itemId = selectedItems[nextIndex];
                        if (!productsByItemAndLocation[itemId]) {
                          const item = items.find(i => i.id === itemId);
                          if (item) {
                            const params = new URLSearchParams();
                            params.append('item', item.name);
                            selectedLocationIds.map(Number).forEach(id => params.append('locationIds', id.toString()));
                            const res = await request(`/item/kroger?${params.toString()}`);
                            setProductsByItemAndLocation(prev => ({ ...prev, [itemId]: res }));
                          }
                        }
                        setCurrentSuggestionIndex(nextIndex);
                        setSuggestionLoading(false);
                      }
                    }}
                    disabled={currentSuggestionIndex === selectedItems.length - 1 || suggestionLoading}
                  />
                </View>
                {selectedItems.length > 0 && selectedItems.every(itemId => selectedProductByItem[itemId]) && (
                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Button
                      title="Finish"
                      color="#6c47ff"
                      onPress={handleCreateLists}
                    />
                  </View>
                )}
              </>
            )}
          </View>
        </Modal>
      </View>
    </SelectionProvider>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#f3f0fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0d7fa',
  },
  unit: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default Pantry;
