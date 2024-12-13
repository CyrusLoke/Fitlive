import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ImageBackground, FlatList, Alert, Switch, } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';

type Meal = {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
};

type RouteParams = {
  mealPlanId?: string;
  selectedMealIds?: number[];
};

const AdminAddMealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AdminAddMealPlanScreen'>>();

  const [mealPlanName, setMealPlanName] = useState('');
  const [mealPlanDescription, setMealPlanDescription] = useState('');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealPlanId, setMealPlanId] = useState<string | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [goal, setGoal] = useState('Weight Loss'); // State for the selected goal

  useEffect(() => {
    if (route.params?.mealPlanId) {
      setMealPlanId(route.params.mealPlanId);
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [route.params?.mealPlanId, route.params?.selectedMealIds]);

  useEffect(() => {
    const fetchData = async () => {
      if (mealPlanId) {
        setIsEditMode(true);
        const { data: mealPlanData, error: mealPlanError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('id', mealPlanId)
          .single();

        if (mealPlanError) {
          Alert.alert('Error', mealPlanError.message);
          return;
        }

        // Set other meal plan details
        setMealPlanName(mealPlanData.name);
        setMealPlanDescription(mealPlanData.description);
        setGoal(mealPlanData.goal); // Set goal from the database

        // Set isFree correctly based on is_premium from the database
        setIsFree(!mealPlanData.is_premium);

        const { data: mealData, error: mealError } = await supabase
          .from('meal_plan_meals')
          .select('recipe_meals(*)')
          .eq('meal_plan_id', mealPlanId);

        if (mealError) {
          Alert.alert('Error', mealError.message);
          return;
        }

        const formattedMeals = mealData.map((item: any) => item.recipe_meals);
        setMeals(formattedMeals);
      }
    };

    fetchData();
  }, [mealPlanId]);

  useEffect(() => {
    const fetchSelectedMeals = async () => {
      const selectedMealIds = route.params?.selectedMealIds;
      if (selectedMealIds && selectedMealIds.length > 0) {
        const { data, error } = await supabase
          .from('recipe_meals')
          .select('*')
          .in('id', selectedMealIds);

        if (error) {
          Alert.alert('Error', error.message);
          return;
        }

        setMeals(data || []);
      }
    };

    fetchSelectedMeals();
  }, [route.params?.selectedMealIds]);

  const totalMeals = meals.length;
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalFats = meals.reduce((sum, meal) => sum + meal.fats, 0);

  const totalMacros = totalCarbs + totalProtein + totalFats;
  const carbsPercentage = totalMacros ? ((totalCarbs / totalMacros) * 100).toFixed(1) : '0';
  const proteinPercentage = totalMacros ? ((totalProtein / totalMacros) * 100).toFixed(1) : '0';
  const fatsPercentage = totalMacros ? ((totalFats / totalMacros) * 100).toFixed(1) : '0';

  const saveMealPlan = async () => {
    if (!mealPlanName) {
      Alert.alert('Error', 'Please enter a name for the meal plan');
      return;
    }

    if (meals.length === 0) {
      Alert.alert('Error', 'Please add at least one meal to the plan');
      return;
    }

    try {
      if (isEditMode && mealPlanId) {
        // Update existing meal plan
        const { error: updateError } = await supabase
          .from('meal_plans')
          .update({
            name: mealPlanName,
            description: mealPlanDescription,
            total_calories: totalCalories,
            total_carbs: totalCarbs,
            total_protein: totalProtein,
            total_fats: totalFats,
            is_premium: !isFree,
            goal, // Ensure the goal is being updated
          })
          .eq('id', mealPlanId);

        if (updateError) {
          Alert.alert('Error', 'Failed to update the meal plan');
          return;
        }

        const { error: deleteError } = await supabase
          .from('meal_plan_meals')
          .delete()
          .eq('meal_plan_id', mealPlanId);

        if (deleteError) {
          Alert.alert('Error', 'Failed to delete existing meals associated with the meal plan');
          return;
        }

        const mealPlanMealsData = meals.map((meal) => ({
          meal_plan_id: mealPlanId,
          recipe_meal_id: meal.id,
        }));

        const { error: mealInsertError } = await supabase
          .from('meal_plan_meals')
          .insert(mealPlanMealsData);

        if (mealInsertError) {
          Alert.alert('Error', 'Failed to add new meals to the meal plan');
          return;
        }

        Alert.alert('Success', 'Meal plan updated successfully!');
      } else {
        // Insert new meal plan
        const { data: mealPlanData, error: insertError } = await supabase
          .from('meal_plans')
          .insert([
            {
              name: mealPlanName,
              description: mealPlanDescription,
              total_calories: totalCalories,
              total_carbs: totalCarbs,
              total_protein: totalProtein,
              total_fats: totalFats,
              is_premium: !isFree,
              goal, // Ensure the goal is being inserted
            },
          ])
          .select();

        if (insertError) {
          Alert.alert('Error', 'Failed to create new meal plan');
          return;
        }

        const newMealPlanId = mealPlanData[0]?.id;

        if (!newMealPlanId) {
          Alert.alert('Error', 'Failed to retrieve new meal plan ID');
          return;
        }

        const mealPlanMealsData = meals.map((meal) => ({
          meal_plan_id: newMealPlanId,
          recipe_meal_id: meal.id,
        }));

        const { error: mealInsertError } = await supabase
          .from('meal_plan_meals')
          .insert(mealPlanMealsData);

        if (mealInsertError) {
          Alert.alert('Error', 'Failed to add meals to the new meal plan');
          return;
        }

        Alert.alert('Success', 'Meal plan saved successfully!');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const navigateToAddMeals = () => {
    const selectedMealIds = meals.map((meal) => parseInt(meal.id, 10));
    navigation.navigate('AdminAddMealsScreen', { mealPlanId: mealPlanId, selectedMealIds: selectedMealIds });
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Meal Plan' : 'Add New Meal Plan'}
          </Text>
        </View>

        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Meal Plan Overview</Text>
          <Text style={styles.breakdownText}>Total Meals: {totalMeals}</Text>
          <Text style={styles.breakdownText}>Total Calories: {totalCalories} kcal</Text>
          <View style={styles.macrosRow}>
            <Text style={styles.breakdownText}>Carbs: {totalMeals > 0 ? `${carbsPercentage}%` : '0%'}</Text>
            <Text style={styles.breakdownText}>Protein: {totalMeals > 0 ? `${proteinPercentage}%` : '0%'}</Text>
            <Text style={styles.breakdownText}>Fats: {totalMeals > 0 ? `${fatsPercentage}%` : '0%'}</Text>
          </View>
        </View>

        <FlatList
          ListHeaderComponent={
            <>
              <Text style={styles.sectionTitle}>Meal Plan Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Meal Plan Name"
                placeholderTextColor="#aaa"
                value={mealPlanName}
                onChangeText={setMealPlanName}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#aaa"
                value={mealPlanDescription}
                onChangeText={setMealPlanDescription}
                multiline
                numberOfLines={4}
              />

              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Free Plan:</Text>
                <Switch
                  value={isFree}
                  onValueChange={(value) => setIsFree(value)}
                />
              </View>

              <View style={styles.goalContainer}>
                <Text style={styles.sectionTitle}>Goal</Text>
                <Picker
                  selectedValue={goal}
                  onValueChange={(itemValue) => setGoal(itemValue)}
                >
                  <Picker.Item label="Weight Loss" value="weight_loss" />
                  <Picker.Item label="Muscle Gain" value="muscle_gain" />
                  <Picker.Item label="Endurance" value="endurance" />
                  <Picker.Item label="Flexibility" value="flexibility" />
                  <Picker.Item label="General Fitness" value="general_fitness" />
                </Picker>
              </View>

              <Text style={styles.sectionTitle}>Meals Added</Text>
              {totalMeals === 0 && (
                <Text style={styles.noMealsText}>No meals added yet</Text>
              )}
            </>
          }
          data={meals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.mealItem}>
              <Text style={styles.mealName}>{item.name}</Text>
              <Text style={styles.mealDetails}>Calories: {item.calories} kcal</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionText}>Carbs: {item.carbs}g</Text>
                <Text style={styles.nutritionText}>Protein: {item.protein}g</Text>
                <Text style={styles.nutritionText}>Fats: {item.fats}g</Text>
              </View>
            </View>
          )}
          ListFooterComponent={
            <>
              <TouchableOpacity
                style={styles.addMealButton}
                onPress={navigateToAddMeals}
              >
                <Ionicons name="add-circle" size={wp('6%')} color="#fff" />
                <Text style={styles.addMealButtonText}>Add Meals to Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveMealPlan}>
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Update Meal Plan' : 'Save Meal Plan'}
                </Text>
              </TouchableOpacity>
            </>
          }
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: wp('4%'),
  },
  header: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
    elevation: 3,
  },
  backButton: {
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  breakdownContainer: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  breakdownTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
  },
  breakdownText: {
    fontSize: wp('4%'),
    color: '#555',
    marginRight: wp('4%'),
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontSize: wp('4%'),
    color: '#333',
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: hp('15%'),
    textAlignVertical: 'top',
  },
  mealItem: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealName: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  mealDetails: {
    fontSize: wp('3.5%'),
    color: '#555',
  },
  noMealsText: {
    fontSize: wp('4%'),
    color: '#888',
    marginTop: hp('1%'),
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7043',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    marginBottom: hp('2%'),
    elevation: 3,
  },
  addMealButtonText: {
    fontSize: wp('4%'),
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    fontSize: wp('4%'),
    color: '#fff',
    fontWeight: 'bold',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('0.5%'),
  },
  nutritionText: {
    fontSize: wp('3.5%'),
    color: '#555',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  toggleLabel: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#333',
    marginRight: wp('2%'),
  },
  goalContainer: {
    marginBottom: hp('2%'),
  },
});

export default AdminAddMealPlanScreen;
