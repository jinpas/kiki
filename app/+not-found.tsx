import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";

export default function WelcomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "welcome" }} />
      <View style={styles.container}>
        <Text style={styles.title}>explore your world with intention.</Text>

        <View style={styles.lineBlock}>
          <Text style={styles.lineText}>send custom alerts</Text>
        </View>

        <View style={styles.lineBlock}>
          <Text style={styles.lineText}>drop pins on the go — restaurants, parks, homes</Text>
        </View>

        <View style={styles.lineBlock}>
          <Text style={styles.lineText}>snap a photo and get a smart, auto-generated caption</Text>
        </View>

        <View style={styles.lineBlock}>
          <Text style={styles.lineText}>view all activity in a sleek dashboard</Text>
        </View>

        <Text style={styles.note}>tap the back arrow above to begin</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 34,
    textTransform: "lowercase",
    letterSpacing: 0.3,
  },
  lineBlock: {
    marginBottom: 16,
    width: "100%",
    paddingHorizontal: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#222",
  },
  lineText: {
    fontSize: 15,
    color: "#eaeaea",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  note: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
});
