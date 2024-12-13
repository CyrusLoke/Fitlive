import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Platform, Alert, Modal, RefreshControl } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'super_active';

const calculateRecommendedIntake = (age: number, gender: string, height: number, weight: number, activityLevel: ActivityLevel, goal: string) => {
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    super_active: 1.9,
  };

  let BMR;
  if (gender === 'male') {
    BMR = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    BMR = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const TDEE = BMR * activityMultipliers[activityLevel];

  let calories, proteinMultiplier;
  switch (goal) {
    case 'weight_loss':
      calories = TDEE * 0.8;
      proteinMultiplier = 2.0;
      break;
    case 'muscle_gain':
      calories = TDEE * 1.15;
      proteinMultiplier = 2.2;
      break;
    case 'endurance':
      calories = TDEE * 1.0;
      proteinMultiplier = 1.8;
      break;
    case 'flexibility':
      calories = TDEE * 1.0;
      proteinMultiplier = 1.6;
      break;
    case 'general_fitness':
      calories = TDEE * 1.0;
      proteinMultiplier = 1.8;
      break;
    default:
      calories = TDEE;
      proteinMultiplier = 1.8;
  }

  const protein = weight * proteinMultiplier;
  const fats = (calories * 0.3) / 9;
  const carbs = (calories - (protein * 4 + fats * 9)) / 4;

  return { calories, protein, carbs, fats };
};

