import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ProductType = {
  id: string | number;
  name: string;
  imageUrl?: string;
  images?: string[];
  price?: number;
  description?: string;
  unit?: string;
};

type ProductCardProps = {
  product: ProductType;
  clickable?: boolean;
  onPress?: () => void;
  selected?: boolean;
};

const CARD_WIDTH = 180;
const CARD_HEIGHT = 260;
const IMAGE_HEIGHT = 110;

const ProductCard = ({ product, clickable = false, onPress, selected = false }: ProductCardProps) => {
  const image = product.images?.[0] || product.imageUrl;
  return (
    <TouchableOpacity
      style={[
        styles.card,
        clickable ? styles.clickable : null,
        selected ? styles.selected : null
      ]}
      onPress={clickable ? onPress : undefined}
      activeOpacity={clickable ? 0.7 : 1}
      disabled={!clickable}
    >
      <View style={styles.imageContainer}>
        {image && (
          <ExpoImage
            source={{ uri: image }}
            style={styles.image}
            contentFit="contain"
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {product.description && (
          <Text style={styles.brand}>{product.description}</Text>
        )}
        {product.unit && (
          <Text style={styles.unit}>{product.unit}</Text>
        )}
        {product.price !== undefined && (
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 14,
    margin: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ececec',
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    justifyContent: 'flex-start',
  },
  clickable: {
    shadowOpacity: 0.15,
  },
  selected: {
    borderColor: '#6c47ff',
    borderWidth: 3,
    backgroundColor: '#f3f0fa',
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  info: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 6,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
    color: '#222',
  },
  brand: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
    textAlign: 'center',
  },
  unit: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'center',
  },
  price: {
    color: '#6c47ff',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default ProductCard; 