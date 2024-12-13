import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';
import { RootStackParamList } from './App';
import { useCallback } from 'react';

type RecipeMeal = {
  id: number;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const AdminRecipeMealsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [recipeMeals, setRecipeMeals] = useState<RecipeMeal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<RecipeMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecipeMeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('recipe_meals').select('*');
      if (error) {
        throw error;
      }
      setRecipeMeals(data as RecipeMeal[]);
      setFilteredMeals(data as RecipeMeal[]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRecipeMeals();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredMeals(recipeMeals);
    } else {
      const filtered = recipeMeals.filter((meal) =>
        meal.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMeals(filtered);
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Meals</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={wp('6%')} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('AdminCreateRecipeMealScreen', { mealId: undefined })}
          >
            <Text style={styles.createButtonText}>Create Recipe Meal</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>All Recipe Meals</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            filteredMeals.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                style={styles.mealCard}
                onPress={() => navigation.navigate('AdminRecipeDetailScreen', { mealId: meal.id })}
              >
                <View style={styles.mealHeader}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                </View>
                <Text style={styles.mealDetails}>
                  Calories: {meal.calories} | Protein: {meal.protein}g | Carbs: {meal.carbs}g | Fats: {meal.fats}g
                </Text>
                <Text style={styles.mealDescription}>{meal.description}</Text>
              </TouchableOpacity>
            ))
          )}

          <View style={styles.divider} />

          {filteredMeals.length === 0 && !loading && (
            <Text style={styles.endMessage}>No more recipes to display.</Text>
          )}
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
    padding: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2.5%'),
    marginTop: hp('1.5%'),
  },
  backButton: {
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#000',
  },
  contentContainer: {
    paddingBottom: hp('5%'),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp('2%'),
    fontSize: wp('4%'),
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  createButtonText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  mealDetails: {
    fontSize: wp('3.8%'),
    color: '#555',
    marginVertical: hp('0.5%'),
  },
  mealDescription: {
    fontSize: wp('3.6%'),
    color: '#777',
    textAlign: 'justify',
  },  
  divider: {
    height: 1,
    backgroundColor: '#bbb',
    marginVertical: hp('2%'),
  },
  endMessage: {
    fontSize: wp('4%'),
    color: '#888',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: wp('4%'),
    color: '#888',
    textAlign: 'center',
    marginVertical: hp('2%'),
  },
});

export default AdminRecipeMealsScreen;
