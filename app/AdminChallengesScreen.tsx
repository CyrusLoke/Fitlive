import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';
import moment from 'moment';

type AdminChallengesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminChallengesScreen'>;

const AdminChallengesScreen: React.FC = () => {
  const navigation = useNavigation<AdminChallengesScreenNavigationProp>();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Ongoing' | 'Upcoming' | 'Completed'>('Ongoing');
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const determineStatus = (startDate: string, endDate: string) => {
    const currentDate = moment();
    const start = moment(startDate);
    const end = moment(endDate);

    if (currentDate.isBefore(start)) {
      return { status: 'Upcoming', progressPercentage: 0 };
    } else if (currentDate.isAfter(end)) {
      return { status: 'Completed', progressPercentage: 100 };
    } else {
      const totalDuration = end.diff(start);
      const timeElapsed = currentDate.diff(start);
      const progressPercentage = Math.min(100, (timeElapsed / totalDuration) * 100);
      return { status: 'Ongoing', progressPercentage };
    }
  };

  const fetchChallenges = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('challenges').select('*');
    if (error) {
      console.error('Error fetching challenges:', error);
    } else {
      setChallenges(data);
    }
    setLoading(false);
  };

  const fetchPendingApprovals = async () => {
    const { count, error } = await supabase
      .from('challenge_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending approvals:', error);
    } else {
      setPendingApprovals(count || 0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChallenges();
      fetchPendingApprovals();
    }, [])
  );

  const handleChallengePress = (challenge: any) => {
    navigation.navigate('AdminChallengeDetailScreen', { challenge });
  };

  const filteredChallenges = challenges.filter((challenge) => {
    const status = determineStatus(challenge.start_date, challenge.end_date).status;
    return status === activeTab;
  });

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{activeTab} Challenges</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Ongoing' && styles.activeTabButton]}
            onPress={() => setActiveTab('Ongoing')}
          >
            <Text style={[styles.tabText, activeTab === 'Ongoing' && styles.activeTabText]}>Ongoing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Upcoming' && styles.activeTabButton]}
            onPress={() => setActiveTab('Upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'Upcoming' && styles.activeTabText]}>Upcoming</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Completed' && styles.activeTabButton]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
              <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
            </View>
          ) : (
            filteredChallenges.length > 0 ? (
              filteredChallenges.map((challenge) => {
                const statusData = determineStatus(challenge.start_date, challenge.end_date);
                const progressWidth = statusData.progressPercentage * 100 / 100;

                return (
                  <TouchableOpacity key={challenge.id} onPress={() => handleChallengePress(challenge)}>
                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{challenge.title}</Text>
                        <Icon name="trophy-outline" size={wp('6%')} color="#007BFF" />
                      </View>
                      <Text style={styles.cardText}>Participants: {challenge.max_participants || 'No Limit'}</Text>
                      <Text style={styles.cardText}>Status: {statusData.status}</Text>
                      <Text style={styles.cardText}>
                        Start: {challenge.start_date} - End: {challenge.end_date}
                      </Text>
                      {statusData.status === 'Ongoing' && (
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noChallengeText}>No {activeTab} Challenges</Text>
            )
          )}
        </ScrollView>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminCreateChallengeScreen')}
          >
            <Icon name="plus" size={wp('6%')} color="#fff" />
            <Text style={styles.actionButtonText}>Create New Challenge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('AdminChallengeTaskApprovalScreen')}
          >
            <Icon name="clipboard-alert" size={wp('6%')} color="#fff" />
            <Text style={styles.actionButtonText}>Pending Approvals ({pendingApprovals})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <Icon name="view-list-outline" size={wp('6%')} color="#000" />
            <Text style={styles.footerText}>All Challenges</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton}>
            <Icon name="trophy" size={wp('6%')} color="#000" />
            <Text style={styles.footerText}>Leaderboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton}>
            <Icon name="file-document-edit-outline" size={wp('6%')} color="#000" />
            <Text style={styles.footerText}>Submissions</Text>
          </TouchableOpacity>
        </View>
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
    padding: wp('4%'),
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('2%'),
    width: '100%',
    paddingHorizontal: wp('4%'),
  },
  backButton: {
    padding: wp('2%'),
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: hp('2%'),
  },
  tabButton: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    borderColor: '#007BFF',
    borderWidth: 1,
  },
  activeTabButton: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    fontSize: wp('4%'),
    color: '#007BFF',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('1%'),
  },
  cardTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
  },
  cardText: {
    fontSize: wp('4%'),
    color: '#666',
    marginTop: hp('0.5%'),
  },
  progressBarContainer: {
    backgroundColor: '#e0e0e0',
    height: hp('1%'),
    borderRadius: wp('2%'),
    marginTop: hp('1%'),
  },
  progressBar: {
    backgroundColor: '#007BFF',
    height: '100%',
    borderRadius: wp('2%'),
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
    marginTop: hp('2%'),
  },
  actionButton: {
    backgroundColor: '#007BFF',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '48%',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    marginLeft: wp('2%'),
  },
  secondaryButton: {
    backgroundColor: '#FF3B30',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerButton: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: wp('4%'),
    color: '#000',
    marginTop: hp('0.5%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingImage: {
    width: wp('20%'),
    height: wp('20%'),
    marginBottom: hp('3%'),
  },
  loadingText: {
    fontSize: wp('3%'),
    color: '#000',
  },
  noChallengeText: {
    fontSize: wp('5%'),
    color: '#666',
    textAlign: 'center',
    marginTop: hp('2%'),
  },
});

export default AdminChallengesScreen;