const NutritionScreen: React.FC = () => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [mealData, setMealData] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'NutritionScreen'>>();

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const fetchUserId = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (data && data.user) {
      setUserId(data.user.id);
    } else {
      Alert.alert('Error', 'Unable to fetch user information.');
    }
  };

  const fetchUserProfile = async () => {
    if (!userId) return;
    const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single();
    if (profile) {
      setUserProfile(profile);
    } else {
      Alert.alert('Error', 'Unable to fetch user profile.');
    }
  };

  const fetchNutritionData = async () => {
    if (!userId) return;

    const formattedDate = date.toISOString().split('T')[0];
    const { data: nutrition, error } = await supabase
      .from('daily_nutrition')
      .select('id, total_calories, total_protein, total_carbs, total_fats, water_intake')
      .eq('user_id', userId)
      .eq('date', formattedDate)
      .maybeSingle();

    if (nutrition) {
      setNutritionData(nutrition);
      setWaterIntake(nutrition.water_intake || 0);
      fetchMealData(nutrition.id);
    } else {
      setNutritionData(null);
      setMealData([]);
      setWaterIntake(0);
    }
  };

  const fetchMealData = async (nutritionId: number) => {
    if (!nutritionId) return;

    const { data: meals, error } = await supabase
      .from('meals')
      .select('id, meal_type, food_item_name, calories, protein, carbs, fats')
      .eq('nutrition_id', nutritionId);

    if (error) {
      Alert.alert('Error', 'Unable to fetch meals data.');
      return;
    }

    if (meals && meals.length > 0) {
      setMealData(meals);
      const totalMacros = meals.reduce(
        (totals, meal) => {
          totals.calories += meal.calories || 0;
          totals.protein += meal.protein || 0;
          totals.carbs += meal.carbs || 0;
          totals.fats += meal.fats || 0;
          return totals;
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
      await updateDailyNutrition(totalMacros);
    } else {
      setMealData([]);
      await updateDailyNutrition({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    }
  };

  const updateDailyNutrition = async (totals: { calories: number, protein: number, carbs: number, fats: number }) => {
    if (!userId || !nutritionData) return;

    const formattedDate = date.toISOString().split('T')[0];

    const { error: updateError } = await supabase
      .from('daily_nutrition')
      .update({
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein),
        total_carbs: Math.round(totals.carbs),
        total_fats: Math.round(totals.fats),
      })
      .eq('user_id', userId)
      .eq('date', formattedDate);

    if (updateError) {
      Alert.alert('Error', 'Failed to update daily nutrition totals.');
    }
  };

  const updateWaterIntake = async (newWaterIntake: number) => {
    if (!userId) return;
    const formattedDate = date.toISOString().split('T')[0];
    const { data: existingRecord } = await supabase
      .from('daily_nutrition')
      .select('*')
      .eq('user_id', userId)
      .eq('date', formattedDate)
      .single();
    if (existingRecord) {
      await supabase
        .from('daily_nutrition')
        .update({ water_intake: newWaterIntake })
        .eq('user_id', userId)
        .eq('date', formattedDate);
      setWaterIntake(newWaterIntake);
    } else {
      await supabase
        .from('daily_nutrition')
        .insert({ user_id: userId, date: formattedDate, water_intake: newWaterIntake });
      setWaterIntake(newWaterIntake);
    }
  };

  const incrementWaterIntake = async () => {
    const newWaterIntake = waterIntake + 1;
    await updateWaterIntake(newWaterIntake);
    await fetchNutritionData();
  };

  const decrementWaterIntake = async () => {
    const newWaterIntake = Math.max(waterIntake - 1, 0);
    await updateWaterIntake(newWaterIntake);
    await fetchNutritionData();
  };

  const deleteMeal = async (mealId: number) => {
    if (!nutritionData?.id) return;
    try {
      const { error: deleteError } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (deleteError) {
        Alert.alert('Error', 'Unable to delete meal.');
        return;
      }

      // Refresh meal data and nutrition data after deletion
      await fetchMealData(nutritionData.id);
      await fetchNutritionData();
    } catch (error) {
      console.log('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserProfile();
    await fetchNutritionData();
    setRefreshing(false);
  }, [userId, date]);

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [onRefresh])
  );

  useEffect(() => {
    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNutritionData();
    }
  }, [date, userId]);

  useEffect(() => {
    if (route.params?.selectedFood && nutritionData) {
      fetchMealData(nutritionData.id);
    }
  }, [route.params?.selectedFood, nutritionData]);

  const recommendedIntake = userProfile
    ? calculateRecommendedIntake(userProfile.age, userProfile.gender, userProfile.height, userProfile.weight, userProfile.activity_level, userProfile.goal)
    : { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const getMealsByType = (type: string) => {
    return mealData.filter((meal) => meal.meal_type && meal.meal_type.toLowerCase() === type.toLowerCase());
  };

  return (
    <ImageBackground source={require('../assets/food.png')} style={styles.backgroundImage}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition Tracker</Text>
          <TouchableOpacity onPress={() => setShowInfoModal(true)} style={styles.infoIcon}>
            <Ionicons name="information-circle-outline" size={24} color="#FF6347" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.boxContainer} onPress={showDatepicker}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar-outline" size={24} color="#2980B9" style={styles.icon} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <Text style={styles.dateText}>{date.toDateString()}</Text>
          {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />}
        </TouchableOpacity>

        <View style={styles.boxContainer}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="fire" size={24} color="#E74C3C" style={styles.icon} />
            <Text style={styles.sectionTitle}>Calories</Text>
          </View>
          <Text style={styles.caloriesText}>
            {nutritionData?.total_calories || 0} / {recommendedIntake.calories.toFixed(0)} kcal
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${(nutritionData?.total_calories || 0) / recommendedIntake.calories * 100}%` }]} />
          </View>
        </View>

        <View style={styles.boxContainer}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="bar-chart-outline" size={24} color="#8E44AD" style={styles.icon} />
            <Text style={styles.sectionTitle}>Today's Macros</Text>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{nutritionData?.total_protein || 0}g / {recommendedIntake.protein.toFixed(0)}g</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(nutritionData?.total_protein || 0) / recommendedIntake.protein * 100}%` }]} />
            </View>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{nutritionData?.total_carbs || 0}g / {recommendedIntake.carbs.toFixed(0)}g</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(nutritionData?.total_carbs || 0) / recommendedIntake.carbs * 100}%` }]} />
            </View>
          </View>

          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>{nutritionData?.total_fats || 0}g / {recommendedIntake.fats.toFixed(0)}g</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${(nutritionData?.total_fats || 0) / recommendedIntake.fats * 100}%` }]} />
            </View>
          </View>
        </View>

        {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((mealType) => {
          let iconName, iconColor;
          switch (mealType) {
            case 'Breakfast':
              iconName = 'egg';
              iconColor = '#f39c12';
              break;
            case 'Lunch':
              iconName = 'hamburger';
              iconColor = '#27ae60';
              break;
            case 'Dinner':
              iconName = 'drumstick-bite';
              iconColor = '#c0392b';
              break;
            case 'Snacks':
              iconName = 'cookie';
              iconColor = '#E67E22';
              break;
            default:
              iconName = 'utensils';
              iconColor = '#34495e';
          }

          return (
            <View key={mealType} style={styles.boxContainer}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5 name={iconName} size={24} color={iconColor} style={styles.icon} />
                <Text style={styles.sectionTitle}>{mealType}</Text>
              </View>
              {getMealsByType(mealType).length > 0 ? (
                getMealsByType(mealType).map((meal, index) => (
                  <View key={index} style={styles.mealItem}>
                    <Text style={styles.foodItem}>
                      {meal.food_item_name} - Calories: {meal.calories}
                    </Text>
                    <TouchableOpacity onPress={() => deleteMeal(meal.id)}>
                      <Ionicons name="trash-bin-outline" size={24} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.placeholderText}>Nothing here yet, start by adding a meal!</Text>
              )}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: iconColor }]}
                onPress={() => {
                  (navigation as any).navigate('SelectFoodScreen', { mealType, date: date.toISOString().split('T')[0] });
                  fetchNutritionData();
                }}
              >
                <Text style={styles.addButtonText}>Add {mealType}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.boxContainer}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="water" size={24} color="#3498DB" style={styles.icon} />
            <Text style={styles.sectionTitle}>Water Intake</Text>
          </View>

          {nutritionData ? (
            <>
              <Text style={styles.placeholderText}>{waterIntake} / 8 glasses</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${Math.min((waterIntake / 8) * 100, 100)}%` }]} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.placeholderText}>0 / 8 glasses</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '0%' }]} />
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={decrementWaterIntake} style={styles.waterButton}>
              <Text style={styles.waterButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={incrementWaterIntake} style={styles.waterButton}>
              <Text style={styles.waterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.footerButton}
            onPress={() => (navigation as any).navigate('NutritionGraphScreen')}
          >
            <Text style={styles.footerButtonText}>View Nutrition Graph</Text>
          </TouchableOpacity>
        </View>

        <Modal animationType="slide" transparent={true} visible={showInfoModal} onRequestClose={() => setShowInfoModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>How We Calculate Your Suggested Nutrition</Text>
              <ScrollView>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: 'bold' }}>1. Calories:</Text>
                  {'\n'}Based on your Basal Metabolic Rate (BMR), calculated using your age, gender, weight, and height.
                  {'\n'}Activity level determines how many calories you burn daily.
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: 'bold' }}>2. Macros (Protein, Carbs, Fats):</Text>
                  {'\n'}These are adjusted according to your goal. Higher protein for muscle gain, balanced macros for general fitness.
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: 'bold' }}>3. Goals:</Text>
                  {'\n'}- Weight Loss: Caloric intake is reduced by 20%.
                  {'\n'}- Muscle Gain: Caloric intake is increased by 15%.
                  {'\n'}- Endurance: Balanced macros with more carbohydrates.
                  {'\n'}- Flexibility and General Fitness: Balanced intake.
                </Text>
              </ScrollView>
              <TouchableOpacity onPress={() => setShowInfoModal(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    padding: wp('5%'), 
    flexGrow: 1,
    width: '100%',
    backgroundColor: '#F5DEB3',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#2c3e50',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
    marginTop: hp('3%'),
  },
  boxContainer: {
    marginBottom: hp('2%'),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: wp('4%'),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    width: '100%',
  },
  dateText: {
    fontSize: wp('4.5%'),
    color: '#34495e',
    textAlign: 'center',
    fontWeight: '600',
  },
  caloriesText: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: hp('1%'),
  },
  progressBarContainer: {
    backgroundColor: '#D3D3D3',
    height: hp('1%'),
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: hp('0.5%'),
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#27ae60',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: wp('2%'),
  },
  macroItem: {
    marginBottom: hp('2%'),
  },
  macroLabel: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#8e44ad',
    marginBottom: hp('0.5%'),
  },
  macroValue: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#34495e',
  },
  foodItem: {
    fontSize: wp('4.5%'),
    color: '#34495e',
    marginBottom: hp('1%'),
    maxWidth: '90%',
  },
  placeholderText: {
    fontSize: wp('4%'),
    color: '#95a5a6',
    marginBottom: hp('2%'),
    fontStyle: 'italic',
  },
  icon: {
    marginRight: wp('2%'),
  },
  addButton: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'), 
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  footerButton: {
    backgroundColor: '#8e44ad',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('10%'),
    borderRadius: 8,
    width: '100%',
  },
  footerButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: wp('80%'),
    backgroundColor: 'white',
    padding: wp('5%'),
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginBottom: hp('1.5%'),
  },
  modalText: {
    fontSize: wp('4%'),
    marginBottom: hp('1%'),
    color: '#333',
    lineHeight: hp('3%'),
    textAlign: 'justify',
  },
  modalCloseButton: {
    marginTop: hp('1.5%'),
    backgroundColor: '#27ae60',
    padding: wp('3%'),
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  waterButton: {
    backgroundColor: '#2980b9',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    borderRadius: 8,
    marginHorizontal: wp('2%'), 
  },
  waterButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: hp('1%'),
  },
  infoIcon: {
    marginTop: hp('3%'),
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default NutritionScreen;
