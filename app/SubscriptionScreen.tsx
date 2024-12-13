import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ImageBackground, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isMonthly, setIsMonthly] = useState(true);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  
  const handleSubscribe = async () => {
    try {
      // Choose amount based on plan
      const amount = isMonthly ? 4990 : 47990;
      const currency = 'myr';
  
      // Create PaymentIntent on backend
      const response = await axios.post('http://10.150.188.178:3000/create-payment-intent', {
        amount,
        currency,
      });
  
      const { clientSecret } = response.data;
  
      // Initialize the PaymentSheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Fitlive',
      });
  
      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }
  
      // Present the PaymentSheet
      const { error: presentError } = await presentPaymentSheet();
  
      if (presentError) {
        Alert.alert('Payment Failed', presentError.message);
      } else {
        // Payment Successful
        Alert.alert('Payment Successful', 'You have subscribed successfully!');
  
        // Fetch current session from Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
        if (sessionError) {
          Alert.alert('Error', 'Failed to retrieve session. Please try logging in again.');
          return;
        }
  
        // Get the user ID
        const userId = sessionData?.session?.user?.id;
  
        if (userId) {
          // Update the user's is_premium status in the Supabase 'users' table
          const { error: updateError } = await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('id', userId);
  
          if (updateError) {
            Alert.alert('Update Error', updateError.message);
          } else {
  
            navigation.navigate('PaymentSuccessScreen' as never);
          }
        } else {
          Alert.alert('Error', 'User ID not found. Please try logging in again.');
        }
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err.message);
    }
  };  

  return (
    <ImageBackground source={require('../assets/sub.png')} style={styles.backgroundImage}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Upgrade to Premium!</Text>
          <Text style={styles.description}>
            Enjoy exclusive access to advanced workouts, personalized meal plans, and more.
          </Text>

          {/* Plan Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity onPress={() => setIsMonthly(true)} style={isMonthly ? styles.activeToggle : styles.inactiveToggle}>
              <Text style={styles.toggleText}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsMonthly(false)} style={!isMonthly ? styles.activeToggle : styles.inactiveToggle}>
              <Text style={styles.toggleText}>Yearly (Save 20%)</Text>
            </TouchableOpacity>
          </View>

          {/* Pricing Box */}
          <View style={styles.pricingBox}>
            <Text style={styles.planText}>⭐ Premium {isMonthly ? 'Monthly' : 'Yearly'} Plan</Text>
            <Text style={styles.priceText}>{isMonthly ? 'RM49.90 / month' : 'RM479.90 / year'}</Text>
            <Text style={styles.disclaimerText}>Cancel anytime. 7-day free trial.</Text>
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Benefits of Premium Subscription:</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="fitness-outline" size={24} color="#FFD700" style={styles.iconShadow} />
              <Text style={styles.benefitText}>Access to advanced workout plans</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="restaurant-outline" size={24} color="#FFD700" style={styles.iconShadow} />
              <Text style={styles.benefitText}>Personalized meal plans tailored to your goals</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="analytics-outline" size={24} color="#FFD700" style={styles.iconShadow} />
              <Text style={styles.benefitText}>Detailed progress tracking and analytics</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="remove-circle-outline" size={24} color="#FFD700" style={styles.iconShadow} />
              <Text style={styles.benefitText}>No ads for an uninterrupted experience</Text>
            </View>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>Subscribe Now!</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>No, Thanks</Text>
          </TouchableOpacity>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  title: {
    fontSize: wp('8%'),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  description: {
    fontSize: wp('4.8%'),
    textAlign: 'center',
    color: '#DDDDDD',
    marginBottom: hp('3%'),
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  toggleButton: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('10%'),
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 10,
    marginHorizontal: wp('2%'),
  },
  activeButton: {
    backgroundColor: '#FFD700',
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pricingBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: hp('2%'),
    borderRadius: 10,
    alignItems: 'center',
    width: '90%',
    marginBottom: hp('3%'),
  },
  planText: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  priceText: {
    fontSize: wp('6%'),
    fontWeight: '600',
    color: '#FFD700',
  },
  disclaimerText: {
    fontSize: wp('3.5%'),
    color: '#BBBBBB',
    marginTop: hp('0.5%'),
  },
  benefitsContainer: {
    marginBottom: hp('3%'),
    width: '90%',
  },
  benefitsTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1%'),
  },
  iconShadow: {
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  benefitText: {
    fontSize: wp('4%'),
    color: '#EEEEEE',
    marginLeft: wp('3%'),
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('15%'),
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  subscribeButtonText: {
    color: '#333333',
    fontSize: wp('5%'),
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: hp('1%'),
  },
  cancelButtonText: {
    color: '#DDDDDD',
    fontSize: wp('4%'),
  },
  activeToggle: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('10%'),
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  inactiveToggle: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('10%'),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  toggleText: {
    color: '#333333',
    fontSize: wp('4%'),
    fontWeight: '600',
  },
});

export default SubscriptionScreen;
