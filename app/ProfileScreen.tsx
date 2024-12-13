import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, FlatList, Alert, Switch } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../supabaseClient';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileScreen' | 'AddMomentScreen'>;

interface Moment {
  id: number;
  caption: string;
  image_base64: string | null;
  created_at: string;
  is_private: boolean;
}

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [profile, setProfile] = useState({
    username: null,
    age: null,
    height: null,
    weight: null,
    gender: null,
    profile_picture: null,
    country: null,
    join_date: null,
    fitness_goal: null,
    workout_intensity: null,
    activity_level: null,
  });

  const [moments, setMoments] = useState<Moment[]>([]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('username, age, height, weight, gender, profile_picture, country, created_at, goal, fitness_level, activity_level')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile({
          username: data?.username || null,
          age: data?.age || null,
          height: data?.height || null,
          weight: data?.weight || null,
          gender: data?.gender || null,
          profile_picture: data?.profile_picture || null,
          country: data?.country || null,
          join_date: data?.created_at || null,
          fitness_goal: data?.goal || 'Not set',
          workout_intensity: data?.fitness_level || 'Not set',
          activity_level: data?.activity_level || 'Not set',
        });
      }
    }
  };

  const fetchMoments = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('moments')
        .select('id, caption, image_base64, created_at, is_private')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching moments:', error.message);
      } else if (data) {
        setMoments(data);
      }
    }
  };

  const deleteMoment = async (momentId: number) => {
    const { error } = await supabase
      .from('moments')
      .delete()
      .eq('id', momentId);

    if (error) {
      console.error('Error deleting moment:', error.message);
      Alert.alert('Error', 'Failed to delete moment. Please try again.');
    } else {
      setMoments((prevMoments) => prevMoments.filter((moment) => moment.id !== momentId));
      Alert.alert('Success', 'Moment deleted successfully.');
    }
  };

  const toggleMomentPrivacy = async (momentId: number, isPrivate: boolean) => {
    const { error } = await supabase
      .from('moments')
      .update({ is_private: !isPrivate })
      .eq('id', momentId);
  
    if (error) {
      console.error('Error updating moment privacy:', error.message);
    } else {
      setMoments((prevMoments) =>
        prevMoments.map((moment) =>
          moment.id === momentId ? { ...moment, is_private: !isPrivate } : moment
        )
      );
    }
  };  

  const confirmDelete = (momentId: number) => {
    Alert.alert(
      'Delete Moment',
      'Are you sure you want to delete this moment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMoment(momentId) },
      ]
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
      fetchMoments();
    }, [])
  );

  const capitalizeFirstLetter = (text: string | null) => {
    if (!text) return 'Not set';
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateBMI = () => {
    if (profile.height && profile.weight) {
      const heightInMeters = parseFloat(profile.height) / 100;
      const bmi = parseFloat(profile.weight) / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number | null) => {
    if (bmi === null) return { category: 'Not available', color: '#000' };

    if (bmi < 18.5) return { category: 'Underweight', color: '#FF4500' };
    if (bmi >= 18.5 && bmi < 24.9) return { category: 'Normal weight', color: '#32CD32' };
    if (bmi >= 25 && bmi < 29.9) return { category: 'Overweight', color: '#FFA500' };
    if (bmi >= 30) return { category: 'Obese', color: '#FF0000' };

    return { category: 'Unknown', color: '#000' };
  };

  const bmi = calculateBMI();
  const { category, color } = getBMICategory(bmi ? parseFloat(bmi) : null);

  return (
    <ImageBackground source={require('../assets/profile.png')} style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header Section */}
        <View style={styles.profileHeader}>
          <Image
            source={
              profile.profile_picture
                ? { uri: profile.profile_picture }
                : require('../assets/default-profile.png')
            }
            style={styles.profileImage}
          />
          <Text style={styles.username}>{profile.username || 'Guest'}</Text>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfileScreen')}
          >
            <Ionicons name="create-outline" size={wp('5%')} color="#007BFF" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionText}>Name: {profile.username || 'Guest'}</Text>
          <Text style={styles.sectionText}>Gender: {profile.gender || 'Not set'}</Text>
          <Text style={styles.sectionText}>Age: {profile.age ? profile.age : 'Not set'}</Text>
          <Text style={styles.sectionText}>
            Height: {profile.height ? `${profile.height} cm` : 'Not set'}
          </Text>
          <Text style={styles.sectionText}>
            Weight: {profile.weight ? `${profile.weight} kg` : 'Not set'}
          </Text>
          <Text style={styles.sectionText}>Country: {profile.country || 'Not set'}</Text>
          <Text style={styles.sectionText}>Join Date: {profile.join_date ? new Date(profile.join_date).toLocaleDateString() : 'Not set'}</Text>
        </View>

        {/* BMI Section */}
        {profile.height && profile.weight && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BMI (Body Mass Index)</Text>
            <Text style={styles.sectionText}>
              BMI: <Text>{bmi}</Text>{' '}
              <Text style={[styles.bmiCategory, { color }]}>
                ({category})
              </Text>
            </Text>
          </View>
        )}

        {/* Fitness Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Preferences</Text>
          <Text style={styles.sectionText}>Current Goal: {capitalizeFirstLetter(profile.fitness_goal)}</Text>
          <Text style={styles.sectionText}>Workout Intensity: {capitalizeFirstLetter(profile.workout_intensity)}</Text>
          <Text style={styles.sectionText}>Activity Level: {capitalizeFirstLetter(profile.activity_level)}</Text>
          <TouchableOpacity style={styles.goalButton} onPress={() => navigation.navigate('EditFitnessPreferencesScreen')}>
            <Ionicons name="fitness-outline" size={wp('4.5%')} color="#fff" />
            <Text style={styles.goalButtonText}>Edit Preferences</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Overview</Text>
          <View style={styles.activityOverview}>
            <View style={styles.activityColumn}>
              <Text style={styles.activityText}>Workouts</Text>
              <Text style={styles.activityNumber}>45</Text>
            </View>
            <View style={styles.activityColumn}>
              <Text style={styles.activityText}>Calories</Text>
              <Text style={styles.activityNumber}>10,500</Text>
            </View>
            <View style={styles.activityColumn}>
              <Text style={styles.activityText}>Streak</Text>
              <Text style={styles.activityNumber}>7 Days</Text>
            </View>
          </View>
        </View>

        {/* Moments Board Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Moments</Text>

          {moments.length === 0 ? (
            <Text style={styles.noMomentsText}>No moments to display. Start sharing your journey!</Text>
          ) : (
            <FlatList
            data={moments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => navigation.navigate('MomentDetailScreen', { momentId: item.id })}
              >
                <View style={styles.momentCard}>
                  {item.image_base64 && (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }}
                      style={styles.momentImage}
                    />
                  )}
                  <Text style={styles.momentCaption}>{item.caption}</Text>
                  <Text style={styles.momentDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          
                  {/* Toggle Privacy Switch */}
                  <View style={styles.privacyToggle}>
                    <Text style={styles.privacyText}>
                      {item.is_private ? 'Private' : 'Public'}
                    </Text>
                    <Switch
                      value={item.is_private}
                      onValueChange={() => toggleMomentPrivacy(item.id, item.is_private)}
                    />
                  </View>
          
                  {/* Delete Moment X Button */}
                  <TouchableOpacity
                    style={styles.deleteMomentXButton}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <Ionicons name="close-outline" size={wp('6%')} color="#FF0000" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.momentList}
          />          
          )}
          {/* Add Moment Button */}
          <TouchableOpacity style={styles.addMomentButton} onPress={() => navigation.navigate('AddMomentScreen')}>
            <Ionicons name="add-circle-outline" size={wp('7%')} color="#007BFF" />
            <Text style={styles.addMomentText}>Add a Moment</Text>
          </TouchableOpacity>
        </View>

        {/* Back to Home Button */}
        <TouchableOpacity style={styles.backHomeButton} onPress={() => navigation.navigate('HomeScreen')}>
          <Ionicons name="home-outline" size={wp('5%')} color="#fff" />
          <Text style={styles.backHomeText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: wp('5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: hp('5%'),
    marginBottom: hp('2%'),
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
    marginBottom: hp('2%'),
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  username: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: wp('5%'),
  },
  editProfileText: {
    color: '#007BFF',
    fontSize: wp('4.5%'),
    marginLeft: wp('2%'),
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    color: '#333',
  },
  sectionText: {
    fontSize: wp('4.5%'),
    color: '#555',
    marginBottom: hp('1%'),
  },
  bmiCategory: {
    fontWeight: 'bold',
  },
  activityOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityColumn: {
    alignItems: 'center',
    width: wp('28%'),
  },
  activityText: {
    fontSize: wp('4.5%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  activityNumber: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#333',
  },
  goalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('5%'),
    marginTop: hp('2%'),
  },
  goalButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    marginLeft: wp('2%'),
    fontWeight: 'bold',
  },
  momentList: {
    paddingVertical: hp('1%'),
  },
  momentCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    width: wp('60%'),
    marginRight: wp('3%'),
    alignItems: 'center',
    position: 'relative',
  },
  momentImage: {
    width: wp('50%'),
    height: hp('15%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
  },
  momentCaption: {
    fontSize: wp('4%'),
    color: '#333',
    textAlign: 'center',
    marginBottom: hp('0.5%'),
  },
  momentDate: {
    fontSize: wp('3.5%'),
    color: '#888',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: wp('50%'),
    marginVertical: hp('1%'),
  },
  privacyText: {
    fontSize: wp('4%'),
    color: '#555',
  },
  deleteMomentXButton: {
    position: 'absolute',
    top: hp('1%'),
    right: wp('2%'),
    backgroundColor: '#fff',
    borderRadius: wp('4%'), 
    padding: wp('1%'),
    elevation: 5, 
  },  
  backHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('5%'),
    marginTop: hp('3%'),
    marginBottom: hp('2%'),
    alignSelf: 'center',
  },
  backHomeText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    marginLeft: wp('2%'),
    fontWeight: 'bold',
  },
  noMomentsText: {
    fontSize: wp('4%'),
    color: '#888',
    textAlign: 'center',
    marginTop: hp('1%'),
  },
  addMomentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1.5%'),
    alignSelf: 'center',
  },
  addMomentText: {
    fontSize: wp('4.5%'),
    color: '#007BFF',
    marginLeft: wp('2%'),
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
