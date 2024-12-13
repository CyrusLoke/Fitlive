import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ImageBackground, Alert } from 'react-native';
import { useNavigation, useFocusEffect, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { RootStackParamList } from './App';

type RecipeMeal = {
  id: number;
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

const AdminAddMealsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const [availableMeals, setAvailableMeals] = useState<RecipeMeal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<RecipeMeal[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<RecipeMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const fetchMeals = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('recipe_meals').select('*');
          if (error) throw error;
  
          const initialSelectedMealIds = route.params?.selectedMealIds || [];
          const preSelectedMeals = data.filter((meal) => initialSelectedMealIds.includes(meal.id));
  
          setAvailableMeals(data as RecipeMeal[]);
          setFilteredMeals(data as RecipeMeal[]);
          setSelectedMeals(preSelectedMeals);
        } catch (error: unknown) {
          const errorMessage = (error as Error).message || 'An error occurred';
          Alert.alert('Error', errorMessage);
        } finally {
          setLoading(false);
        }
      };
  
      fetchMeals();
    }, [route.params?.selectedMealIds])
  );  

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredMeals(availableMeals);
    } else {
      setFilteredMeals(
        availableMeals.filter((meal) =>
          meal.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  };

  const toggleSelectMeal = (meal: RecipeMeal) => {
    setSelectedMeals((prevSelectedMeals) =>
      prevSelectedMeals.some((selected) => selected.id === meal.id)
        ? prevSelectedMeals.filter((selected) => selected.id !== meal.id)
        : [...prevSelectedMeals, meal]
    );
  };

  const handleConfirmSelection = () => {
    const selectedMealIds = selectedMeals.map((meal) => meal.id);
    const mealPlanId = route.params?.mealPlanId; // Get the mealPlanId from route params if it exists
  
    if (mealPlanId) {
      // Navigate back to AdminAddMealPlanScreen, keeping the mealPlanId and adding the selectedMealIds
      navigation.navigate('AdminAddMealPlanScreen', { mealPlanId, selectedMealIds });
    } else {
      // Fallback case if no mealPlanId is found (unlikely if coming from edit mode)
      navigation.navigate('AdminAddMealPlanScreen', { selectedMealIds });
    }
  };  

  const navigateToCreateNewMeal = () => {
    navigation.navigate({ name: 'AdminCreateRecipeMealScreen', params: {} });
  };  

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Meals</Text>
        </View>

        <Text style={styles.instructionText}>
          Add meals to your plan by selecting from the list or creating new ones.
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search meals..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={handleSearch}
        />

        <Text style={styles.sectionTitle}>Available Meals</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : filteredMeals.length === 0 ? (
          <Text style={styles.noMealsText}>No meals found. Please try a different search term.</Text>
        ) : (
          <FlatList
            data={filteredMeals}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.mealCard,
                  selectedMeals.some((selected) => selected.id === item.id) && styles.selectedMealCard,
                ]}
                onPress={() => toggleSelectMeal(item)}
              >
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{item.name}</Text>
                  <Text style={styles.mealDetails}>Calories: {item.calories} kcal</Text>
                  <View style={styles.macroRow}>
                    <Text style={styles.macroText}>Carbs: {item.carbs}g</Text>
                    <Text style={styles.macroText}>Protein: {item.protein}g</Text>
                    <Text style={styles.macroText}>Fats: {item.fats}g</Text>
                  </View>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={wp('6%')}
                  color={selectedMeals.some((selected) => selected.id === item.id) ? '#4CAF50' : '#ccc'}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: hp('1%') }}
          />
        )}

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmSelection}>
          <Text style={styles.confirmButtonText}>Confirm Selection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createMealButton} onPress={navigateToCreateNewMeal}>
          <Ionicons name="add-circle" size={wp('6%')} color="#fff" />
          <Text style={styles.createMealButtonText}>Create New Meal</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
    marginTop: hp('2%'),
  },
  backButton: {
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#000',
  },
  instructionText: {
    fontSize: wp('4%'),
    color: '#000',
    marginBottom: hp('2%'),
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontSize: wp('4%'),
    marginBottom: hp('2%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
  },
  loadingText: {
    fontSize: wp('4%'),
    color: '#888',
    textAlign: 'center',
    marginVertical: hp('2%'),
  },
  noMealsText: {
    fontSize: wp('4%'),
    color: '#555',
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMealCard: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  mealInfo: {
    flex: 1,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroText: {
    fontSize: wp('3.5%'),
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  confirmButtonText: {
    fontSize: wp('4%'),
    color: '#fff',
    fontWeight: 'bold',
  },
  createMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7043',
    padding: wp('3%'),
    borderRadius: wp('2%'),
  },
  createMealButtonText: {
    fontSize: wp('4%'),
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  mealName: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  mealDetails: {
    fontSize: wp('3.5%'),
    color: '#000',
  },  
});

export default AdminAddMealsScreen;
