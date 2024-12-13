import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.message}>Thank you for subscribing to Premium!</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('HomeScreen' as never)}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentSuccessScreen;
