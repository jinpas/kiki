import { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { supabase } from "../../supabase"; // import Supabase client for data fetching

const { width } = Dimensions.get("window");

// Category options for pinning locations
const categories = [
  { label: "Restaurant 🍽️", emoji: "🍽️", color: "red", type: "restaurant" },
  { label: "Store 🛍️", emoji: "🛍️", color: "orange", type: "store" },
  { label: "Park 🌳", emoji: "🌳", color: "green", type: "park" },
  { label: "Home 🏡", emoji: "🏡", color: "blue", type: "home" },
  { label: "Other 📍", emoji: "📍", color: "purple", type: "other" },
];

export default function MapScreen() {
  const [location, setLocation] = useState(null); // Store user's location
  const [region, setRegion] = useState(null); // Store map region
  const [pins, setPins] = useState([]); // Store pins on the map
  const [selectedCategory, setSelectedCategory] = useState(categories[0]); // Store selected category for pin
  const [justTappedMarker, setJustTappedMarker] = useState(false); // Prevent accidental pin drop on marker tap

  // Effect hook to fetch user location and pins from Supabase
  useEffect(() => {
    (async () => {
      // Request permission for location access
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      // Get user's current location
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords); // Store location coordinates
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04, // Latitude delta for zoom
        longitudeDelta: 0.04, // Longitude delta for zoom
      });

      // Fetch pins from Supabase
      fetchPins();
    })();
  }, []);

  // Function to fetch pins from Supabase and update state
  const fetchPins = async () => {
    const { data: existingPins, error } = await supabase.from("pins").select("*");
    if (!error && existingPins) {
      // Enrich fetched pins with category data (emoji, color)
      const enrichedPins = existingPins.map((p, index) => {
        const matched = categories.find((c) => c.type === p.type) || categories[categories.length - 1];
        return {
          id: index,
          latitude: p.latitude,
          longitude: p.longitude,
          emoji: matched.emoji,
          type: p.type,
          color: matched.color,
        };
      });
      setPins(enrichedPins); // Set enriched pins in state
    }
  };

  // Handle map press event to add a new pin
  const handleMapPress = async (e) => {
    if (justTappedMarker) {
      setJustTappedMarker(false);
      return; // Ignore map press triggered by marker tap
    }

    // Extract coordinates from the event
    const { latitude, longitude } = e.nativeEvent.coordinate;

    const newPin = {
      latitude,
      longitude,
      emoji: selectedCategory.emoji,
      type: selectedCategory.type,
      color: selectedCategory.color,
    };

    // Update the state with the new pin
    setPins((prev) => [...prev, { id: Date.now(), ...newPin }]);

    // Insert the new pin into Supabase
    const { error } = await supabase.from("pins").insert([
      {
        latitude,
        longitude,
        type: selectedCategory.type,
      },
    ]);

    if (error) {
      console.error("Failed to insert pin:", error.message); // Log error if insertion fails
    }
  };

  // Calculate the distance between two coordinates in kilometers
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180; // Convert degree to radian
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(lat2 - lat1); // Difference in latitudes
    const dLon = toRad(lon2 - lon1); // Difference in longitudes
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Return distance in kilometers, rounded to 2 decimal places
  };

  // If region is not set, show a loading view
  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>getting location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <MapView style={styles.map} region={region} onPress={handleMapPress} showsUserLocation>
        {/* Render each pin on the map */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => setJustTappedMarker(true)} // Prevent accidental pin drop
            description={
              location
                ? `~${calculateDistance(
                    location.latitude,
                    location.longitude,
                    pin.latitude,
                    pin.longitude
                  )} km away` // Calculate and show distance from the user
                : undefined
            }
          >
            {/* Custom marker view with emoji */}
            <View style={[styles.emojiPin, { backgroundColor: pin.color }]}>
              <Text style={styles.emojiText}>{pin.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Category selection footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>choose a category:</Text>
        <View style={styles.categoryRow}>
          {/* Render category buttons */}
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.type}
              style={[
                styles.categoryButton,
                { backgroundColor: cat.color },
                selectedCategory.type === cat.type && styles.selectedCategoryBorder, // Highlight selected category
              ]}
              onPress={() => setSelectedCategory(cat)} // Set the selected category
            >
              <Text style={styles.categoryText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.footerText}>then tap anywhere to drop a {selectedCategory.label}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: { color: "white", fontSize: 18 },
  footer: {
    position: "absolute",
    bottom: 0,
    width,
    backgroundColor: "#111",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  footerTitle: { color: "#fff", fontSize: 16, marginBottom: 5 },
  footerText: { color: "#ccc", fontSize: 12, marginTop: 5 },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  categoryButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  selectedCategoryBorder: { borderWidth: 2, borderColor: "#fff" },
  categoryText: { color: "white", fontSize: 14 },
  emojiPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#fff",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  emojiText: { fontSize: 20 },
});
