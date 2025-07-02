import { getDistance } from "geolib";
import { Image, StyleSheet, Text, View } from "react-native";
import ralphsLogo from '../assets/images/Ralphs.png';



export type LocationType = {
  locationId: string | number;
  name: string;
  chain: string;
  address: {
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  };
  geolocation: {
    latitude: number;
    longitude: number;
  };
};

export type UserLocationType = {
  lat: number;
  lng: number;
};

const LocationCard = ({ location, userLocation, selected = false, pressed = false }: { location: LocationType; userLocation: UserLocationType; selected?: boolean; pressed?: boolean }) => {
  const distance = getDistance(
    { latitude: userLocation.lat, longitude: userLocation.lng },
    { latitude: location.geolocation.latitude, longitude: location.geolocation.longitude }
  );
  const distanceMiles = (distance / 1609.34).toFixed(2);

  const imageSource =
    location.chain.toLowerCase() === "ralphs"
      ? ralphsLogo
      : { uri: "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg" };

  return (
    <View
      style={[
        styles.card,
        pressed && styles.pressedCard,
        selected && styles.selectedCard,
      ]}
    >
      <Image source={imageSource} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.chain}>{location.chain}</Text>
        <Text style={styles.name}>{location.name}</Text>
        <Text style={styles.address}>
          {location.address.addressLine1}, {location.address.city}, {location.address.state} {location.address.zipCode}
        </Text>
        <Text style={styles.distance}>{distanceMiles} mi away</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    padding: 12,
    alignItems: "center",
  },
  pressedCard: {
    backgroundColor: "#ececec",
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#6c47ff",
    backgroundColor: "#f6f2ff",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  chain: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#6c47ff",
    marginBottom: 2,
  },
  name: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  address: {
    color: "#666",
    marginBottom: 4,
    fontSize: 13,
  },
  distance: {
    color: "#6c47ff",
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default LocationCard; 