import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, ImageBackground, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const AddArticleScreen: React.FC = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleHeight, setTitleHeight] = useState(40); // Initial height for title
  const [contentHeight, setContentHeight] = useState(100); // Initial height for content
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Retrieve user_id from the session
  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        Alert.alert("Error", "Unable to retrieve user session.");
        return;
      }
      setUserId(data.session.user.id);
    };
    fetchUserId();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: false,
    });

    if (!result.canceled) {
      const base64Image = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setImageBase64(`data:image/jpeg;base64,${base64Image}`);
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Alert.alert('Please fill in all required fields.');
      return;
    }

    if (!imageBase64) {
      Alert.alert('Please upload a cover image.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID is missing. Please try again.');
      return;
    }

    const { error } = await supabase.from('articles').insert([
      {
        title,
        content,
        image_base64: imageBase64,
        approval_status: 'pending',
        user_id: userId,
      },
    ]);

    if (error) {
      console.log(error);
      Alert.alert('Error uploading article');
    } else {
      Alert.alert('Article submitted for review.');
      navigation.goBack();
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={hp('3%')} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Create New Article</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.label}>Article Title</Text>
        <TextInput
          style={[styles.input, { height: Math.max(40, titleHeight) }]} // Default height of 40, expands with content
          placeholder="Enter the title"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          multiline
          onContentSizeChange={(e) => setTitleHeight(e.nativeEvent.contentSize.height)} // Update height dynamically
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.contentInput, { height: contentHeight }]}
          placeholder="Write your content here..."
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
        />

        <View style={styles.imageUploadContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <>
              <Ionicons name="image-outline" size={hp('5%')} color="#888" />
              <Text style={styles.imageUploadText}>Upload Cover Image</Text>
            </>
          )}
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>Choose Image</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit for Review</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    paddingHorizontal: wp('5%'),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  backButton: {
    marginRight: wp('3%'),
  },
  title: {
    fontSize: hp('2.5%'),
    fontWeight: '600',
    color: '#000',
  },
  formContainer: {
    paddingVertical: hp('2%'),
  },
  label: {
    fontSize: hp('2%'),
    fontWeight: '500',
    color: '#000',
    marginBottom: hp('1%'),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('2%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    fontSize: hp('2%'),
    color: '#333',
    marginBottom: hp('2%'),
  },
  contentInput: {
    textAlignVertical: 'top',
  },
  imageUploadContainer: {
    alignItems: 'center',
    paddingVertical: hp('3%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: hp('2%'),
  },
  imageUploadText: {
    fontSize: hp('1.8%'),
    color: '#888',
    marginVertical: hp('1%'),
    textAlign: 'center',
  },
  imagePreview: {
    width: wp('50%'),
    height: hp('25%'),
    marginBottom: hp('2%'),
    borderRadius: wp('2%'),
  },
  uploadButton: {
    marginTop: hp('1%'),
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('8%'),
    borderRadius: wp('2%'),
    backgroundColor: '#007bff',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: hp('2%'),
    borderRadius: wp('2%'),
    backgroundColor: '#007bff',
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: hp('2.2%'),
    fontWeight: '600',
  },
});

export default AddArticleScreen;
