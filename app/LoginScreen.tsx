import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { supabase } from '../supabaseClient'; 
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from './App';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoginScreen'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>(''); 
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [credentialsError, setCredentialsError] = useState<string>('');

  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    const checkSession = async () => {
      const session = await AsyncStorage.getItem('supabase_session');
      if (session) {
        const { data: { session: restoredSession } } = await supabase.auth.setSession(JSON.parse(session));
        if (restoredSession) {
          const userId = restoredSession.user?.id;
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .maybeSingle();

          if (userError || !userData) {
            navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
          } else {
            if (userData.role === 2 || userData.role === 3) {
              // Navigate to Admin Home if role is admin (role = 2) or super admin (role = 3)
              navigation.reset({ index: 0, routes: [{ name: 'AdminHomeScreen' }] });
            } else {
              // Navigate to normal Home for regular users
              navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
            }
          }
        }
      }
    };
    checkSession();
  }, [navigation]);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setCredentialsError('');

    let hasError = false;

    if (!email) {
      setEmailError('Please enter your email');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setCredentialsError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;

    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('weight, height, role')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        setCredentialsError('Unable to fetch user data');
        setLoading(false);
        return;
      }

      // Store session if "Remember Me" is checked
      if (rememberMe && data?.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(data.session));
      }

      // Redirect based on the user's role
      if (!userData || userData.weight == null || userData.height == null) {
        navigation.reset({ index: 0, routes: [{ name: 'UserInfoScreen' }] });
      } else {
        if (userData.role === 2 || userData.role === 3) {
          // Admin user or super admin, navigate to AdminHomeScreen
          navigation.reset({ index: 0, routes: [{ name: 'AdminHomeScreen' }] });
        } else {
          // Regular user, navigate to HomeScreen
          navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
        }
      }
    }

    setLoading(false);
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUpScreen');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPasswordScreen');
  };

  return (
    <ImageBackground
      source={require('../assets/LoginBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Login</Text>

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
              setCredentialsError('');
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
              setPasswordError('');
              setCredentialsError('');
            }}
            secureTextEntry={!passwordVisible}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Icon
              name={passwordVisible ? 'eye-off' : 'eye'}
              size={28}
              color="#666"
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorTextLeft}>{passwordError}</Text> : null}
        {credentialsError ? <Text style={styles.errorTextLeft}>{credentialsError}</Text> : null}

        {/* Remember Me Checkbox */}
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)} style={styles.checkboxContainer}>
          <Icon 
            name={rememberMe ? 'checkbox-outline' : 'square-outline'} 
            size={24} 
            color={rememberMe ? '#007BFF' : '#666'} 
          />
          <Text style={styles.checkboxLabel}>Remember Me</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton} disabled={loading}>
          <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        {/* Forgot Password and Sign Up Links */}
        <TouchableOpacity onPress={navigateToForgotPassword} style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={navigateToSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpText}>
            Don't have an account? <Text style={styles.signUpLink}>Sign up</Text>
          </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
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
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, 
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
  errorTextLeft: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5, 
    marginBottom: 20, 
  },
  checkbox: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#007BFF', 
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  signUpButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: '#333',
  },
  signUpLink: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
