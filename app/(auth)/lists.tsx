import { GroceryItem } from "@/shared/types";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Button, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApiClient } from "../../utils/apiClient";

interface GroceryList {
  id: number;
  name: string;
  items: GroceryItem[];
  createdAt: string;
  updatedAt: string;
}

const Lists = () => {
  const { user } = useUser();
  const { request } = useApiClient();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [expandedLists, setExpandedLists] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedLists, setSelectedLists] = useState<number[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const loadLists = async () => {
      try {
        const response = await request("/lists");
        setLists(response.data);
      } catch (error) {
        console.error("Failed to load lists:", error);
      }
    };

    loadLists();
  }, []);

  // Exit select mode if all lists are unselected
  useEffect(() => {
    if (selectMode && selectedLists.length === 0) {
      setSelectMode(false);
    }
  }, [selectedLists, selectMode]);

  const toggleListExpansion = (listId: number) => {
    if (selectMode) return; // Don't expand when in select mode
    
    setExpandedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      for (const listId of selectedLists) {
        await request(`/lists/${listId}`, "DELETE");
      }
      setLists(prev => prev.filter(list => !selectedLists.includes(list.id)));
      setSelectedLists([]);
      setSelectMode(false);
    } catch (error) {
      console.error("Failed to delete lists:", error);
    }
  };

  const calculateTotalCost = (items: GroceryItem[]) => {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price || '0');
      return total + price;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderListItem = ({ item }: { item: GroceryList }) => {
    const isExpanded = expandedLists.has(item.id);
    const isSelected = selectedLists.includes(item.id);
    
    // Calculate total cost
    const totalCost = calculateTotalCost(item.items);
    
    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={styles.listHeader}
          onPress={() => {
            if (selectMode) {
              setSelectedLists(prev => {
                const isSelected = prev.includes(item.id);
                const newSelected = isSelected
                  ? prev.filter(id => id !== item.id)
                  : [...prev, item.id];
                // If all items are unselected, exit select mode
                if (newSelected.length === 0) setSelectMode(false);
                return newSelected;
              });
            } else {
              toggleListExpansion(item.id);
            }
          }}
          onLongPress={() => {
            if (!selectMode) {
              setSelectMode(true);
              setSelectedLists([item.id]);
            }
          }}
          activeOpacity={0.7}
        >
          {selectMode && (
            <View style={[
              styles.selectionIndicator,
              isSelected && styles.selectedIndicator
            ]}>
              {isSelected && <Ionicons name="checkmark" size={20} color="#fff" />}
            </View>
          )}
          <View style={styles.listInfo}>
            <View style={styles.listNameRow}>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.totalCost}>${totalCost.toFixed(2)}</Text>
            </View>
            <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
          </View>
          {!selectMode && (
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#6c47ff" 
            />
          )}
        </TouchableOpacity>
        
        {isExpanded && item.items && item.items.length > 0 && (
          <View style={styles.itemsContainer}>
            {item.items.map((groceryItem, index) => (
              <View key={index} style={styles.groceryItem}>
                <View style={styles.itemImageContainer}>
                  {groceryItem.img_url ? (
                    <Image 
                      source={{ uri: groceryItem.img_url }} 
                      style={styles.itemImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="image-outline" size={24} color="#ccc" />
                    </View>
                  )}
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemMainInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{groceryItem.name}</Text>
                      <Text style={styles.itemPrice}>${groceryItem.price}</Text>
                    </View>
                    {groceryItem.brand && (
                      <Text style={styles.itemBrand}>{groceryItem.brand}</Text>
                    )}
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemUnit}>{groceryItem.unit}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.listDetails}>
          <Text style={styles.listDate}>
            Created: {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (lists.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No grocery lists yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Create lists from your pantry items to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectMode && selectedLists.length > 0 && (
        <View style={styles.actionBar}>
          <Button 
            title={`Delete (${selectedLists.length})`} 
            onPress={handleDeleteSelected}
            color="#ff4444"
          />
          <Button 
            title="Unselect All" 
            onPress={() => setSelectedLists([])} 
          />
        </View>
      )}

      <FlatList
        data={lists}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderListItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f0fa",
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
  listContainer: {
    padding: 16,
  },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIndicator: {
    backgroundColor: "#6c47ff",
    borderColor: "#6c47ff",
  },
  listInfo: {
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: "#6c47ff",
    fontWeight: "600",
    marginTop: 4,
  },
  totalCost: {
    fontSize: 16,
    color: "#28a745",
    fontWeight: "700",
  },
  itemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  groceryItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemMainInfo: {
    marginBottom: 4,
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  itemBrand: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemUnit: {
    fontSize: 12,
    color: "#888",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6c47ff",
  },
  listDetails: {
    marginTop: 8,
  },
  listDate: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Lists; 