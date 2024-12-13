import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../supabaseClient';

type EditFitnessPreferencesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditFitnessPreferencesScreen'>;

const EditFitnessPreferencesScreen: React.FC = () => {
  const navigation = useNavigation<EditFitnessPreferencesScreenNavigationProp>();

  const [fitnessGoal, setFitnessGoal] = useState<string>('muscle_gain'); // Default value
  const [workoutIntensity, setWorkoutIntensity] = useState<string>('beginner'); // Default value
  const [activityLevel, setActivityLevel] = useState<string>('sedentary'); // Default value for Activity Level

  useEffect(() => {
    const fetchFitnessPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('goal, fitness_level, activity_level')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setFitnessGoal(data.goal || 'muscle_gain');
          setWorkoutIntensity(data.fitness_level || 'beginner');
          setActivityLevel(data.activity_level || 'sedentary'); // Set activity level
        } else {
          console.error('Error fetching fitness preferences:', error?.message);
        }
      }
    };

    fetchFitnessPreferences();
  }, []);

  const handleSavePreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const updates = {
        goal: fitnessGoal,
        fitness_level: workoutIntensity,
        activity_level: activityLevel, // Save activity level
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Could not save fitness preferences');
      } else {
        Alert.alert('Success', 'Fitness preferences updated successfully');
        navigation.goBack();
      }
    }
  };

  return (
    <ImageBackground source={require('../assets/editprofile.png')} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Edit Fitness Preferences</Text>

        {/* Fitness Goal */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Fitness Goal</Text>
          <View style={styles.goalSelection}>
            <TouchableOpacity
              style={[styles.goalButton, fitnessGoal === 'muscle_gain' && styles.selectedButton]}
              onPress={() => setFitnessGoal('muscle_gain')}
            >
              <Ionicons name="body-outline" size={wp('6%')} color={fitnessGoal === 'muscle_gain' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, fitnessGoal === 'muscle_gain' && styles.selectedGoalText]}>Muscle Gain</Text>
                <Text style={[styles.descriptionText, fitnessGoal === 'muscle_gain' && styles.selectedDescriptionText]}>Build muscle mass and strength</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, fitnessGoal === 'endurance' && styles.selectedButton]}
              onPress={() => setFitnessGoal('endurance')}
            >
              <Ionicons name="bicycle-outline" size={wp('6%')} color={fitnessGoal === 'endurance' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, fitnessGoal === 'endurance' && styles.selectedGoalText]}>Endurance</Text>
                <Text style={[styles.descriptionText, fitnessGoal === 'endurance' && styles.selectedDescriptionText]}>Improve stamina and cardiovascular health</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, fitnessGoal === 'weight_loss' && styles.selectedButton]}
              onPress={() => setFitnessGoal('weight_loss')}
            >
              <Ionicons name="fitness-outline" size={wp('6%')} color={fitnessGoal === 'weight_loss' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, fitnessGoal === 'weight_loss' && styles.selectedGoalText]}>Weight Loss</Text>
                <Text style={[styles.descriptionText, fitnessGoal === 'weight_loss' && styles.selectedDescriptionText]}>Reduce body fat and lose weight</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, fitnessGoal === 'flexibility' && styles.selectedButton]}
              onPress={() => setFitnessGoal('flexibility')}
            >
              <Ionicons name="man-outline" size={wp('6%')} color={fitnessGoal === 'flexibility' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, fitnessGoal === 'flexibility' && styles.selectedGoalText]}>Flexibility</Text>
                <Text style={[styles.descriptionText, fitnessGoal === 'flexibility' && styles.selectedDescriptionText]}>Enhance joint mobility and flexibility</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, fitnessGoal === 'general_fitness' && styles.selectedButton]}
              onPress={() => setFitnessGoal('general_fitness')}
            >
              <Ionicons name="heart-outline" size={wp('6%')} color={fitnessGoal === 'general_fitness' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, fitnessGoal === 'general_fitness' && styles.selectedGoalText]}>General Fitness</Text>
                <Text style={[styles.descriptionText, fitnessGoal === 'general_fitness' && styles.selectedDescriptionText]}>Maintain overall health and wellness</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Workout Intensity */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Workout Intensity</Text>
          <View style={styles.intensitySelection}>
            <TouchableOpacity
              style={[styles.goalButton, workoutIntensity === 'beginner' && styles.selectedButton]}
              onPress={() => setWorkoutIntensity('beginner')}
            >
              <Ionicons name="walk-outline" size={wp('6%')} color={workoutIntensity === 'beginner' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, workoutIntensity === 'beginner' && styles.selectedGoalText]}>Beginner</Text>
                <Text style={[styles.descriptionText, workoutIntensity === 'beginner' && styles.selectedDescriptionText]}>New to exercising</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, workoutIntensity === 'intermediate' && styles.selectedButton]}
              onPress={() => setWorkoutIntensity('intermediate')}
            >
              <Ionicons name="barbell-outline" size={wp('6%')} color={workoutIntensity === 'intermediate' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, workoutIntensity === 'intermediate' && styles.selectedGoalText]}>Intermediate</Text>
                <Text style={[styles.descriptionText, workoutIntensity === 'intermediate' && styles.selectedDescriptionText]}>Exercise regularly</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, workoutIntensity === 'advanced' && styles.selectedButton]}
              onPress={() => setWorkoutIntensity('advanced')}
            >
              <Ionicons name="flame-outline" size={wp('6%')} color={workoutIntensity === 'advanced' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, workoutIntensity === 'advanced' && styles.selectedGoalText]}>Advanced</Text>
                <Text style={[styles.descriptionText, workoutIntensity === 'advanced' && styles.selectedDescriptionText]}>Highly experienced in exercise</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.intensitySelection}>
            <TouchableOpacity
              style={[styles.goalButton, activityLevel === 'sedentary' && styles.selectedButton]}
              onPress={() => setActivityLevel('sedentary')}
            >
              <Ionicons name="cafe-outline" size={wp('6%')} color={activityLevel === 'sedentary' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, activityLevel === 'sedentary' && styles.selectedGoalText]}>Sedentary</Text>
                <Text style={[styles.descriptionText, activityLevel === 'sedentary' && styles.selectedDescriptionText]}>Little or no exercise, desk job</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, activityLevel === 'lightly_active' && styles.selectedButton]}
              onPress={() => setActivityLevel('lightly_active')}
            >
              <Ionicons name="walk-outline" size={wp('6%')} color={activityLevel === 'lightly_active' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, activityLevel === 'lightly_active' && styles.selectedGoalText]}>Lightly Active</Text>
                <Text style={[styles.descriptionText, activityLevel === 'lightly_active' && styles.selectedDescriptionText]}>Light exercise 1-3 days/week</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, activityLevel === 'moderately_active' && styles.selectedButton]}
              onPress={() => setActivityLevel('moderately_active')}
            >
              <Ionicons name="bicycle-outline" size={wp('6%')} color={activityLevel === 'moderately_active' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, activityLevel === 'moderately_active' && styles.selectedGoalText]}>Moderately Active</Text>
                <Text style={[styles.descriptionText, activityLevel === 'moderately_active' && styles.selectedDescriptionText]}>Moderate exercise 3-5 days/week</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, activityLevel === 'very_active' && styles.selectedButton]}
              onPress={() => setActivityLevel('very_active')}
            >
              <Ionicons name="barbell-outline" size={wp('6%')} color={activityLevel === 'very_active' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, activityLevel === 'very_active' && styles.selectedGoalText]}>Very Active</Text>
                <Text style={[styles.descriptionText, activityLevel === 'very_active' && styles.selectedDescriptionText]}>Hard exercise 6-7 days/week</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.goalButton, activityLevel === 'super_active' && styles.selectedButton]}
              onPress={() => setActivityLevel('super_active')}
            >
              <Ionicons name="flame-outline" size={wp('6%')} color={activityLevel === 'super_active' ? '#fff' : '#007BFF'} />
              <View style={styles.goalDescription}>
                <Text style={[styles.goalText, activityLevel === 'super_active' && styles.selectedGoalText]}>Super Active</Text>
                <Text style={[styles.descriptionText, activityLevel === 'super_active' && styles.selectedDescriptionText]}>Very hard exercise & physical job</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save and Cancel Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePreferences}>
            <Ionicons name="save-outline" size={wp('6%')} color="#fff" />
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close-circle-outline" size={wp('6%')} color="#fff" />
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
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('5%'),
  },
  header: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: hp('3%'),
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: hp('3%'),
  },
  label: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1.5%'),
  },
  goalSelection: {
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  intensitySelection: {
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('5%'),
    marginBottom: hp('2%'),
  },
  selectedButton: {
    backgroundColor: '#007BFF',
  },
  goalDescription: {
    marginLeft: wp('3%'),
  },
  goalText: {
    fontSize: wp('5%'),
    marginLeft: wp('3%'),
    color: '#007BFF',
  },
  selectedGoalText: {
    color: '#fff',
  },
  descriptionText: {
    fontSize: wp('4%'),
    color: '#555',
  },
  selectedDescriptionText: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('3%'),
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('5%'),
    width: '48%',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4B4B',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('5%'),
    width: '48%',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
});

export default EditFitnessPreferencesScreen;
