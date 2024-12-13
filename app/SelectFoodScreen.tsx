import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, Button, TextInput, ImageBackground } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

type FoodItem = {
  fdcId: number;
  description: string;
  brandName?: string;
  food_item_name?: string;
  meal_type?: string;
  calories?: number;
  foodNutrients?: { nutrientName: string; value: number }[];
  protein?: number;
  carbs?: number;
  fats?: number;
  isRecent?: boolean;
};

type RootStackParamList = {
  NutritionScreen: { selectedFood?: string; mealType?: string; date?: string };
  SelectFoodScreen: { mealType: string; date: string };
};

type SelectFoodScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SelectFoodScreen'>;
type SelectFoodScreenRouteProp = RouteProp<RootStackParamList, 'SelectFoodScreen'>;

type Props = {
  route: SelectFoodScreenRouteProp;
  navigation: SelectFoodScreenNavigationProp;
};

const API_KEY = 'ojRl5vpo3fagfJwAKTCHPByO7YewPczzfSQeUgDy';

const SelectFoodScreen: React.FC<Props> = ({ route, navigation }) => {
  const { mealType } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);

  const fetchRecentFoods = async () => {
    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !user.user) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const userId = user.user.id;

      const { data: recentData, error } = await supabase
        .from('recent_meals')
        .select('food_item_name, meal_type, calories, protein, carbs, fats')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent meals:', error.message);
      } else {
        const transformedData = recentData.map((item: any) => ({
          fdcId: 0,
          description: item.food_item_name,
          food_item_name: item.food_item_name,
          meal_type: item.meal_type,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fats: item.fats,
          foodNutrients: [],
        }));
        setRecentFoods(transformedData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch recent meals.');
    }
  };

  const fetchRecipeMeals = async (query: string) => {
    try {
      const { data: recipeMealsData, error } = await supabase
        .from('recipe_meals')
        .select('id, name, ingredients, instructions, image_base64, calories, carbs, protein, fats, serving_size')
        .ilike('name', `%${query}%`); // Use case-insensitive search
  
      if (error) {
        console.error('Error fetching recipe meals:', error.message);
        return [];
      }
  
      // Transform the data to match the `FoodItem` structure
      return recipeMealsData.map((item: any) => ({
        fdcId: item.id,
        description: item.name,
        food_item_name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
        image_base64: item.image_base64,
        ingredients: item.ingredients,
        instructions: item.instructions,
        foodNutrients: [
          { nutrientName: 'Energy', value: item.calories || 0 },
          { nutrientName: 'Protein', value: item.protein || 0 },
          { nutrientName: 'Carbohydrate, by difference', value: item.carbs || 0 },
          { nutrientName: 'Total lipid (fat)', value: item.fats || 0 },
        ],
      }));
    } catch (error) {
      console.error('Unexpected error fetching recipe meals:', error);
      return [];
    }
  };
  
  useEffect(() => {
    fetchRecentFoods();
    fetchRecipeMeals('');
  }, []);  

  const fetchOrCreateNutritionId = async (date: string): Promise<number | null> => {
    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user || !user.user) {
        Alert.alert('Error', 'User not found');
        return null;
      }

      const userId = user.user.id;

      // Fetch the daily nutrition record for the current user on the selected date
      const { data: nutritionData, error: nutritionError } = await supabase
        .from('daily_nutrition')
        .select('id')
        .eq('date', date)
        .eq('user_id', userId) // Make sure you filter by the current user's ID
        .single();

      if (nutritionError && nutritionError.code !== 'PGRST116') {
        Alert.alert('Error', 'Failed to fetch nutrition data.');
        return null;
      }

      if (nutritionData) {
        // Return the existing nutrition record ID for the current user
        return nutritionData.id;
      } else {
        // Insert a new nutrition record for the current user if none exists
        const { data: newNutritionData, error: insertError } = await supabase
          .from('daily_nutrition')
          .insert([{ date, user_id: userId }])
          .select('id')
          .single();

        if (insertError) {
          Alert.alert('Error', 'Failed to create new nutrition record.');
          return null;
        }

        return newNutritionData.id;
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
      return null;
    }
  };

  const searchFood = async () => {
    try {
      setRecentFoods([]); // Clear recent foods when searching
      const usdaResults = await fetchUsdaFood(); // Fetch from USDA API
      const recipeMealsResults = await fetchRecipeMeals(searchQuery); // Pass searchQuery here
  
      // Combine USDA and recipe_meals results
      const combinedResults = [...recipeMealsResults, ...usdaResults];
      setFoodResults(combinedResults);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch food data.');
    }
  };   

  const fetchUsdaFood = async () => {
    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${searchQuery}&api_key=${API_KEY}`
      );
      const data = await response.json();
      return data.foods || [];
    } catch (error) {
      console.error('Error fetching USDA food:', error);
      return [];
    }
  };
  

  const onSelectFood = (item: FoodItem, isRecent: boolean = false) => {
    const selectedItem = {
      ...item,
      isRecent,
      foodNutrients: item.foodNutrients || [
        { nutrientName: 'Energy', value: item.calories || 0 },
        { nutrientName: 'Protein', value: item.protein || 0 },
        { nutrientName: 'Carbohydrate, by difference', value: item.carbs || 0 },
        { nutrientName: 'Total lipid (fat)', value: item.fats || 0 },
      ],
      calories: item.foodNutrients?.find(nutrient => nutrient.nutrientName === 'Energy')?.value || item.calories || 0,
      protein: item.foodNutrients?.find(nutrient => nutrient.nutrientName === 'Protein')?.value || item.protein || 0,
      carbs: item.foodNutrients?.find(nutrient => nutrient.nutrientName === 'Carbohydrate, by difference')?.value || item.carbs || 0,
      fats: item.foodNutrients?.find(nutrient => nutrient.nutrientName === 'Total lipid (fat)')?.value || item.fats || 0,
    };
    setSelectedFood(selectedItem);
    setModalVisible(true);
  };

  const uploadFoodToDatabase = async () => {
    if (!selectedFood) {
      Alert.alert('Error', 'No food item selected.');
      return;
    }

    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    const userId = user.user.id;
    const formattedDate = route.params.date || new Date().toISOString().split('T')[0];

    const nutritionId = await fetchOrCreateNutritionId(formattedDate);
    if (!nutritionId) {
      Alert.alert('Error', 'Failed to fetch or create nutrition record.');
      return;
    }

    const calories = selectedFood.calories || 0;
    const protein = selectedFood.protein || 0;
    const carbs = selectedFood.carbs || 0;
    const fats = selectedFood.fats || 0;

    try {
      // Upload to meals table
      const { error: insertError } = await supabase.from('meals').insert([
        {
          meal_type: mealType,
          food_item_name: selectedFood.description,
          calories: calories * quantity,
          protein: protein * quantity,
          carbs: carbs * quantity,
          fats: fats * quantity,
          quantity: quantity,
          nutrition_id: nutritionId,
          user_id: userId,
        },
      ]);

      if (insertError) {
        Alert.alert('Error', `Failed to upload food: ${insertError.message}`);
        return;
      }

      // Check if the recent meal already exists for the current user
      const { data: existingMeal, error: fetchError } = await supabase
        .from('recent_meals')
        .select('id')
        .eq('user_id', userId)
        .eq('food_item_name', selectedFood.description)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        Alert.alert('Error', 'Failed to check for existing recent meal.');
        return;
      }

      if (!existingMeal) {
        // Insert into recent_meals if the meal doesn't already exist
        const { error: recentMealsError } = await supabase.from('recent_meals').insert([
          {
            user_id: userId,
            food_item_name: selectedFood.description,
            meal_type: mealType,
            calories: calories * quantity,
            protein: protein * quantity,
            carbs: carbs * quantity,
            fats: fats * quantity,
            created_at: new Date().toISOString(),
          },
        ]);

        if (recentMealsError) {
          Alert.alert('Error', `Failed to upload to recent meals: ${recentMealsError.message}`);
          return;
        }
      }

      setModalVisible(false);
      navigation.navigate('NutritionScreen', { selectedFood: selectedFood.description, mealType });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload food. Please try again.');
    }
  };

  return (
    <ImageBackground source={require('../assets/food.png')} style={styles.background}>
      <View style={styles.overlay} />
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={wp('6%')} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Select Food for {mealType}</Text>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for food..."
          placeholderTextColor="#000"
          style={styles.searchInput}
        />
        <Button title="Search" onPress={searchFood} color="#ff6b6b" />

        {recentFoods.length > 0 && (
          <>
            <Text style={styles.recentTitle}>Recent Foods</Text>
            <FlatList
              data={recentFoods}
              keyExtractor={(item) => item.food_item_name || item.fdcId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelectFood(item)} style={styles.card}>
                  <Text style={styles.foodName}>{item.food_item_name}</Text>
                  <Text style={styles.foodDetails}>
                    Meal Type: {item.meal_type} | Calories: {item.calories} kcal
                  </Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        <FlatList
          data={foodResults}
          keyExtractor={(item) => item.fdcId.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onSelectFood(item)} style={styles.card}>
              <Text style={styles.foodName}>{item.description}</Text>
              <Text style={styles.foodDetails}>
                {item.food_item_name ? `Recipe` : `Brand: ${item.brandName || 'Unspecified'}`} | Calories: {item.calories || 'N/A'} kcal
              </Text>
            </TouchableOpacity>
          )}
        />

        {selectedFood && (
          <Modal visible={isModalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Quantity for {selectedFood.description}</Text>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity((prevQuantity) => Math.max(1, prevQuantity - 1))}
                  >
                    <Ionicons name="remove-circle-outline" size={wp('8%')} color="#ff6b6b" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity((prevQuantity) => prevQuantity + 1)}
                  >
                    <Ionicons name="add-circle-outline" size={wp('8%')} color="#4caf50" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.confirmButton} onPress={uploadFoodToDatabase}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    padding: wp('5%'),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
    marginTop: hp('3%'),
  },
  backButtonText: {
    fontSize: wp('4.5%'),
    marginLeft: wp('2%'),
    color: '#fff',
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    marginBottom: hp('2%'),
    textAlign: 'center',
    color: '#fff',
  },
  searchInput: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  card: {
    backgroundColor: '#fff',
    padding: wp('4%'),
    borderRadius: 15,
    marginVertical: hp('1%'),
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  foodName: {
    fontSize: wp('5%'),
    color: '#333',
    fontWeight: '600',
  },
  foodDetails: {
    fontSize: wp('4%'),
    color: '#7f8c8d',
    marginTop: hp('0.5%'),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: wp('85%'),
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp('6%'),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    marginBottom: hp('3%'),
    color: '#333',
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  quantityButton: {
    marginHorizontal: wp('3%'),
  },
  quantityText: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#333',
    width: wp('12%'),
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('15%'),
    borderRadius: 25,
    marginBottom: hp('2%'),
  },
  confirmButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('15%'),
    borderRadius: 25,
  },
  cancelButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  recentTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
    color: '#fff',
    textAlign: 'center',
  },
});

export default SelectFoodScreen;
