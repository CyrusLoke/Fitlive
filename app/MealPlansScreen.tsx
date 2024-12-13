import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

// Define the navigation prop type for the screen
type MealPlansScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MealPlansScreen'>;

const MealPlansScreen: React.FC = () => {
  const navigation = useNavigation<MealPlansScreenNavigationProp>();
  const [isFreePlan, setIsFreePlan] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [userGoal, setUserGoal] = useState<string | null>(null);

  // Fetch user premium status and goal from the database
  const fetchUserDetails = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('is_premium, goal')
        .eq('id', userId)
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to fetch user details.');
        console.error(error);
      } else {
        setIsPremiumUser(user?.is_premium);
        setUserGoal(user?.goal);
      }
    } catch (error) {
      console.error('Database Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch meal plans from the database
  const fetchMealPlans = async () => {
    try {
      const { data: mealPlans, error } = await supabase
        .from('meal_plans')
        .select('*');

      if (error) {
        Alert.alert('Error', 'Failed to fetch meal plans.');
        console.error(error);
      } else {
        const enrichedMealPlans = await Promise.all(
          mealPlans.map(async (plan) => {
            const { data: mealPlanMeals, error: mealPlanMealsError } = await supabase
              .from('meal_plan_meals')
              .select('recipe_meal_id')
              .eq('meal_plan_id', plan.id);

            if (mealPlanMealsError) {
              console.error(mealPlanMealsError);
              return plan;
            }

            if (mealPlanMeals.length > 0) {
              const { data: recipeMeal, error: recipeMealError } = await supabase
                .from('recipe_meals')
                .select('image_base64')
                .eq('id', mealPlanMeals[0].recipe_meal_id)
                .single();

              if (recipeMealError) {
                console.error(recipeMealError);
              } else {
                plan.image_base64 = recipeMeal.image_base64;
              }
            }
            return plan;
          })
        );
        setMealPlans(enrichedMealPlans);
      }
    } catch (error) {
      console.error('Database Error:', error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
    fetchMealPlans();
  }, []);

  const renderMealPlanCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {userGoal && item.goal === userGoal && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}
      <Image source={{ uri: `data:image/png;base64,${item.image_base64}` }} style={styles.image} />
      <View style={styles.cardContent}>
        <Text style={styles.planName}>{item.name}</Text>
        <Text style={styles.planDescription}>{
          item.description.split(' ').slice(0, 10).join(' ') + (item.description.split(' ').length > 10 ? '...' : '')
        }</Text>
        {userGoal && item.goal === userGoal && (
          <Text style={styles.recommendationReason}>Based on your goal: {userGoal.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</Text>
        )}
        <Text style={styles.calories}>{item.total_calories} kcal/day</Text>
        <TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('MealPlanDetailScreen', { mealPlanId: item.id })}>
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>

      {/* Locked Overlay for Premium Plans if the user is not premium */}
      {item.is_premium && !isPremiumUser && (
        <View style={styles.lockedOverlay}>
          <Ionicons name="lock-closed" size={wp('10%')} color="#FFD700" style={styles.lockIcon} />
          <Text style={styles.lockedText}>Locked</Text>
        </View>
      )}
    </View>
  );

  return (
    <ImageBackground source={require('../assets/recipe.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('7%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Meal Plans</Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            onPress={() => setIsFreePlan(true)}
            style={isFreePlan ? styles.activeToggleFree : styles.inactiveToggle}
          >
            <Text style={styles.toggleText}>Free Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsFreePlan(false)}
            style={!isFreePlan ? styles.activeTogglePremium : styles.inactiveToggle}
          >
            <Text style={styles.toggleText}>Premium Plans</Text>
          </TouchableOpacity>
        </View>

        {/* Generate Personalized Plan Button (Premium Users Only, Premium Tab Only) */}
        {!isFreePlan && (
          <TouchableOpacity
            style={[styles.generateButton, !isPremiumUser && styles.lockedGenerateButton]}
            onPress={() => {
              if (isPremiumUser) {
                navigation.navigate('PersonalizedMealPlanScreen');
              } else {
                Alert.alert('Premium Feature', 'Upgrade to premium to generate personalized plans.');
              }
            }}
          >
            <Text style={styles.generateButtonText}>Generate Your Personalized Plan</Text>
          </TouchableOpacity>
        )}

        {/* Meal Plan List */}
        <FlatList
          data={mealPlans.filter((plan) => (isFreePlan ? !plan.is_premium : plan.is_premium))}
          renderItem={renderMealPlanCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Call-to-Action for Premium Upgrade */}
        {!isPremiumUser && !isFreePlan && (
          <View style={styles.premiumCallToAction}>
            <Text style={styles.premiumText}>Unlock exclusive and personalized meal plans with a Premium membership! </Text>
            <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('SubscriptionScreen')}>
              <Text style={styles.upgradeButtonText}>Go Premium</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
    marginTop: hp('1%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: wp('4%'),
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp('2%'),
  },
  activeToggleFree: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('8%'),
    backgroundColor: '#90EE90',
    borderRadius: 20,
  },
  activeTogglePremium: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('8%'),
    backgroundColor: '#FFD700',
    borderRadius: 20,
  },
  inactiveToggle: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('8%'),
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
  },
  toggleText: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    paddingBottom: hp('1%'),
  },
  premiumCallToAction: {
    padding: hp('2%'),
    backgroundColor: '#FF7043',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: hp('1%'),
    left: wp('5%'),
    right: wp('5%'),
  },
  premiumText: {
    color: '#FFF',
    fontSize: wp('4.5%'),
    fontWeight: '600',
    textAlign: 'center',
  },
  upgradeButton: {
    marginTop: hp('1%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('10%'),
    backgroundColor: '#FFD700',
    borderRadius: 10,
  },
  upgradeButtonText: {
    color: '#333',
    fontSize: wp('4.5%'),
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: hp('1.5%'),
    marginBottom: hp('1.5%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF0000',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 2,
  },
  recommendedText: {
    color: '#FFF',
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
  },
  image: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
    marginLeft: wp('4%'),
  },
  planName: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  planDescription: {
    fontSize: wp('4%'),
    color: '#666',
    marginVertical: hp('0.5%'),
  },
  recommendationReason: {
    fontSize: wp('3.5%'),
    color: '#FF4500',
    marginBottom: hp('0.5%'),
  },
  calories: {
    fontSize: wp('3.5%'),
    color: '#999',
  },
  viewButton: {
    marginTop: hp('1%'),
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('5%'),
    backgroundColor: '#1E90FF',
    borderRadius: 10,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: wp('4%'),
    textAlign: 'center',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  lockIcon: {
    marginBottom: hp('1%'),
  },
  lockedText: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#FFD700',
  },
  generateButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: hp('1.5%'),
    marginBottom: hp('2%'),
    borderRadius: 10,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  lockedGenerateButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

export default MealPlansScreen;
