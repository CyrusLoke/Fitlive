import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ImageBackground } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

type MealPlanDetailScreenRouteProp = RouteProp<RootStackParamList, 'MealPlanDetailScreen'>;
type MealPlanDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MealPlanDetailScreen'>;

interface RecipeMeal {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  description: string;
  image_base64: string;
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  serving_size: string;
}

const MealPlanDetailScreen: React.FC = () => {
  const navigation = useNavigation<MealPlanDetailScreenNavigationProp>();
  const route = useRoute<MealPlanDetailScreenRouteProp>();
  const mealPlanId = route.params?.mealPlanId as unknown as number;

  const [mealPlanName, setMealPlanName] = useState<string>('');
  const [totalCalories, setTotalCalories] = useState<number>(0);
  const [totalProtein, setTotalProtein] = useState<number>(0);
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [totalFats, setTotalFats] = useState<number>(0);
  const [recipeMeals, setRecipeMeals] = useState<RecipeMeal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions'>('overview');
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [mealPlanDescription, setMealPlanDescription] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  
  const handleBookmark = async () => {
    const { data: userData } = await supabase.auth.getSession();
    const userId = userData?.session?.user?.id;
  
    if (!userId) {
      console.error('User not logged in');
      return;
    }
  
    try {
      if (isBookmarked) {
        // Remove meal plan from user's My Plans
        const { error: deleteError } = await supabase
          .from('user_meal_plans')
          .delete()
          .eq('user_id', userId)
          .eq('meal_plan_id', mealPlanId);
  
        if (deleteError && deleteError instanceof Error) {
          throw deleteError;
        }
  
        setIsBookmarked(false);
        Toast.show({
          type: 'success',
          text1: 'Removed',
          text2: 'Meal plan removed from My Plan List.',
        });
      } else {
        // Add meal plan to user's My Plans
        const { error: insertError } = await supabase
          .from('user_meal_plans')
          .insert([{ user_id: userId, meal_plan_id: mealPlanId }]);
  
        if (insertError && insertError instanceof Error) {
          throw insertError;
        }
  
        setIsBookmarked(true);
        Toast.show({
          type: 'success',
          text1: 'Added',
          text2: 'Meal plan added to My Plan List.',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error handling bookmark:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An error occurred. Please try again.',
        });
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };
  
  const checkIfBookmarked = async () => {
    const { data: userData } = await supabase.auth.getSession();
    const userId = userData?.session?.user?.id;

    if (!userId) return;

    const { data, error } = await supabase
      .from('user_meal_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_plan_id', mealPlanId)
      .single();

    if (!error && data) {
      setIsBookmarked(true);
    }
  };

  useEffect(() => {
    if (mealPlanId) {
      fetchMealPlanDetails();
      checkIfBookmarked();
    }
  }, [mealPlanId]);

  const fetchMealPlanDetails = async () => {
    setLoading(true);
    try {
      // Fetch meal plan details
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from('meal_plans')
        .select('name, description, total_calories, total_protein, total_carbs, total_fats, goal')
        .eq('id', mealPlanId)
        .single();

      if (mealPlanError) throw mealPlanError;

      setMealPlanName(mealPlanData?.name || '');
      setTotalCalories(mealPlanData?.total_calories || 0);
      setTotalProtein(mealPlanData?.total_protein || 0);
      setTotalCarbs(mealPlanData?.total_carbs || 0);
      setTotalFats(mealPlanData?.total_fats || 0);
      setMealPlanDescription(mealPlanData?.description || '');
      setGoal(mealPlanData?.goal || '');

      // Fetch recipe meal IDs from meal_plan_meals table
      const { data: mealPlanMealsData, error: mealPlanMealsError } = await supabase
        .from('meal_plan_meals')
        .select('recipe_meal_id')
        .eq('meal_plan_id', mealPlanId);

      if (mealPlanMealsError) throw mealPlanMealsError;

      const recipeMealIds = mealPlanMealsData.map((item) => item.recipe_meal_id);

      // Fetch recipe details from recipe_meals table
      const { data: recipeMealsData, error: recipeMealsError } = await supabase
        .from('recipe_meals')
        .select('id, name, ingredients, instructions, description, image_base64, calories, carbs, protein, fats, serving_size')
        .in('id', recipeMealIds);

      if (recipeMealsError) throw recipeMealsError;

      setRecipeMeals(recipeMealsData || []);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching meal plan details:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mealPlanId) {
      fetchMealPlanDetails();
    }
  }, [mealPlanId]);

  const toggleExpansion = (mealId: number) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  const renderContent = () => {
    return recipeMeals.map((meal) => {
      // Parse the ingredients JSON
      let parsedIngredients: { name: string; quantity: string; unit: string }[] = [];
      try {
        parsedIngredients = JSON.parse(meal.ingredients);
      } catch (error) {
        console.error('Error parsing ingredients JSON:', error);
      }

      return (
        <TouchableOpacity key={meal.id} onPress={() => toggleExpansion(meal.id)} style={styles.recipeContainer}>
          <View style={styles.mealRow}>
            <Image source={{ uri: `data:image/png;base64,${meal.image_base64}` }} style={styles.mealImage} />
            <View style={styles.mealDetails}>
              <Text style={styles.recipeTitle}>{meal.name}</Text>
              {expandedMealId === meal.id && activeTab === 'overview' && (
                <View>
                  <Text style={styles.descriptionText}>{meal.description}</Text>
                  <Text style={styles.nutritionText}>Serving Size: {meal.serving_size}</Text>
                  <Text style={styles.nutritionText}>Calories: {meal.calories} kcal</Text>
                  <Text style={styles.nutritionText}>Carbs: {meal.carbs} g</Text>
                  <Text style={styles.nutritionText}>Protein: {meal.protein} g</Text>
                  <Text style={styles.nutritionText}>Fats: {meal.fats} g</Text>
                </View>
              )}
              {expandedMealId === meal.id && activeTab === 'ingredients' && (
                <View>
                  {parsedIngredients.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredientText}>
                      • {ingredient.quantity} {ingredient.unit} {ingredient.name}
                    </Text>
                  ))}
                </View>
              )}
              {expandedMealId === meal.id && activeTab === 'instructions' && (
                <Text style={styles.instructionText}>{meal.instructions}</Text>
              )}
            </View>
            <Ionicons
              name={expandedMealId === meal.id ? 'chevron-up' : 'chevron-down'}
              size={wp('6%')}
              color="#666"
            />
          </View>
        </TouchableOpacity>
      );
    });
  };

  return (
    <ImageBackground source={require('../assets/recipe.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('7%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Meal Plan Details</Text>
          <TouchableOpacity onPress={handleBookmark}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={wp('7%')}
              color={isBookmarked ? '#DC143C' : '#333'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.mealPlanName}>{mealPlanName}</Text>
          {mealPlanDescription ? (
            <Text style={styles.mealPlanDescription}>{mealPlanDescription}</Text>
          ) : null}
          {goal ? (
            <Text style={styles.goalText}>Goal: {goal.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}</Text>
          ) : null}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="flame-outline" size={wp('6%')} color="#FF6347" />
            <Text style={styles.statValue}>{totalCalories} kcal</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="nutrition-outline" size={wp('6%')} color="#32CD32" />
            <Text style={styles.statValue}>{totalProtein}g</Text>
            <Text style={styles.statLabel}>Protein</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="leaf-outline" size={wp('6%')} color="#1E90FF" />
            <Text style={styles.statValue}>{totalCarbs}g</Text>
            <Text style={styles.statLabel}>Carbs</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="water-outline" size={wp('6%')} color="#FFA500" />
            <Text style={styles.statValue}>{totalFats}g</Text>
            <Text style={styles.statLabel}>Fats</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={activeTab === 'overview' ? styles.activeTab : styles.inactiveTab} onPress={() => setActiveTab('overview')}>
            <Text style={styles.tabText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={activeTab === 'ingredients' ? styles.activeTab : styles.inactiveTab} onPress={() => setActiveTab('ingredients')}>
            <Text style={styles.tabText}>Ingredients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={activeTab === 'instructions' ? styles.activeTab : styles.inactiveTab} onPress={() => setActiveTab('instructions')}>
            <Text style={styles.tabText}>Instructions</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentContainer}>{renderContent()}</ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: ('2%'),
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  heroSection: {
    padding: 16,
  },
  mealPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  mealPlanDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#1E90FF',
  },
  inactiveTab: {
    borderBottomWidth: 1,
    borderColor: '#CCC',
  },
  tabText: {
    padding: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  recipeContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  mealImage: {
    width: wp('20%'),
    height: hp('10%'),
    borderRadius: 8,
    marginRight: 10,
  },
  mealDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  recipeTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  contentText: {
    fontSize: wp('4%'),
    color: '#666',
  },
  goalText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#1E90FF',
    marginTop: 8,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: wp('4%'),
    color: '#333',
    textAlign: 'justify',
    marginTop: 4,
  },
  nutritionText: {
    fontSize: wp('4%'),
    color: '#333',
  },
  ingredientText: {
    fontSize: wp('4%'),
    color: '#333',
    marginTop: 2,
  },
  instructionText: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'justify',
  },
});

export default MealPlanDetailScreen;
