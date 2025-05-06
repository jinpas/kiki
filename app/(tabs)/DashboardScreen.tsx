import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { supabase } from "../../supabase"; 

export default function DashboardScreen() {
  const [notificationCount, setNotificationCount] = useState(0); // State for notification count
  const [pins, setPins] = useState<any[]>([]); // State for storing pins data
  const [posts, setPosts] = useState<any[]>([]); // State for storing posts data

  // Fetch data when component is mounted
  useEffect(() => {
    fetchDashboardData(); // Call the data-fetching function
  }, []); // Empty dependency array ensures this runs once after mount

  // Function to fetch data from Supabase
  const fetchDashboardData = async () => {
    // Fetch notification count
    const { count: notifCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true });

    // Fetch pins data
    const { data: pinData } = await supabase
      .from("pins")
      .select("*")
      .order("timestamp", { ascending: false });

    // Fetch camera posts data
    const { data: postData } = await supabase
      .from("camera_posts")
      .select("*")
      .order("created_at", { ascending: false });

    // Update state with the fetched data
    setNotificationCount(notifCount || 0);
    setPins(pinData || []);
    setPosts(postData || []);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Notifications Section */}
      <View style={styles.card}>
        <Text style={styles.label}>Notifications Sent</Text>
        <Text style={styles.value}>{notificationCount}</Text>
      </View>

      {/* Pins Section */}
      <View style={styles.card}>
        <Text style={styles.label}>Pins Dropped</Text>
        {pins.map((pin, index) => (
          <Text key={index} style={styles.pinItem}>
            {pin.type} · {pin.latitude.toFixed(2)}, {pin.longitude.toFixed(2)}
          </Text>
        ))}
      </View>

      {/* Camera Posts Section */}
      <View style={styles.card}>
        <Text style={styles.label}>Camera Posts</Text>
        {posts.map((post, index) => (
          <View key={index} style={styles.postContainer}>
            <Image source={{ uri: post.image_url }} style={styles.postImage} />
            <Text style={styles.caption}>{post.caption}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 60,
    backgroundColor: "#000", 
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  value: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
  },
  pinItem: {
    color: "#ddd",
    fontSize: 14,
    paddingVertical: 2,
  },
  postContainer: {
    marginBottom: 16,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  caption: {
    color: "#ccc",
    fontSize: 14,
    fontStyle: "italic",
  },
});
