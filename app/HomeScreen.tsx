import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, ImageBackground, ScrollView } from 'react-native';
import { supabase } from '../supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeScreen'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [profile, setProfile] = useState<{ username: string; profilePicture: string } | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('username, profile_picture, is_premium')
        .eq('id', user.id)
        .single();

      if (!error) {
        setProfile({
          username: data.username,
          profilePicture: data.profile_picture,
        });

        // Set the user's premium status
        setIsPremium(data.is_premium);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (!error) {
      await AsyncStorage.removeItem('supabase_session');
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    }
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleSubscribe = () => {
    navigation.navigate('SubscriptionScreen');
  };

  return (
    <ImageBackground source={require('../assets/Fbackground.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.profileBox}>
          <View style={styles.profileTouchArea}>
            {profile?.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.profileImage} />
            ) : (
              <Image source={require('../assets/default-profile.png')} style={styles.profileImage} />
            )}
            <View style={styles.textContainer}>
              <Text style={styles.username}>{profile?.username || 'Guest'}</Text>
              <Text style={styles.welcomeMessage}>Let's get moving!</Text>
            </View>
          </View>

          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={wp('6%')} color="#FFD700" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}

          <TouchableOpacity onPress={toggleDropdown}>
            <Ionicons name="chevron-down" size={wp('5%')} color="#333" style={styles.dropdownIcon} />
          </TouchableOpacity>
        </View>

        {/* Subscription Card (Shown only if user is not premium) */}
        {!isPremium && (
          <TouchableOpacity onPress={handleSubscribe} style={styles.subscriptionCard}>
            <Ionicons name="star" size={wp('7%')} color="#FFD700" style={styles.starIcon} />
            <View style={styles.subscriptionTextContainer}>
              <Text style={styles.subscriptionTitle}>Go Premium</Text>
              <Text style={styles.subscriptionText}>Unlock exclusive features</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={wp('7%')} color="#fff" />
          </TouchableOpacity>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navigationOptions}
        >
          <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('MealPlansScreen')}>
            <Ionicons name="fast-food" size={wp('7%')} color="#1E90FF" />
            <Text style={styles.navCardText}>Meal Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} >
            <Ionicons name="barbell" size={wp('7%')} color="#FF6347" />
            <Text style={styles.navCardText}>Workout Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} >
            <Ionicons name="list" size={wp('7%')} color="#4CAF50" />
            <Text style={styles.navCardText}>My Plans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} >
            <Ionicons name="bed" size={wp('7%')} color="#FFD700" />
            <Text style={styles.navCardText}>Sleep Log</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={toggleDropdown}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPressOut={toggleDropdown}
          >
            <View style={styles.dropdownMenu}>
              <TouchableOpacity onPress={() => { setDropdownVisible(false); navigation.navigate('ProfileScreen'); }}>
                <Text style={styles.dropdownItem}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setDropdownVisible(false); navigation.navigate('SettingsScreen'); }}>
                <Text style={styles.dropdownItem}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={[styles.dropdownItem, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingTop: hp('5%'),
    paddingHorizontal: wp('5%'),
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 15,
    marginBottom: hp('1%'),
    justifyContent: 'space-between',
  },
  profileTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    borderWidth: 2,
    borderColor: '#fff',
  },
  dropdownIcon: {
    marginLeft: wp('2%'),
  },
  textContainer: {
    marginLeft: wp('3%'),
  },
  username: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeMessage: {
    fontSize: wp('3.5%'),
    color: '#666',
  },
  subscriptionCard: {
    flexDirection: 'row',
    backgroundColor: '#FF7043',
    padding: hp('1.5%'),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFD700',
    elevation: 5,
  },
  starIcon: {
    marginLeft: wp('2%'),
  },
  subscriptionTextContainer: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  subscriptionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  subscriptionText: {
    fontSize: wp('4%'),
    color: '#fff',
  },
  navigationOptions: {
    paddingVertical: hp('1%'),
  },
  navCard: {
    backgroundColor: '#FFFFFF', // Light background color
    width: wp('30%'),
    height: hp('10%'),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('2%'),
    elevation: 3,
    borderWidth: 1,
    borderColor: '#CCCCCC', // Light grey border for a modern look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  navCardText: {
    fontSize: wp('4%'),
    color: '#333',
    marginTop: hp('0.5%'),
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: hp('2%'),
    width: wp('60%'),
    alignItems: 'center',
  },
  dropdownItem: {
    fontSize: wp('4%'),
    paddingVertical: hp('1.5%'),
    textAlign: 'center',
  },
  logoutText: {
    color: '#e53935',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 10,
    marginLeft: wp('2%'),
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  premiumText: {
    fontSize: wp('4%'),
    color: '#333',
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
});

export default HomeScreen;
