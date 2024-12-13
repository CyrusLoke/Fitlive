import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, FlatList, ImageBackground, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const AdminViewMealPlansScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      const fetchMealPlans = async () => {
        try {
          const { data, error } = await supabase
            .from('meal_plans')
            .select('id, name, description')
            .order('id', { ascending: true }); // Add this line to order by id
      
          if (error) {
            throw error;
          }
      
          setMealPlans(data || []);
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      };      

      // Fetch meal plans when the screen is focused
      fetchMealPlans();
    }, [])
  );

  // Filter meal plans based on search query
  const filteredMealPlans = mealPlans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMealPlanCard = ({ item }: { item: typeof mealPlans[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.mealPlanName}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <View style={styles.actionIcons}>
        <TouchableOpacity onPress={() => {
          navigation.navigate('AdminAddMealPlanScreen', { mealPlanId: item.id });
        }}>
          <Ionicons name="create-outline" size={wp('6%')} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteMealPlan(item.id, item.name)}>
          <Ionicons name="trash-outline" size={wp('6%')} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleDeleteMealPlan = (mealPlanId: string, mealPlanName: string) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete the meal plan "${mealPlanName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMealPlanFromDatabase(mealPlanId),
        },
      ],
      { cancelable: true }
    );
  };

  const deleteMealPlanFromDatabase = async (mealPlanId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlanId);

      if (error) {
        throw error;
      }

      // Update the state to remove the deleted meal plan from the list
      setMealPlans((prevPlans) => prevPlans.filter((plan) => plan.id !== mealPlanId));
      Alert.alert('Success', 'Meal plan deleted successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Meal Plans</Text>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search Meal Plans..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />

        {/* Meal Plan List */}
        <FlatList
          data={filteredMealPlans}
          renderItem={renderMealPlanCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No Meal Plans Found</Text>}
        />

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AdminAddMealPlanScreen', { selectedMealIds: [] })}>
          <Ionicons name="add" size={wp('8%')} color="#FFF" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('5%'),
    marginBottom: hp('2%'),
  },
  backButton: {
    position: 'absolute',
    left: wp('5%'),
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  searchBar: {
    height: hp('6%'),
    backgroundColor: '#FFF',
    borderRadius: wp('5%'),
    paddingHorizontal: wp('5%'),
    fontSize: wp('4%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: wp('2%'),
    elevation: 3,
  },
  listContainer: {
    paddingBottom: hp('10%'),
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: hp('2%'),
    padding: wp('4%'),
    borderRadius: wp('3%'),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: wp('2%'),
    elevation: 4,
  },
  cardContent: {
    flex: 1,
  },
  mealPlanName: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
  description: {
    fontSize: wp('4%'),
    color: '#555',
    marginVertical: hp('1%'),
  },
  actionIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: wp('15%'),
  },
  emptyText: {
    textAlign: 'center',
    fontSize: wp('5%'),
    color: '#000',
  },
  fab: {
    position: 'absolute',
    bottom: hp('5%'),
    right: wp('5%'),
    backgroundColor: '#007AFF',
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});

export default AdminViewMealPlansScreen;
