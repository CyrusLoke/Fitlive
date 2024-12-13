import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ImageBackground, ActivityIndicator, Modal } from 'react-native';
import { supabase } from '../supabaseClient'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App'; 
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; 

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPasswordScreen'>;

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>(''); 
  const [loading, setLoading] = useState<boolean>(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [newPasswordModalVisible, setNewPasswordModalVisible] = useState(false);
  const [otp, setOtp] = useState<string>(''); 
  const [newPassword, setNewPassword] = useState<string>(''); 
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>(''); 
  const [passwordError, setPasswordError] = useState<string>(''); 
  const [userEmail, setUserEmail] = useState<string>(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const handleForgotPassword = async () => {
    if (!email) {
      setEmailError('Email is required');
      return;
    }

    setLoading(true);
    setEmailError(''); 

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Alert.alert('Failed', error.message); 
    } else {
      Alert.alert('Success', 'OTP has been sent to your email.');
      setUserEmail(email); 
      setOtpModalVisible(true); 
    }

    setLoading(false);
  };

  const handleConfirmOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.verifyOtp({
      token: otp,
      type: 'recovery', 
      email: userEmail, 
    });

    if (error) {
      Alert.alert('Invalid OTP', 'Please try again.');
    } else {
      Alert.alert('Success', 'OTP verified. You can now reset your password.');
      setOtpModalVisible(false); 
      setNewPasswordModalVisible(true); 
    }

    setIsSubmitting(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setPasswordError('Password is required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setPasswordError(''); 

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (!error) {
      Alert.alert('Success', 'Your password has been updated.');
      setNewPasswordModalVisible(false); 
      navigation.navigate('LoginScreen'); 
    } else {
      setPasswordError('Failed to update password, try again');
    }

    setIsSubmitting(false);
  };

  return (
    <ImageBackground
      source={require('../assets/LoginBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Forgot Password</Text>

        <View style={[styles.inputContainer, emailError ? styles.errorInput : null]}>
          <Icon name="mail-outline" size={24} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            autoCapitalize="none"  
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TouchableOpacity onPress={handleForgotPassword} style={[styles.resetButton, loading && styles.buttonDisabled]} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Send Password Reset</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={otpModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.enhancedModalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <TextInput
              style={styles.enhancedOtpInput} 
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.enhancedModalButton}
              onPress={handleConfirmOtp}
              disabled={isSubmitting}
            >
              <Text style={styles.modalButtonText}>{isSubmitting ? 'Verifying...' : 'Confirm OTP'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.enhancedModalBackButton}
              onPress={() => setOtpModalVisible(false)} 
            >
              <Text style={styles.modalButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={newPasswordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.enhancedModalContent}>
            <Text style={styles.modalTitle}>Set New Password</Text>
            
            <TextInput
              style={[styles.enhancedInput, passwordError ? styles.errorInput : null]}
              placeholder="New Password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              placeholderTextColor="#999"
            />
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

            <TextInput
              style={[styles.enhancedInput, passwordError ? styles.errorInput : null]}
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChangeText={(text) => {
                setConfirmNewPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              placeholderTextColor="#999"
            />
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '100%',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  enhancedOtpInput: {
    width: '100%',
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  enhancedInput: {
    width: '100%',
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  enhancedModalButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 10,
  },
  enhancedModalBackButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 8,
    backgroundColor: '#DC3545',
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
    marginBottom: 10,
  },
});

export default ForgotPasswordScreen;
