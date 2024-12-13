import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Modal, Animated, Easing } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';

type UserInfoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserInfoScreen'>;

const TOTAL_STEPS = 7; // Total number of steps in the form

const UserInfoScreen: React.FC = () => {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>(''); 
  const [gender, setGender] = useState<string>('male');
  const [goal, setGoal] = useState<string>('weight_loss');
  const [fitnessLevel, setFitnessLevel] = useState<string>('beginner');
  const [activityLevel, setActivityLevel] = useState<string>('sedentary'); // New state for Activity Level
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(Array(TOTAL_STEPS).fill(false));
  const [animationValue] = useState(new Animated.Value(0));
  const [showProgressSummary, setShowProgressSummary] = useState<boolean>(false);

  const navigation = useNavigation<UserInfoScreenNavigationProp>();

  const isNumeric = (value: string) => /^\d+$/.test(value);

  // Helper function to capitalize the first letter of each word
  const capitalizeFirstLetter = (text: string) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Validates the current step before moving forward
  const validateStep = (currentStep: number) => {
    setError('');
    let isValid = true;
  
    if (!completedSteps[currentStep - 1]) {
      switch (currentStep) {
        case 1:
          if (!isNumeric(weight) || parseInt(weight) < 30 || parseInt(weight) > 300) {
            setError('Please enter a valid weight between 30kg and 300kg.');
            isValid = false;
          }
          break;
        case 2:
          if (!isNumeric(height) || parseInt(height) < 50 || parseInt(height) > 250) {
            setError('Please enter a valid height between 50cm and 250cm.');
            isValid = false;
          }
          break;
        case 3:
          if (!isNumeric(age) || parseInt(age) < 10 || parseInt(age) > 120) {
            setError('Please enter a valid age between 10 and 120.');
            isValid = false;
          }
          break;
        default:
          isValid = true;
      }
  
      if (isValid) {
        const newCompletedSteps = [...completedSteps];
        newCompletedSteps[currentStep - 1] = true;
        setCompletedSteps(newCompletedSteps);
      }
    }
  
    return isValid;
  };

  // Proceed to the next step
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      animateStepTransition();
    }
  };

  // Animation for step transitions
  const animateStepTransition = () => {
    Animated.timing(animationValue, {
      toValue: step * 100,
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  // Handles saving the user information to the database
  const handleSaveUserInfo = async () => {
    if (!weight || !height || !age || !gender || !goal || !fitnessLevel || !activityLevel) {
      setError('Please fill in all the fields.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError); 
      return;
    }

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user:', fetchError); 
        return;
      }

      let result;

      if (existingUser) {
        result = await supabase
          .from('users')
          .update({
            weight,
            height,
            age,
            gender,
            goal,
            fitness_level: fitnessLevel,
            activity_level: activityLevel, // Add Activity Level to update
            email: user.email, // Include the user's email here
            updated_at: new Date(),
          })
          .eq('id', user.id);
      } else {
        result = await supabase
          .from('users')
          .insert([{
            id: user.id,
            weight,
            height,
            age,
            gender,
            goal,
            fitness_level: fitnessLevel,
            activity_level: activityLevel, // Add Activity Level to insert
            email: user.email, // Include the user's email here
            created_at: new Date(),
          }]);
      }

      const { error: updateError } = result;

      if (updateError) {
        console.error('Error saving user info:', updateError);
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }], // Reset the navigation and go to the HomeScreen
      });
    } catch (error) {
      console.error('Unexpected error during save:', error);
    }
  };

  const handleBackPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };

  // Progress bar for steps, where users can click to jump back to completed steps
  const renderProgress = () => {
    const highestCompletedStep = completedSteps.lastIndexOf(true); // Finds the last completed step
  
    return (
      <View style={styles.progressContainer}>
        {[...Array(TOTAL_STEPS)].map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              if (i <= highestCompletedStep + 1) {
                setStep(i + 1);
              }
            }}
            style={[
              styles.progressStep,
              step > i && styles.progressStepActive,
              completedSteps[i] && styles.progressStepCompleted,
            ]}
          />
        ))}
      </View>
    );
  };

  // Renders the steps for inputting user information
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              placeholder="Enter your weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              placeholder="Enter your height"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              style={styles.input}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Gender</Text>
            <Picker
              selectedValue={gender}
              style={styles.picker}
              onValueChange={(itemValue) => setGender(itemValue)}
            >
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
            </Picker>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Goal</Text>
            <Picker
              selectedValue={goal}
              style={styles.picker}
              onValueChange={(itemValue) => setGoal(itemValue)}
            >
              <Picker.Item label="Weight Loss" value="weight_loss" />
              <Picker.Item label="Muscle Gain" value="muscle_gain" />
              <Picker.Item label="Endurance" value="endurance" />
              <Picker.Item label="Flexibility" value="flexibility" />
              <Picker.Item label="General Fitness" value="general_fitness" />
            </Picker>
          </View>
        );
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Prefer Fitness Level</Text>
            <Picker
              selectedValue={fitnessLevel}
              style={styles.picker}
              onValueChange={(itemValue) => setFitnessLevel(itemValue)}
            >
              <Picker.Item label="Beginner" value="beginner" />
              <Picker.Item label="Intermediate" value="intermediate" />
              <Picker.Item label="Advanced" value="advanced" />
            </Picker>
          </View>
        );
      case 7: // New step for Activity Level
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.label}>Activity Level</Text>
            <Picker
              selectedValue={activityLevel}
              style={styles.picker}
              onValueChange={(itemValue) => setActivityLevel(itemValue)}
            >
              <Picker.Item label="Sedentary (little or no exercise)" value="sedentary" />
              <Picker.Item label="Lightly Active (light exercise 1-3 days/week)" value="lightly_active" />
              <Picker.Item label="Moderately Active (moderate exercise 3-5 days/week)" value="moderately_active" />
              <Picker.Item label="Very Active (hard exercise 6-7 days/week)" value="very_active" />
              <Picker.Item label="Super Active (very hard exercise & a physical job)" value="super_active" />
            </Picker>
          </View>
        );
      default:
        return null;
    }
  };

  // Displays a summary modal after all steps are completed
  const renderProgressSummary = () => (
    <Modal
      visible={showProgressSummary}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalBackground}>
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Welcome to the Fitness App!</Text>
          <Text style={styles.summaryText}>Your fitness journey starts here.</Text>
          <Text style={styles.summaryText}>We're excited to have you on board!</Text>
          <Text style={styles.summaryText}>Let's achieve your goals together.</Text>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Summary:</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Weight:</Text>
              <Text style={styles.summaryValue}>{weight} kg</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Height:</Text>
              <Text style={styles.summaryValue}>{height} cm</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Age:</Text>
              <Text style={styles.summaryValue}>{age} years</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gender:</Text>
              <Text style={styles.summaryValue}>{gender === 'male' ? 'Male' : 'Female'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Goal:</Text>
              <Text style={styles.summaryValue}>{capitalizeFirstLetter(goal.replace('_', ' '))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Fitness Level:</Text>
              <Text style={styles.summaryValue}>{capitalizeFirstLetter(fitnessLevel)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Activity Level:</Text>
              <Text style={styles.summaryValue}>{capitalizeFirstLetter(activityLevel.replace('_', ' '))}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowProgressSummary(false)} // Go back to editing the info if user found wrong
            >
              <Text style={styles.editButtonText}>Edit Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleSaveUserInfo} // Save the user info and navigate to HomeScreen
            >
              <Text style={styles.startButtonText}>Let's Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ImageBackground
      source={require('../assets/info.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back-outline" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.title}>Fill in Your Information</Text>
        {renderProgress()}
        {renderStep()}

        {step < 7 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setShowProgressSummary(true)} // Show the summary after finishing the form
          >
            <Text style={styles.saveButtonText}>Finish</Text>
          </TouchableOpacity>
        )}
        {renderProgressSummary()}
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
    width: '90%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  stepContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  nextButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressStep: {
    width: 15,
    height: 15,
    borderRadius: 15 / 2,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  progressStepActive: {
    backgroundColor: '#007BFF',
  },
  progressStepCompleted: {
    backgroundColor: '#28a745',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 30,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
    textAlign: 'center',
  },
  summarySection: {
    marginTop: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textDecorationLine: 'none',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  editButton: {
    backgroundColor: '#f0ad4e',
    paddingVertical: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default UserInfoScreen;
