import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert, StyleSheet, ScrollView, ImageBackground, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../supabaseClient'; // Ensure you have the supabase client setup
import { RootStackParamList } from './App';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SettingsScreen'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  // State for various toggles and dropdowns
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [language, setLanguage] = useState('en');
  const [units, setUnits] = useState('metric');
  const [locationAccessEnabled, setLocationAccessEnabled] = useState(false);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  const [accountPrivacyEnabled, setAccountPrivacyEnabled] = useState(false);

  // Modal and OTP-related states
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [newPasswordModalVisible, setNewPasswordModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [userEmail, setUserEmail] = useState(''); 
  const [otpError, setOtpError] = useState(''); // State for OTP error
  const [passwordError, setPasswordError] = useState(''); // State for password error

  // Fitness Preferences states
  const [goal, setGoal] = useState('general_fitness'); // Fitness goal
  const [workoutIntensity, setWorkoutIntensity] = useState('intermediate'); // Workout intensity
  const [activityLevel, setActivityLevel] = useState('sedentary');

  // Handle saving fitness preferences
  const handleSaveFitnessPreferences = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.id) {
      Alert.alert('Error', 'Unable to fetch user details.');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          goal,
          fitness_level: workoutIntensity,
          activity_level: activityLevel, // Save activity level
        });

      if (error) {
        console.error('Supabase error:', error);
        Alert.alert('Error', 'Failed to save fitness preferences.');
      } else {
        Alert.alert('Success', 'Fitness preferences saved successfully!');
      }
    } catch (e) {
      console.error('Unexpected error:', e);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // Handle sending OTP for password reset
  const handleChangePassword = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
  
    if (userError || !user || !user.email) {
      Alert.alert('Error', 'Unable to fetch user details or email is not available.');
      return;
    }
  
    setUserEmail(user.email); // Store user's email
  
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
  
    if (!error) {
      setOtpModalVisible(true); // Show OTP modal
    } else {
      console.error('Error sending OTP:', error.message); // Log error for debugging
      setOtpError('Unable to send OTP. Please try again later.');
    }
  };
  
  const handleConfirmOtp = async () => {
    if (!otp) {
      setOtpError('OTP is required.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const { error } = await supabase.auth.verifyOtp({
        token: otp,
        type: 'recovery', // Make sure you are using the correct 'type' ('recovery' for password reset)
        email: userEmail,
      });
  
      if (error) {
        console.error('Error verifying OTP:', error.message); // Log error for debugging
        setOtpError('Invalid OTP. Please try again.');
      } else {
        setOtpError('');
        setOtpModalVisible(false); // Close OTP modal
        setNewPasswordModalVisible(true); // Open New Password modal
      }
    } catch (e) {
      console.error('Unexpected error:', e); // Log any unexpected errors
      setOtpError('An unexpected error occurred.');
    }
  
    setIsSubmitting(false);
  };
  
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setPasswordError('Both fields are required.');
      return;
    }
  
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
  
      if (error) {
        console.error('Error updating password:', error.message); // Log error for debugging
        setPasswordError('Unable to update password, please try again.');
      } else {
        setNewPasswordModalVisible(false); // Close New Password modal
        setPasswordError('');
        Alert.alert('Success', 'Your password has been updated successfully!');
      }
    } catch (e) {
      console.error('Unexpected error:', e); // Log any unexpected errors
      setPasswordError('An unexpected error occurred.');
    }
  
    setIsSubmitting(false);
  };  

  // Handle clearing cache
  const handleClearCache = () => {
    Alert.alert('Cache cleared successfully!');
  };

  // Handle reset app settings
  const handleResetAppSettings = () => {
    Alert.alert('App settings reset to default.');
  };

  // Back Button to navigate to the previous screen
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      Alert.alert('Logged out successfully!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } else {
      Alert.alert('Error', 'There was an issue logging out.');
    }
  };

  useEffect(() => {
    const fetchUserPreferences = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        Alert.alert('Error', 'Unable to fetch user details.');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('goal, fitness_level, activity_level')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        console.error('Error fetching user preferences:', error);
        Alert.alert('Error', 'Failed to fetch fitness preferences.');
      } else {
        setGoal(data.goal || 'general_fitness');
        setWorkoutIntensity(data.fitness_level || 'intermediate');
        setActivityLevel(data.activity_level || 'sedentary'); // Set fetched activity level
      }
    };

    fetchUserPreferences();
  }, []);

  return (
    <ImageBackground source={require('../assets/setting.png')} style={styles.background}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Settings */}
        <View style={[styles.section, styles.profileSection]}>
          <View style={styles.titleRow}>
            <Ionicons name="person-circle-outline" size={wp('6%')} color="#007BFF" />
            <Text style={styles.sectionTitle}>Profile Settings</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfileScreen')}>
            <Ionicons name="create-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Ionicons name="settings-outline" size={wp('6%')} color="#007BFF" />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={setPushNotificationsEnabled}
              thumbColor={pushNotificationsEnabled ? '#007BFF' : '#f4f4f4'}
              trackColor={{ false: '#767577', true: '#007BFF' }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              thumbColor={darkModeEnabled ? '#007BFF' : '#f4f4f4'}
              trackColor={{ false: '#767577', true: '#007BFF' }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Language</Text>
            <Picker
              selectedValue={language}
              style={styles.picker}
              onValueChange={setLanguage}>
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Español" value="es" />
            </Picker>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Units</Text>
            <Picker
              selectedValue={units}
              style={styles.picker}
              onValueChange={setUnits}>
              <Picker.Item label="Metric (kg, cm)" value="metric" />
              <Picker.Item label="Imperial (lbs, in)" value="imperial" />
            </Picker>
          </View>
        </View>

        {/* Fitness Preferences */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Ionicons name="barbell-outline" size={wp('6%')} color="#007BFF" />
            <Text style={styles.sectionTitle}>Fitness Preferences</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Goal</Text>
            <Picker
              selectedValue={goal}
              style={styles.picker}
              onValueChange={setGoal}>
              <Picker.Item label="Weight Loss" value="weight_loss" />
              <Picker.Item label="Muscle Gain" value="muscle_gain" />
              <Picker.Item label="Endurance" value="endurance" />
              <Picker.Item label="Flexibility" value="flexibility" />
              <Picker.Item label="General Fitness" value="general_fitness" />
            </Picker>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Workout Intensity</Text>
            <Picker
              selectedValue={workoutIntensity}
              style={styles.picker}
              onValueChange={setWorkoutIntensity}>
              <Picker.Item label="Beginner" value="beginner" />
              <Picker.Item label="Intermediate" value="intermediate" />
              <Picker.Item label="Advanced" value="advanced" />
            </Picker>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Activity Level</Text>
            <Picker
              selectedValue={activityLevel}
              style={styles.picker}
              onValueChange={setActivityLevel}>
              <Picker.Item label="Sedentary" value="sedentary" />
              <Picker.Item label="Lightly Active" value="lightly_active" />
              <Picker.Item label="Moderately Active" value="moderately_active" />
              <Picker.Item label="Very Active" value="very_active" />
              <Picker.Item label="Super Active" value="super_active" />
            </Picker>
          </View>          
          <TouchableOpacity style={styles.button} onPress={handleSaveFitnessPreferences}>
            <Ionicons name="fitness-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Ionicons name="lock-closed-outline" size={wp('6%')} color="#007BFF" />
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location Access</Text>
            <Switch
              value={locationAccessEnabled}
              onValueChange={setLocationAccessEnabled}
              thumbColor={locationAccessEnabled ? '#007BFF' : '#f4f4f4'}
              trackColor={{ false: '#767577', true: '#007BFF' }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Data Sharing</Text>
            <Switch
              value={dataSharingEnabled}
              onValueChange={setDataSharingEnabled}
              thumbColor={dataSharingEnabled ? '#007BFF' : '#f4f4f4'}
              trackColor={{ false: '#767577', true: '#007BFF' }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Account Privacy</Text>
            <Switch
              value={accountPrivacyEnabled}
              onValueChange={setAccountPrivacyEnabled}
              thumbColor={accountPrivacyEnabled ? '#007BFF' : '#f4f4f4'}
              trackColor={{ false: '#767577', true: '#007BFF' }}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Ionicons name="apps-outline" size={wp('6%')} color="#007BFF" />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleClearCache}>
            <Ionicons name="trash-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Clear Cache</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleResetAppSettings}>
            <Ionicons name="refresh-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Reset App Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <View style={styles.titleRow}>
            <Ionicons name="person-remove-outline" size={wp('6%')} color="#007BFF" />
            <Text style={styles.sectionTitle}>Account Management</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
            <Ionicons name="key-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.dangerButton]}>
            <Ionicons name="close-circle-outline" size={wp('5%')} color="#fff" />
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} animationType="slide" transparent={true}>
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalContent}>
            <Text style={styles.enhancedModalTitle}>Enter OTP</Text>
            <TextInput
              style={[styles.enhancedInput, otpError ? styles.errorInput : null]}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                setOtpError('');
              }}
              keyboardType="numeric"
            />
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <TouchableOpacity
              style={styles.enhancedModalButton}
              onPress={handleConfirmOtp}
              disabled={isSubmitting}
            >
              <Text style={styles.modalButtonText}>{isSubmitting ? 'Submitting...' : 'Confirm OTP'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.enhancedModalBackButton}
              onPress={() => setOtpModalVisible(false)}
            >
              <Text style={styles.enhancedModalBackButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Password Modal */}
      <Modal visible={newPasswordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.enhancedModalContainer}>
          <View style={styles.enhancedModalContent}>
            <Text style={styles.enhancedModalTitle}>Set New Password</Text>
            <TextInput
              style={[styles.enhancedInput, passwordError ? styles.errorInput : null]}
              placeholder="New Password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
            />
            <TextInput
              style={[styles.enhancedInput, passwordError ? styles.errorInput : null]}
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChangeText={(text) => {
                setConfirmNewPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            <TouchableOpacity
              style={styles.enhancedModalButton}
              onPress={handleUpdatePassword}
              disabled={isSubmitting}
            >
              <Text style={styles.modalButtonText}>{isSubmitting ? 'Updating...' : 'Update Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    paddingTop: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  container: {
    flexGrow: 1,
    padding: wp('5%'),
  },
  profileSection: {},
  section: {
    marginBottom: hp('3%'),
    backgroundColor: '#fff',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#007BFF',
    marginLeft: wp('2%'),
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  settingLabel: {
    fontSize: wp('4.5%'),
    color: '#333',
  },
  picker: {
    width: wp('40%'),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    backgroundColor: '#007BFF',
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    marginLeft: wp('2%'),
  },
  dangerButton: {
    backgroundColor: '#FF4B4B',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
  },
  backButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    marginLeft: wp('2%'),
  },
  enhancedModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  enhancedModalContent: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  enhancedModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  enhancedInput: {
    width: '100%',
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  enhancedModalButton: {
    width: '100%',
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  enhancedModalBackButton: {
    width: '100%',
    backgroundColor: 'lightgreen', 
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enhancedModalBackButtonText: {
    color: '#fff', 
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorInput: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
});

export default SettingsScreen;
