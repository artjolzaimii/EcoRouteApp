import { Colors, Shadow } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateForumScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { prefillTitle, sourcePinId } = useLocalSearchParams<{ prefillTitle?: string; sourcePinId?: string }>();

  const [title, setTitle] = useState(prefillTitle ?? '');
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('Permission required', fromCamera ? 'Camera access is needed.' : 'Photo library access is needed.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageMime(result.assets[0].mimeType ?? 'image/jpeg');
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pickImage(true); else if (idx === 2) pickImage(false); }
      );
    } else {
      Alert.alert('Add Photo', '', [
        { text: 'Camera', onPress: () => pickImage(true) },
        { text: 'Photo Library', onPress: () => pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for your post.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      if (body.trim()) form.append('body', body.trim());
      if (sourcePinId) form.append('sourcePinId', sourcePinId);
      if (imageUri) {
        const filename = imageUri.split('/').pop() ?? 'photo.jpg';
        form.append('image', { uri: imageUri, name: filename, type: imageMime } as any);
      }

      const token = session?.access_token;
      const res = await fetch(`${API_BASE_URL}/api/forums`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Failed to create post');

      router.replace(`/forum-post?id=${json.data.id}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not create post. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, (!title.trim() || submitting) && styles.postBtnDisabled]}
          onPress={submit}
          disabled={!title.trim() || submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="What's your post about?"
            placeholderTextColor={Colors.gray400}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            multiline
            returnKeyType="next"
          />

          {/* Body */}
          <TextInput
            style={styles.bodyInput}
            placeholder="Share your story, tip or idea… (optional)"
            placeholderTextColor={Colors.gray400}
            value={body}
            onChangeText={setBody}
            maxLength={2000}
            multiline
            textAlignVertical="top"
          />

          {/* Image area */}
          {imageUri ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)} activeOpacity={0.8}>
                <Ionicons name="close-circle" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={28} color={Colors.emerald600} />
              <Text style={styles.imagePickerTitle}>Add a Photo</Text>
              <Text style={styles.imagePickerSub}>Optional — camera or library</Text>
            </TouchableOpacity>
          )}

          {sourcePinId && (
            <View style={styles.pinBadge}>
              <Ionicons name="location-outline" size={14} color={Colors.emerald600} />
              <Text style={styles.pinBadgeText}>Created from a community pin</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  postBtn: {
    backgroundColor: Colors.emerald600,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 64,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 26,
    minHeight: 56,
    padding: 0,
  },
  bodyInput: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    minHeight: 100,
    padding: 0,
  },

  imagePicker: {
    borderWidth: 2,
    borderColor: Colors.emerald100,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.emerald50,
  },
  imagePickerTitle: { fontSize: 15, fontWeight: '600', color: Colors.emerald700 },
  imagePickerSub: { fontSize: 12, color: Colors.emerald600 },

  imagePreviewWrap: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 220, borderRadius: 16, backgroundColor: Colors.gray100 },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },

  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.emerald50,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.emerald100,
  },
  pinBadgeText: { fontSize: 12, color: Colors.emerald700, fontWeight: '500' },
});
