import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ImageBackground } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LeaderboardScreen'>;
type RouteParams = {
  challengeId: number;
};

interface Participant {
  user_id: string;
  progress: {
    tasksCompleted: number;
    progressPercentage: number;
    current_task: number | null;
  };
  completion_time: string | null;
  users: {
    username: string;
    profile_picture: string | null;
  };
}

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { challengeId } = route.params as RouteParams;

  const [challengeTitle, setChallengeTitle] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const fetchChallengeTitle = async () => {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('title')
          .eq('id', challengeId)
          .single();

        if (error) {
          console.error('Error fetching challenge title:', error);
        } else if (data) {
          setChallengeTitle(data.title);
        }
      } catch (error) {
        console.error('Error fetching challenge title:', error);
      }
    };

    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('challenge_participants')
          .select(`
            user_id,
            progress,
            completion_time,
            users (username, profile_picture)
          `)
          .eq('challenge_id', challengeId);

        if (error) {
          console.error('Error fetching participants:', error);
        } else if (data) {
          const formattedParticipants: Participant[] = data
            .map((participant) => {
              let progressData;

              if (typeof participant.progress === 'string') {
                try {
                  progressData = JSON.parse(participant.progress);
                } catch (parseError) {
                  console.error('Error parsing progress JSON:', parseError);
                  progressData = { tasksCompleted: 0, progressPercentage: 0, current_task: null };
                }
              } else if (typeof participant.progress === 'object') {
                progressData = participant.progress;
              } else {
                progressData = { tasksCompleted: 0, progressPercentage: 0, current_task: null };
              }

              return {
                user_id: participant.user_id,
                progress: progressData,
                completion_time: participant.completion_time,
                users: participant.users as unknown as { username: string; profile_picture: string | null },
              };
            })
            .sort((a, b) => {
              if (b.progress.progressPercentage !== a.progress.progressPercentage) {
                return b.progress.progressPercentage - a.progress.progressPercentage;
              }
              if (a.completion_time && b.completion_time) {
                return new Date(a.completion_time).getTime() - new Date(b.completion_time).getTime();
              }
              return 0;
            });

          setParticipants(formattedParticipants);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchChallengeTitle();
    fetchParticipants();
  }, [challengeId]);

  return (
    <ImageBackground source={require('../assets/challenge.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        <View style={styles.challengeTitleContainer}>
          {challengeTitle ? (
            <Text style={styles.challengeTitle}>{challengeTitle}</Text>
          ) : (
            <Text style={styles.loadingTitle}>Loading...</Text>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Top participants in this challenge. Keep pushing to reach the top!</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Rank</Text>
          <Text style={styles.tableHeaderText}>Name</Text>
          <Text style={styles.tableHeaderText}>Progress</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {participants.map((participant, index) => (
            <View key={participant.user_id} style={styles.tableRow}>
              <View style={styles.rankContainer}>
                <Text
                  style={[
                    styles.rankText,
                    index < 3 ? styles.topThreeRankText : styles.defaultRankText,
                  ]}
                >
                  {index + 1}
                </Text>
                {index < 3 && (
                  <Ionicons
                    name={
                      index === 0 ? 'trophy' : index === 1 ? 'medal-outline' : 'medal'
                    }
                    size={20}
                    color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
                    style={styles.badgeIcon}
                  />
                )}
              </View>

              <View style={styles.profileContainer}>
                <Image
                  source={
                    participant.users.profile_picture
                      ? { uri: participant.users.profile_picture }
                      : require('../assets/default-profile.png')
                  }
                  style={styles.profileImage}
                />
                <Text style={styles.nameText}>{participant.users.username}</Text>
              </View>

              <Text style={styles.progressText}>{`${Math.floor(participant.progress.progressPercentage)}%`}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.footerNote}>Strive to be the best version of yourself!</Text>
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
    paddingTop: hp('6%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  backButton: {
    marginRight: wp('3%'),
    padding: wp('1%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#000',
  },
  challengeTitleContainer: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  challengeTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  loadingTitle: {
    fontSize: wp('4%'),
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: 'rgba(68, 68, 68, 0.8)',
    margin: wp('5%'),
    padding: wp('4%'),
    borderRadius: 10,
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#ddd',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#666',
  },
  tableHeaderText: {
    fontSize: wp('4.5%'),
    color: '#000',
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: wp('5%'),
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: wp('15%'),
  },
  rankText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topThreeRankText: {
    color: '#FFD700',
  },
  defaultRankText: {
    color: '#FFF',
  },
  badgeIcon: {
    marginLeft: wp('1%'),
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    marginRight: wp('2%'),
  },
  nameText: {
    fontSize: wp('4.5%'),
    color: '#FFF',
  },
  progressText: {
    fontSize: wp('4.5%'),
    color: '#FFF',
    fontWeight: 'bold',
    width: wp('15%'),
    textAlign: 'right',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: wp('4%'),
    color: '#FFF',
    marginTop: hp('3%'),
    fontStyle: 'italic',
  },
});

export default LeaderboardScreen;
