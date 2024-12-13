import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

const RequestMealScreen: React.FC = () => {
  const navigation = useNavigation();
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form submission handler
  const handleSubmit = async () => {
    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      // Get the current user's ID
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error fetching user:', userError.message);
        Alert.alert('Error', 'Unable to fetch user information. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const userId = userData?.user?.id;

      // Insert the request into the 'meal_plan_requests' table
      const { error } = await supabase.from('meal_plan_requests').insert([
        {
          user_id: userId,
          dietary_preference: dietaryPreference,
          comments: comments,
          status: 'pending',
        },
      ]);

      if (error) {
        console.error('Error submitting meal plan request:', error.message);
        Alert.alert('Error', 'Failed to submit your request. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Show success message and reset form
      Alert.alert(
        'Request Submitted',
        'Your request for a personalized meal plan has been submitted. The nutritionist will create a plan based on your profile information shortly.',
        [{ text: 'OK', onPress: () => resetForm() }]
      );
    } catch (error: any) {
      console.error('Unexpected error:', error.message);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setDietaryPreference('');
    setComments('');
    navigation.goBack();
  };

  return (
    <ImageBackground source={require('../assets/recipe.png')} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" size={wp('6%')} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Request Your Personalized Meal Plan</Text>
        <Text style={styles.subtitle}>
          The meal plan will be tailored based on your profile information (e.g., age, gender, weight, fitness goals).
          You can provide additional preferences or comments if needed.
        </Text>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <Icon name="nutrition" size={wp('5%')} color="#4caf50" />
          <TextInput
            style={styles.input}
            placeholder="Dietary Preference (Optional, e.g., Keto, Vegan)"
            value={dietaryPreference}
            onChangeText={setDietaryPreference}
            accessible
            accessibilityLabel="Enter your dietary preference (optional)"
          />
        </View>

        <View style={styles.commentsContainer}>
          <Icon name="alert-circle" size={wp('5%')} color="#4caf50" />
          <TextInput
            style={styles.commentsInput}
            placeholder="Additional Comments (Optional, e.g., Allergies, Dietary Restrictions)"
            multiline
            numberOfLines={4}
            value={comments}
            onChangeText={setComments}
            maxLength={200}
            accessible
            accessibilityLabel="Enter additional comments (optional)"
          />
        </View>

        {/* Submit Button */}
        {isSubmitting ? (
          <ActivityIndicator size="large" color="#4caf50" />
        ) : (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            accessible
            accessibilityLabel="Submit meal plan request"
          >
            <Text style={styles.submitButtonText}>Request Meal Plan</Text>
          </TouchableOpacity>
        )}

        {/* Tips Section */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Note:</Text>
          <Text style={styles.tipsText}>
            ✔️ The nutritionist will create your meal plan based on your profile details. You only need to provide any
            additional preferences or restrictions if necessary.
          </Text>
          <Text style={styles.tipsText}>
            ✔️ If you have any specific dietary needs or allergies, please mention them clearly in the comments.
          </Text>
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
    padding: wp('5%'),
  },
  backButton: {
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  subtitle: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: wp('4%'),
    marginLeft: wp('3%'),
    color: '#333',
  },
  commentsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    elevation: 3,
  },
  commentsInput: {
    flex: 1,
    fontSize: wp('4%'),
    marginLeft: wp('3%'),
    color: '#333',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4caf50',
    paddingVertical: hp('2%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginTop: hp('3%'),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
  tipsContainer: {
    backgroundColor: '#e0f7e9',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginTop: hp('3%'),
  },
  tipsTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: hp('1%'),
  },
  tipsText: {
    fontSize: wp('4%'),
    color: '#555',
  },
});

export default RequestMealScreen;
