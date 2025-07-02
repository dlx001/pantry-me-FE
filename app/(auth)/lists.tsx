import { List } from "@/shared/types";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApiClient } from "../../utils/apiClient";

const Lists = () => {
  const { user } = useUser();
  const { request } = useApiClient();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLists, setExpandedLists] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadLists = async () => {
      try {
        setLoading(true);
        const data = await request("/lists");
        console.log('Lists data:', data.data);
        setLists(data.data);
      } catch (err) {
        console.error("API error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, []);

  const toggleListExpansion = (listId: number) => {
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

  const renderListItem = ({ item }: { item: List }) => {
    const isExpanded = expandedLists.has(item.id);
    
    // Calculate total cost
    const totalCost = item.items?.reduce((sum, groceryItem) => {
      const price = parseFloat(groceryItem.price) || 0;
      return sum + price;
    }, 0) || 0;
    
    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={styles.listHeader}
          onPress={() => toggleListExpansion(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.listInfo}>
            <View style={styles.listNameRow}>
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.totalCost}>${totalCost.toFixed(2)}</Text>
            </View>
            <Text style={styles.itemCount}>{item.items?.length || 0} items</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#6c47ff" 
          />
        </TouchableOpacity>
        
        {isExpanded && item.items && item.items.length > 0 && (
          <View style={styles.itemsContainer}>
            {item.items.map((groceryItem, index) => (
                             <View key={index} style={styles.groceryItem}>
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
            ))}
          </View>
        )}
        
        <View style={styles.listDetails}>
          <Text style={styles.listDate}>
            Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown date'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading lists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No lists found</Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first list by converting items from your pantry
          </Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f0fa",
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  listNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
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
  itemStore: {
    fontSize: 12,
    color: "#666",
  },
  listDetails: {
    marginTop: 8,
  },
  listDate: {
    fontSize: 12,
    color: "#666",
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
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
    color: "#666",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Lists; 