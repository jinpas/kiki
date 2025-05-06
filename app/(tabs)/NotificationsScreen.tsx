import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "../../supabase";

// Setting up notification handler to manage the display of notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationsScreen() {
  // State hooks to handle message input, logs from Supabase, and push token
  const [message, setMessage] = useState("");
  const [log, setLog] = useState<any[]>([]);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // References for notification listeners
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Hook to manage setup when the component is mounted
  useEffect(() => {
    // Register for push notifications and fetch previous logs from Supabase
    registerForPushNotificationsAsync(setExpoPushToken);
    fetchLog();

    // Add listeners for incoming notifications and responses
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      // console.log("Notification received:", n); // Debugging
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((r) => {
      // console.log("Notification response:", r); // Debugging
    });

    // Cleanup listeners on component unmount
    return () => {
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Fetch notification logs from Supabase
  const fetchLog = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("sent_at", { ascending: false });

    if (!error) setLog(data || []);
  };

  // Send local notification and log it into Supabase
  const sendLocalNotification = async () => {
    if (!message.trim()) {
      alert("please enter a message.");
      return;
    }

    const title = "custom notification";

    await Notifications.scheduleNotificationAsync({
      content: { title, body: message, sound: "default" },
      trigger: null,
    });

    // Insert the message and push token into Supabase table
    const { error } = await supabase.from("notifications").insert([
      {
        message: message.trim(),
        sent_at: new Date().toISOString(),
        push_token: expoPushToken ?? null, // Store the push token in the database
      },
    ]);

    if (!error) {
      setMessage(""); // Clear input field
      fetchLog(); // Refresh the notification log
    } else {
      console.error("supabase insert error:", error); // Log error if insert fails
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.heading}>notifications center</Text>

      <TextInput
        style={styles.input}
        placeholder="type your message"
        placeholderTextColor="#aaa"
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity style={styles.button} onPress={sendLocalNotification}>
        <Text style={styles.buttonText}>send</Text>
      </TouchableOpacity>

      <Text style={styles.logHeading}>previous notifications</Text>
      <FlatList
        data={log}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.logList}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <Text style={styles.logMessage}>{item.message}</Text>
            <Text style={styles.logTime}>
              {new Date(item.sent_at).toLocaleString()}
            </Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

// Function to register for push notifications
async function registerForPushNotificationsAsync(setToken: (token: string) => void) {
  // Get the current permission status for notifications
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("permission not granted");
    return;
  }

  const projectId = "70c21ef5-a312-4e6f-9c59-1521dae76a4b"; // Replace with your real project ID

  try {
    // Fetch the Expo push token
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    // console.log("expo push token:", token.data); // Debugging
    setToken(token.data); // Store the token for later use
  } catch (e) {
    console.error("push token error:", e); // Log any errors during token fetching
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
    textTransform: "lowercase",
    textAlign: "center",
  },
  tokenText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textTransform: "lowercase",
  },
  logHeading: {
    fontSize: 16,
    fontWeight: "500",
    color: "#aaa",
    marginBottom: 10,
    textAlign: "center",
    textTransform: "lowercase",
  },
  logList: {
    paddingBottom: 80,
  },
  logItem: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  logMessage: {
    fontSize: 15,
    color: "#eaeaea",
    marginBottom: 6,
  },
  logTime: {
    fontSize: 12,
    color: "#888",
  },
});
