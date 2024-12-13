import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ImageBackground } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { useCallback } from 'react';

type AdminRecipeDetailScreenRouteProp = RouteProp<RootStackParamList, 'AdminRecipeDetailScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminRecipeDetailScreen'>;

type RecipeMeal = {
  id: number;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_base64?: string;
  ingredients: string;
  instructions: string;
  serving_size: string;
};

const AdminRecipeDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AdminRecipeDetailScreenRouteProp>();
  const { mealId } = route.params;

  const [meal, setMeal] = useState<RecipeMeal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMealDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recipe_meals')
        .select('*')
        .eq('id', mealId)
        .single();

      if (error) {
        throw error;
      }
      setMeal(data as RecipeMeal);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchMealDetails();
    }, [mealId])
  );

  const handleEdit = () => {
    if (meal) {
      navigation.navigate('AdminCreateRecipeMealScreen', { mealId: meal.id, mealData: meal });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('recipe_meals').delete().eq('id', mealId);
              if (error) throw error;
              Alert.alert('Recipe Deleted', 'The recipe has been successfully deleted.');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  if (!meal) {
    return <Text style={styles.errorText}>Recipe not found.</Text>;
  }

  const ingredients = JSON.parse(meal.ingredients);

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={wp('7%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Image
            source={{ uri: `data:image/png;base64,${meal.image_base64}` }}
            style={styles.recipeImage}
          />
          <Text style={styles.recipeName}>{meal.name}</Text>
          <Text style={styles.servingsText}>Servings: {meal.serving_size}</Text>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{meal.description}</Text>
          </View>
          <View style={styles.nutritionContainer}>
            <Text style={styles.sectionTitle}>Nutritional Information</Text>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Calories:</Text>
              <Text style={styles.nutritionValue}>{meal.calories} kcal</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Protein:</Text>
              <Text style={styles.nutritionValue}>{meal.protein}g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Carbs:</Text>
              <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fats:</Text>
              <Text style={styles.nutritionValue}>{meal.fats}g</Text>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {ingredients.map((ingredient: any, index: number) => (
              <Text key={index} style={styles.ingredientItem}>
                - {ingredient.quantity} {ingredient.unit} {ingredient.name}
              </Text>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preparation Steps</Text>
            <Text style={styles.stepItem}>{meal.instructions}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingTop: wp('12%'),
    paddingBottom: wp('3%'),
  },
  backButton: {
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#333',
  },
  contentContainer: {
    padding: wp('5%'),
  },
  recipeImage: {
    width: '100%',
    height: wp('55%'),
    borderRadius: 15,
    marginBottom: wp('4%'),
  },
  recipeName: {
    fontSize: wp('6.5%'),
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: wp('1%'),
  },
  servingsText: {
    fontSize: wp('4.5%'),
    color: '#555',
    marginBottom: wp('3%'),
  },
  summaryContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: wp('4%'),
    marginBottom: wp('4%'),
  },
  summaryText: {
    fontSize: wp('4%'),
    color: '#555',
    lineHeight: wp('5.5%'),
  },
  nutritionContainer: {
    marginBottom: wp('4%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: wp('2%'),
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: wp('1.5%'),
  },
  nutritionLabel: {
    fontSize: wp('4%'),
    color: '#555',
  },
  nutritionValue: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  section: {
    marginBottom: wp('4%'),
  },
  ingredientItem: {
    fontSize: wp('4%'),
    color: '#555',
    marginBottom: wp('1%'),
  },
  stepItem: {
    fontSize: wp('4%'),
    color: '#555',
    marginBottom: wp('2%'),
    lineHeight: wp('5.5%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: wp('5%'),
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  editButton: {
    backgroundColor: '#27ae60',
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('10%'),
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#c0392b',
    paddingVertical: wp('3%'),
    paddingHorizontal: wp('10%'),
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: wp('5%'),
    color: '#888',
    textAlign: 'center',
    marginTop: wp('10%'),
  },
  errorText: {
    fontSize: wp('5%'),
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: wp('10%'),
  },
});

export default AdminRecipeDetailScreen;
