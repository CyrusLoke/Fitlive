import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabaseClient';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditProfileScreen'>;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const [username, setUsername] = useState<string>('Guest');
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [country, setCountry] = useState<string>(''); // Added country field
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // To store base64 data

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('username, age, height, weight, gender, country, profile_picture') // Fetch country and profile_picture
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUsername(data.username || 'Guest');
          setAge(data.age ? data.age.toString() : '');
          setHeight(data.height ? data.height.toString() : '');
          setWeight(data.weight ? data.weight.toString() : '');
          setGender(data.gender || 'male');
          setCountry(data.country || ''); // Set country
          setProfilePicture(data.profile_picture || null); // Set base64 profile picture if available
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const updates = {
        username,
        age: parseInt(age),
        height: parseInt(height),
        weight: parseInt(weight),
        gender,
        country, 
        profile_picture: profilePicture, 
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Could not save profile changes');
      } else {
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (result.granted === false) {
      Alert.alert('Permission to access gallery is required!');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true, 
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const selectedAsset = pickerResult.assets[0]; 
      setProfilePicture(`data:image/jpeg;base64,${selectedAsset.base64}`); 
    }
  };

  return (
    <ImageBackground source={require('../assets/editprofile.png')} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Edit Profile</Text>
        </View>

        <View style={styles.profileImageWrapperContainer}>
          <View style={styles.profileImageWrapper}>
            <Image
              source={profilePicture ? { uri: profilePicture } : require('../assets/default-profile.png')}
              style={styles.profileImage}
            />
          </View>
          <TouchableOpacity style={styles.cameraIconWrapper} onPress={pickImage}>
            <Ionicons name="camera-outline" size={wp('6%')} color="#fff" style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              placeholder="Enter your username"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              value={age}
              onChangeText={setAge}
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter age"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputContainerSmall}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                value={height}
                onChangeText={setHeight}
                style={styles.inputSmall}
                keyboardType="numeric"
                placeholder="Height"
              />
            </View>

            <View style={styles.inputContainerSmall}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                style={styles.inputSmall}
                keyboardType="numeric"
                placeholder="Weight"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              style={styles.input}
              placeholder="Enter your country"
            />
          </View>

          <Text style={styles.genderLabel}>Select your gender</Text>
          <View style={styles.genderSelection}>
            <TouchableOpacity
              style={[styles.genderButton, gender === 'male' && styles.selectedGenderButton]}
              onPress={() => setGender('male')}
            >
              <Ionicons name="male-outline" size={wp('5%')} color={gender === 'male' ? '#fff' : '#007BFF'} />
              <Text style={[styles.genderText, gender === 'male' && styles.selectedGenderText]}>Male</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderButton, gender === 'female' && styles.selectedGenderButton]}
              onPress={() => setGender('female')}
            >
              <Ionicons name="female-outline" size={wp('5%')} color={gender === 'female' ? '#fff' : '#007BFF'} />
              <Text style={[styles.genderText, gender === 'female' && styles.selectedGenderText]}>Female</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save-outline" size={wp('6%')} color="#fff" style={styles.icon} />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close-circle-outline" size={wp('6%')} color="#fff" style={styles.icon} />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
  },
  headerContainer: {
    marginBottom: hp('2%'),
    marginTop: hp('3%'),
    alignItems: 'center',
  },
  headerText: {
    fontSize: wp('8%'),
    fontWeight: 'bold',
    color: '#007BFF',
  },
  profileImageWrapperContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  profileImageWrapper: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraIconWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007BFF',
    borderRadius: wp('5%'),
    padding: wp('2%'),
    elevation: 5,
  },
  cameraIcon: {
    alignSelf: 'center',
  },
  inputSection: {
    width: '100%',
    paddingVertical: hp('2%'),
  },
  inputContainer: {
    width: '100%',
    marginBottom: hp('2%'),
  },
  inputContainerSmall: {
    width: wp('45%'),
    marginBottom: hp('2%'),
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  input: {
    width: '100%',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('3%'),
    backgroundColor: '#f4f4f4',
    fontSize: wp('4%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputSmall: {
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('3%'),
    backgroundColor: '#f4f4f4',
    fontSize: wp('4%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genderLabel: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
    color: '#333',
    alignSelf: 'flex-start',
  },
  genderSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: hp('2%'),
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('4%'),
    borderRadius: wp('5%'),
    borderWidth: 1,
    borderColor: '#007BFF',
    backgroundColor: '#fff',
    width: wp('40%'),
  },
  selectedGenderButton: {
    backgroundColor: '#007BFF',
  },
  genderText: {
    fontSize: wp('4.5%'),
    color: '#007BFF',
    marginLeft: wp('2%'),
  },
  selectedGenderText: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('5%'),
    width: '80%',
    alignSelf: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B4B',
    paddingVertical: hp('1.8%'),
    borderRadius: wp('5%'),
    width: '80%',
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
  icon: {
    marginRight: wp('2%'),
  },
});

export default EditProfileScreen;
