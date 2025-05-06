import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import Constants from "expo-constants";
import { supabase } from "../../supabase"; 

const { OPENAI_API_KEY } = Constants.expoConfig?.extra || {};

export default function CameraScreen() {
  // Refs for camera and state management
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions(); // Permission for camera
  const [imageUri, setImageUri] = useState<string | null>(null); // Store captured image URI
  const [caption, setCaption] = useState(""); // Store AI-generated caption
  const [loading, setLoading] = useState(false); // Manage loading state

  // Compress image using ImageManipulator to reduce size before uploading
  async function compressImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 640 } }], // Resize image to width 640px
      {
        compress: 0.2, // Compress image to 20% of original quality
        format: ImageManipulator.SaveFormat.JPEG, // Save in JPEG format
      }
    );
    return result.uri; // Return the new compressed URI
  }

  // Capture photo, compress it, and send to OpenAI for captioning
  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setLoading(true); // Start loading

    try {
      // Take a picture
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const compressedUri = await compressImage(photo.uri); // Compress the image
      setImageUri(compressedUri); // Update the state with the compressed image URI

      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(compressedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const base64Image = `data:image/jpeg;base64,${base64}`; // Base64 image format

      // Send the image to OpenAI for captioning
      const aiRes = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "write a short caption for this image:" },
                { type: "image_url", image_url: { url: base64Image } },
              ],
            },
          ],
          max_tokens: 100, // Limit the number of tokens for the caption
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`, // Set Authorization header with OpenAI API key
            "Content-Type": "application/json",
          },
          timeout: 15000, // Timeout after 15 seconds if no response
        }
      );

      // Retrieve caption from the response
      const result = aiRes.data.choices?.[0]?.message?.content || "No caption returned.";
      setCaption(result); // Set the caption state

      // Insert image and caption into Supabase
      const { error } = await supabase.from("camera_posts").insert([
        {
          image_url: base64Image, // Store base64 image
          caption: result, // Store caption
        },
      ]);

      // Handle errors during the insert to Supabase
      if (error) {
        console.error("supabase insert error:", error.message);
        Alert.alert("Upload failed", "Could not save to backend.");
      }
    } catch (err: any) {
      console.error("error:", err.response?.data || err.message);
      Alert.alert("error", "something went wrong while generating caption");
    } finally {
      setLoading(false); // Stop loading after processing is done
    }
  };

  // Reset the state to allow another capture
  const handleReset = () => {
    setImageUri(null);
    setCaption("");
  };

  // Permission handling
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera access is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.captureButton}>
          <Text style={styles.buttonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* If no image has been captured, show the camera interface */}
      {!imageUri ? (
        <>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          <View style={styles.overlay}>
            <Text style={styles.instruction}>Take a photo to generate a caption</Text>
            <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
              <Text style={styles.buttonText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // If an image is captured, show the image and caption
        <ScrollView contentContainerStyle={styles.previewContainer}>
          <View style={styles.postCard}>
            <Image source={{ uri: imageUri }} style={styles.postImage} />
            {loading ? (
              // Show loading indicator while caption is being generated
              <ActivityIndicator size="large" style={{ marginVertical: 20 }} color="#aaa" />
            ) : (
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{caption}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.retakeButton}>
            <Text style={styles.retakeText}>Take Another</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  instruction: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  captureButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 50,
  },
  buttonText: { color: "#000", fontWeight: "600", fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionText: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 10,
  },
  previewContainer: {
    alignItems: "center",
    padding: 16,
  },
  postCard: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  captionContainer: {
    padding: 12,
  },
  captionText: {
    fontSize: 15,
    color: "#f2f2f2",
    lineHeight: 20,
  },
  retakeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: 30,
  },
  retakeText: {
    color: "#ccc",
    fontSize: 14,
  },
});
