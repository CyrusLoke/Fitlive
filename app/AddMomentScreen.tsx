import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, Image, Alert, Linking, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const AddMomentScreen: React.FC = () => {
  const navigation = useNavigation();
  const [caption, setCaption] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const maxCaptionLength = 250; // Increased limit to 250

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageBase64(result.assets[0].base64 || null);
      }
    } else if (status === 'denied') {
      Alert.alert(
        "Permission Denied",
        "You need to allow access to your media library in your device settings to select an image.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const handlePostMoment = async () => {
    if (!caption.trim()) {
      Alert.alert("Caption Required", "Please add a caption for your moment.");
      return;
    }

    if (!imageBase64) {
      Alert.alert("Image Required", "Please select an image to post your moment.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("User Not Logged In", "You must be logged in to post a moment.");
        return;
      }

      const { error } = await supabase.from('moments').insert([
        {
          user_id: user.id,
          caption,
          image_base64: imageBase64,
          is_private: isPrivate,
        },
      ]);

      if (error) {
        Alert.alert("Error", "Unable to post your moment.");
        return;
      }

      Alert.alert("Success", "Your moment has been posted successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "There was an error posting your moment.");
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Moment</Text>
          <TouchableOpacity style={styles.postButton} onPress={handlePostMoment}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageBase64 ? (
            <Image source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="camera" size={wp('12%')} color="#888" />
              <Text style={styles.imagePickerText}>Add a Photo</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#888"
            multiline={true}
            value={caption}
            onChangeText={(text) => setCaption(text)}
            maxLength={maxCaptionLength} // Updated to 250
          />
          <Text style={styles.captionCounter}>{caption.length}/{maxCaptionLength}</Text>
        </View>

        <View style={styles.privacyContainer}>
          <Text style={styles.privacyLabel}>Private Moment</Text>
          <Switch
            value={isPrivate}
            onValueChange={() => setIsPrivate((previousState) => !previousState)}
          />
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipText}>💡 Tip: Capture moments that inspire or motivate you! Add a brief description to give it a personal touch.</Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flexGrow: 1,
    padding: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('3%'),
    marginTop: hp('2%'),
  },
  backButton: {
    padding: wp('2.5%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#007bff',
    borderRadius: wp('2%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp('4%'),
  },
  imagePicker: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: wp('3%'),
    height: hp('25%'),
    marginBottom: hp('3%'),
  },
  imagePickerText: {
    fontSize: wp('4%'),
    color: '#888',
    marginTop: hp('1%'),
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: wp('3%'),
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('3%'),
  },
  captionInput: {
    fontSize: wp('4%'),
    color: '#333',
  },
  captionCounter: {
    textAlign: 'right',
    fontSize: wp('3%'),
    color: '#888',
    marginTop: hp('0.5%'),
  },
  privacyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  privacyLabel: {
    fontSize: wp('4%'),
    color: '#333',
  },
  tipsContainer: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    backgroundColor: '#f0f8ff',
    borderRadius: wp('3%'),
  },
  tipText: {
    fontSize: wp('3.5%'),
    color: '#007bff',
    textAlign: 'center',
  },
});

export default AddMomentScreen;
