import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, TextInput, Alert, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';

type RouteParams = {
  AdminEditUserScreen: {
    userId: string;
  };
};

const AdminEditUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'AdminEditUserScreen'>>();

  const { userId } = route.params;

  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    role: '1',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      const loggedInUserId = session.user.id;
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', loggedInUserId)
        .single();

      if (error) {
        throw new Error('Unable to fetch current user role.');
      }

      setCurrentUserRole(data.role);
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    }
  };

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, email, role, profile_picture')
        .eq('id', userId)
        .single();

      if (error) {
        Alert.alert('Error', 'Unable to fetch user data.');
      } else {
        setUserInfo({
          username: data.username || '',
          email: data.email || '',
          role: String(data.role) || '1',
          profilePicture: data.profile_picture || ''
        });
      }
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error) ? error.message : 'Unexpected error occurred while fetching user data.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Denied", "Permission to access the media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = result.assets[0].base64;
      setUserInfo({ ...userInfo, profilePicture: `data:image/jpeg;base64,${base64Image}` });
    }
  };

  useEffect(() => {
    fetchCurrentUserRole();
    fetchUserData();
  }, []);

  const onSave = async () => {
    setLoading(true);
    try {
      const updates = {
        username: userInfo.username,
        profile_picture: userInfo.profilePicture || null,
        role: currentUserRole === 3 ? userInfo.role : undefined 
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        throw new Error('Failed to save changes');
      }

      Alert.alert('Success', 'User data updated successfully.');
      navigation.goBack();
    } catch (error: unknown) {
      const errorMessage = (error instanceof Error) ? error.message : 'Failed to save changes. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getReadableRole = (role: string) => {
    switch (role) {
      case '1':
        return 'Normal User';
      case '2':
        return 'Admin';
      case '3':
        return 'Super Admin';
      default:
        return 'Unknown Role';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
        <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Icon name="arrow-left" size={28} color="#fff" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <Image 
            source={userInfo.profilePicture ? { uri: userInfo.profilePicture } : require('../assets/default-profile.png')} 
            style={styles.profilePicture} 
          />
          <TouchableOpacity style={styles.editPictureButton} onPress={handleProfilePictureChange}>
            <Text style={styles.editPictureText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="JohnDoe123"
            placeholderTextColor="#999"
            value={userInfo.username}
            onChangeText={(text) => setUserInfo({ ...userInfo, username: text })}
          />

          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="john@example.com"
            placeholderTextColor="#999"
            value={userInfo.email}
            editable={false}
          />
          <Text style={styles.infoText}>Email cannot be changed</Text>

          <Text style={styles.inputLabel}>Role</Text>
          {currentUserRole === 3 ? (
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={userInfo.role}
                onValueChange={(itemValue) => setUserInfo({ ...userInfo, role: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="Normal User" value="1" />
                <Picker.Item label="Admin" value="2" />
                <Picker.Item label="Super Admin" value="3" />
              </Picker>
            </View>
          ) : (
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={getReadableRole(userInfo.role)}
              editable={false}
            />
          )}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

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
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingImage: {
    width: wp('20%'),
    height: wp('20%'),
    marginBottom: hp('3%'),
  },
  loadingText: {
    fontSize: wp('3%'), 
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    backgroundColor: '#6200EE',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: wp('4%'),
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: hp('5%'),
  },
  profilePicture: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    marginBottom: hp('2%'),
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  editPictureButton: {
    backgroundColor: '#6200EE',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 5,
  },
  editPictureText: {
    color: '#fff',
    fontSize: wp('4%'),
  },
  formSection: {
    marginBottom: hp('5%'),
  },
  inputLabel: {
    fontSize: wp('4%'),
    color: '#333',
    marginBottom: hp('1%'),
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    fontSize: wp('4.5%'),
    color: '#333',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
    color: '#666',
  },
  infoText: {
    fontSize: wp('3.5%'),
    color: '#999',
    marginBottom: hp('2%'),
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: hp('2%'),
  },
  picker: {
    height: hp('6%'),
    width: '100%',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: hp('2%'),
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
});

export default AdminEditUserScreen;
