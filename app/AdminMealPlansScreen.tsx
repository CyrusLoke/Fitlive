import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';

const AdminMealPlansScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [totalRecipeMeals, setTotalRecipeMeals] = useState<number>(0);
  const [totalMealPlans, setTotalMealPlans] = useState<number>(0);
  const [mealPlanRequestsCount, setMealPlanRequestsCount] = useState<number>(0);

  // Fetch total number of recipe meals
  useFocusEffect(
    useCallback(() => {
      const fetchTotalRecipeMeals = async () => {
        try {
          const { data, error } = await supabase.from('recipe_meals').select('id', { count: 'exact' });
          if (error) throw error;
          setTotalRecipeMeals(data?.length || 0);
        } catch (error: any) {
          console.error('Error fetching total recipe meals:', error.message);
        }
      };

      fetchTotalRecipeMeals();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchTotalMealPlans = async () => {
        try {
          const { data, error } = await supabase.from('meal_plans').select('id', { count: 'exact' });
          if (error) throw error;
          setTotalMealPlans(data?.length || 0);
        } catch (error: any) {
          console.error('Error fetching total meal plans:', error.message);
        }
      };

      fetchTotalMealPlans();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchMealPlanRequestsCount = async () => {
        try {
          const { count, error } = await supabase
            .from('meal_plan_requests')
            .select('*', { count: 'exact' })
            .eq('status', 'pending'); // Adjust filter as needed
          if (error) throw error;
          setMealPlanRequestsCount(count || 0);
        } catch (error: any) {
          console.error('Error fetching meal plan requests count:', error.message);
        }
      };
  
      fetchMealPlanRequestsCount();
    }, [])
  );  

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Plans Management</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.overviewCards}>
              <TouchableOpacity
                style={styles.overviewCard}
                onPress={() => navigation.navigate('AdminViewMealPlansScreen')}
              >
                <Ionicons name="book-outline" size={wp('7%')} color="#4CAF50" />
                <Text style={styles.cardNumber}>{totalMealPlans}</Text>
                <Text style={styles.cardLabel}>Total Meal Plans</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.overviewCard}
                onPress={() => navigation.navigate('AdminRecipeMealsScreen')}
              >
                <Ionicons name="restaurant-outline" size={wp('7%')} color="#FF7043" />
                <Text style={styles.cardNumber}>{totalRecipeMeals}</Text>
                <Text style={styles.cardLabel}>Total Recipe Meals</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.overviewCards}>
              <View style={styles.overviewCard}>
                <Ionicons name="star" size={wp('7%')} color="#FFD700" />
                <Text style={styles.cardNumber}>4.8</Text>
                <Text style={styles.cardLabel}>Average Rating</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('AdminAddMealPlanScreen', { selectedMealIds: [] })}
              >
                <Ionicons name="add-circle-outline" size={wp('8%')} color="#fff" />
                <Text style={styles.actionText}>Add New Meal Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('AdminCreateRecipeMealScreen', { mealId: undefined })}
              >
                <Ionicons name="create" size={wp('8%')} color="#fff" />
                <Text style={styles.actionText}>Create Recipe Meal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('AdminCreatePersonalizedMealPlanScreen')}
              >
                <Ionicons name="person-outline" size={wp('8%')} color="#fff" />
                <Text style={styles.actionText}>Create Personalized Meal Plan</Text>
                {mealPlanRequestsCount > 0 && (
                  <View style={styles.notificationCircle}>
                    <Text style={styles.notificationText}>{mealPlanRequestsCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <Ionicons name="analytics-outline" size={wp('8%')} color="#fff" />
                <Text style={styles.actionText}>View Analytics</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Recent Activity Section */}
          <View style={styles.recentActivityBox}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-done-outline" size={wp('5%')} color="#4CAF50" />
              <Text style={styles.activityText}>New meal plan "Vegan Essentials" added.</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="pencil-outline" size={wp('5%')} color="#ffa500" />
              <Text style={styles.activityText}>Updated "Keto Starter Plan".</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="star-outline" size={wp('5%')} color="#FFD700" />
              <Text style={styles.activityText}>5-star review received for "Mediterranean Feast".</Text>
            </View>
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
    backgroundColor: '#4CAF50',
    paddingVertical: hp('2.5%'),
    paddingHorizontal: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  backButton: {
    marginTop: hp('1%'),
    marginRight: wp('2.5%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    marginTop: hp('1%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  contentContainer: {
    padding: wp('5%'),
  },
  section: {
    marginBottom: hp('2.5%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('1%'),
  },
  cardNumber: {
    fontSize: wp('6.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp('1%'),
  },
  cardLabel: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#555',
    marginVertical: hp('1.5%'),
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  overviewCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: hp('1.5%'),
  },
  actionCard: {
    backgroundColor: '#4CAF50',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  actionText: {
    fontSize: wp('3.5%'),
    color: '#fff',
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  recentActivityBox: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: hp('2%'),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  activityText: {
    fontSize: wp('3.5%'),
    color: '#555',
    marginLeft: wp('2%'),
  },
  notificationCircle: {
    position: 'absolute',
    top: hp('1%'),
    right: wp('2%'),
    backgroundColor: '#FF3B30',
    width: wp('5%'),
    height: wp('5%'),
    borderRadius: wp('2.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  notificationText: {
    color: '#fff',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },  
});

export default AdminMealPlansScreen;
