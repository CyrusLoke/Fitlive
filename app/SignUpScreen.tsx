import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Image, Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUpScreen'>;

const SignUpScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<string>('');

  const [emailError, setEmailError] = useState<string>(''); // For email errors
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  const navigation = useNavigation<SignUpScreenNavigationProp>();

  // Handles the sign-up process and validation
  const handleSignUp = async () => {
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    // Validate email
    if (!email) {
      setEmailError('Please enter your email');
      hasError = true;
    }

    // Validate password
    if (!password) {
      setPasswordError('Please enter your password');
      hasError = true;
    }

    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      // Check if the email already exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking email:', checkError);
        setEmailError('An unexpected error occurred. Please try again.');
        setLoading(false);
        return;
      }

      // If the user exists, show the error message
      if (existingUser) {
        setEmailError('Email already exists. Please log in.');
        setLoading(false);
        return;
      }

      // Supabase sign-up request if email does not exist
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'yourapp://LoginScreen', // Redirect URL after successful verification
        },
      });

      if (error) {
        console.log('Sign up error:', error); // Log the actual error details for debugging
        setEmailError('Sign up failed, please check your email');
      } else {
        // User successfully signed up, now insert user into 'users' table
        const user = data.user;
        if (user) {
          const { error: insertError } = await supabase
            .from('users') // Replace 'users' with your actual users table name
            .insert([{ id: user.id, email: user.email, role: 1 }]); // Default role: 1 for normal users

          if (insertError) {
            console.log('Error inserting user into database:', insertError);
            Alert.alert('Error', 'There was a problem adding your account details. Please try again.');
          } else {
            alert('Sign up successful! Please check your email to confirm.');
            navigation.reset({
              index: 0,
              routes: [{ name: 'LoginScreen' }],
            });
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error during sign-up:', err); // Log any unexpected errors
      Alert.alert('Error', 'An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const checkPasswordStrength = (inputPassword: string) => {
    let strength = '';
    if (inputPassword.length < 6) {
      strength = 'Weak';
    } else if (inputPassword.match(/[A-Z]/) && inputPassword.match(/[0-9]/) && inputPassword.match(/[^A-Za-z0-9]/)) {
      strength = 'Strong';
    } else {
      strength = 'Medium';
    }
    setPasswordStrength(strength);
  };

  // Navigate back to the Login screen
  const navigateToLogin = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <ImageBackground
      source={require('../assets/LoginBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>

        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.description}>
          Create a new account to get started with your fitness journey.
        </Text>

        {/* Email Input */}
        <View style={[styles.inputContainer, emailError ? styles.errorInput : null]}>
          <Icon name="email-outline" size={28} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
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
        {emailError ? <Text style={styles.errorTextLeft}>{emailError}</Text> : null}

        {/* Password Input */}
        <View style={[styles.inputContainer, passwordError ? styles.errorInput : null]}>
          <Icon name="lock-outline" size={28} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              checkPasswordStrength(text);
              setPasswordError('');
            }}
            secureTextEntry={!passwordVisible}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Icon name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={28} color="#666" style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorTextLeft}>{passwordError}</Text> : null}

        <Text style={[styles.passwordStrength, passwordStrength === 'Strong' && styles.strongPassword, passwordStrength === 'Weak' && styles.weakPassword]}>
          {passwordStrength ? `Password Strength: ${passwordStrength}` : ''}
        </Text>

        {/* Confirm Password Input */}
        <View style={[styles.inputContainer, confirmPasswordError ? styles.errorInput : null]}>
          <Icon name="lock-outline" size={28} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
            secureTextEntry={!confirmPasswordVisible}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
            <Icon name={confirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={28} color="#666" style={styles.eyeIcon} />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={styles.errorTextLeft}>{confirmPasswordError}</Text> : null}

        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton} disabled={loading}>
          <Text style={styles.signUpButtonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        {/* Back to Login Button */}
        <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: '100%',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#007BFF',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, 
    width: '100%',
  },
  errorInput: {
    borderColor: '#dc3545',
    borderWidth: 1,
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
  eyeIcon: {
    marginLeft: 10,
  },
  passwordStrength: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
    alignSelf: 'flex-start',
  },
  strongPassword: {
    color: '#28a745', 
  },
  weakPassword: {
    color: '#dc3545', 
  },
  errorTextLeft: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  signUpButton: {
    backgroundColor: '#007BFF', 
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  signUpButtonText: {
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
});

export default SignUpScreen;
