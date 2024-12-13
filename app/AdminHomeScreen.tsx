import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type AdminHomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminHomeScreen'>;

const AdminHomeScreen: React.FC = () => {
  const navigation = useNavigation<AdminHomeScreenNavigationProp>();
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<number | null>(null);
  const [reportedMoments, setReportedMoments] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [totalMealPlans, setTotalMealPlans] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        const { count: userCount, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
          .neq('role', 3);
        if (userError) {
          console.error('Error fetching total users:', userError);
        } else {
          setTotalUsers(userCount);
        }

        const today = new Date().toISOString().split('T')[0];
        const { count: challengeCount, error: challengeError } = await supabase
          .from('challenges')
          .select('*', { count: 'exact' })
          .lte('start_date', today)
          .gte('end_date', today);
        if (challengeError) {
          console.error('Error fetching active challenges:', challengeError);
        } else {
          setActiveChallenges(challengeCount);
        }

        const { count: reportCount, error: reportError } = await supabase
          .from('reports')
          .select('*', { count: 'exact' });
        if (reportError) {
          console.error('Error fetching reported moments:', reportError);
        } else {
          setReportedMoments(reportCount);
        }

        const { count: approvalCount, error: approvalError } = await supabase
          .from('articles')
          .select('*', { count: 'exact' })
          .eq('approval_status', 'pending');
        if (approvalError) {
          console.error('Error fetching pending approvals:', approvalError);
        } else {
          setPendingApprovals(approvalCount);
        }

        // Fetch the real number of meal plans
        const { count: mealPlanCount, error: mealPlanError } = await supabase
          .from('meal_plans')
          .select('*', { count: 'exact' });
        if (mealPlanError) {
          console.error('Error fetching total meal plans:', mealPlanError);
        } else {
          setTotalMealPlans(mealPlanCount);
        }
      };

      fetchData();
    }, [])
  );

  const handleTotalUsersPress = () => {
    navigation.navigate('AdminUserListScreen');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardsScrollViewContainer}>
          <ScrollView style={styles.cardsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.cardRow}>
              <DashboardCard
                title="Total Users"
                value={totalUsers !== null ? totalUsers : 'Loading...'}
                icon="account-group-outline"
                onPress={handleTotalUsersPress}
              />
              <DashboardCard
                title="Total Workout Plans"
                value="45"
                icon="weight-lifter"
                onPress={() => { }}
              />
            </View>
            <View style={styles.cardRow}>
              <DashboardCard
                title="Total Meal Plans"
                value={totalMealPlans !== null ? totalMealPlans : 'Loading...'}
                icon="food-apple-outline"
                onPress={() => navigation.navigate('AdminMealPlansScreen')}
              />
              <DashboardCard
                title="Pending Content Approvals"
                value={pendingApprovals !== null ? pendingApprovals : 'Loading...'}
                icon="clipboard-alert-outline"
                onPress={() => navigation.navigate('AdminContentApprovalScreen')}
              />
            </View>
            <View style={styles.cardRow}>
              <DashboardCard
                title="Active Challenges"
                value={activeChallenges !== null ? activeChallenges : 'Loading...'}
                icon="trophy-outline"
                onPress={() => navigation.navigate('AdminChallengesScreen')}
              />
              <DashboardCard
                title="Reported Moments"
                value={reportedMoments !== null ? reportedMoments : 'Loading...'}
                icon="flag-outline"
                onPress={() => navigation.navigate('AdminReportedMomentsScreen')}
              />
            </View>
          </ScrollView>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              label="Create New Article"
              icon="file-document-edit-outline"
              onPress={() => navigation.navigate('AddArticleScreen')}
            />
            <QuickActionButton
              label="Create New Challenge"
              icon="trophy"
              onPress={() => navigation.navigate('AdminCreateChallengeScreen')}
            />
            <QuickActionButton
              label="Add Workout Plan"
              icon="weight-lifter"
              onPress={() => { }}
            />
            <QuickActionButton
              label="Add Meal Plan"
              icon="food"
              onPress={() => { }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

// Dashboard Card component
const DashboardCard: React.FC<{ title: string; value: string | number; icon: string; onPress: () => void }> = ({ title, value, icon, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Icon name={icon} size={wp('10%')} color="#007BFF" />
    <View style={styles.cardContent}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  </TouchableOpacity>
);

// Quick Action Button component
const QuickActionButton: React.FC<{ label: string; icon: string; onPress: () => void }> = ({ label, icon, onPress }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <Icon name={icon} size={wp('7%')} color="#fff" />
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    width: '100%',
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 1,
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: wp('5%'),
    paddingTop: hp('2%'),
  },
  cardsScrollViewContainer: {
    height: hp('40%'),
    marginBottom: hp('3%'),
  },
  cardsContainer: {
    flexGrow: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    marginTop: hp('1%'),
    alignItems: 'center',
  },
  cardValue: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#333',
  },
  cardTitle: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    marginTop: hp('3%'),
  },
  sectionTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    marginBottom: hp('1.5%'),
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#007BFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: '#fff',
    fontSize: wp('3.8%'),
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: hp('3%'),
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
});

export default AdminHomeScreen;
