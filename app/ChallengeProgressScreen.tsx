import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, Image, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import moment from 'moment';
import { supabase } from '../supabaseClient';
import ConfettiCannon from 'react-native-confetti-cannon';

type RouteParams = {
  challengeId: number;
};

export type RootStackParamList = {
  ChallengeProgressScreen: { challengeId: number };
  SubmitChallengeProgressScreen: { taskId: number };
  LeaderboardScreen: { challengeId: number };
};

type ChallengeProgressScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChallengeProgressScreen'
>;

type ChallengeProgressScreenRouteProp = RouteProp<RootStackParamList, 'ChallengeProgressScreen'>;

type ChallengeDetails = {
  title: string;
  start_date: string;
  end_date: string;
  difficulty: string;
  participants: number | null;
};

type TaskDetails = {
  id: number;
  task_name: string;
  task_description: string;
};

const ChallengeProgressScreen: React.FC = () => {
  const navigation = useNavigation<ChallengeProgressScreenNavigationProp>();
  const route = useRoute<ChallengeProgressScreenRouteProp>();
  const { challengeId } = route.params;

  const [userId, setUserId] = useState<string | null>(null);
  const [challengeDetails, setChallengeDetails] = useState<ChallengeDetails | null>(null);
  const [tasks, setTasks] = useState<TaskDetails[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ username: string; progressPercentage: number }[]>([]);

  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting user session:', error);
          return;
        }

        if (data.session?.user?.id) {
          setUserId(data.session.user.id);
        } else {
          console.error('No user is logged in.');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    getCurrentUserId();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchChallengeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('title, start_date, end_date, difficulty, max_participants')
          .eq('id', challengeId)
          .single();

        if (error) {
          console.error('Error fetching challenge details:', error);
        } else {
          setChallengeDetails({
            title: data.title,
            start_date: data.start_date,
            end_date: data.end_date,
            difficulty: data.difficulty,
            participants: data.max_participants,
          });
        }
      } catch (error) {
        console.error('Error fetching challenge details:', error);
      }
    };

    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, task_name, task_description')
          .eq('challenge_id', challengeId);

        if (error) {
          console.error('Error fetching tasks:', error);
        } else if (data && data.length > 0) {
          setTasks(data);
        } else {
          console.error('No tasks found for this challenge.');
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('challenge_participants')
          .select('progress')
          .eq('challenge_id', challengeId)
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching progress:', error);
        } else if (data) {
          try {
            const progress = typeof data.progress === 'string' ? JSON.parse(data.progress) : data.progress;
            const { tasksCompleted = 0, progressPercentage = 0 } = progress;

            setProgressPercentage(Math.floor(progressPercentage));
            setCurrentTaskIndex(tasksCompleted);

            if (Math.floor(progressPercentage) === 100) {
              setShowCompletionModal(true);
            }
          } catch (parseError) {
            console.error('Error parsing progress JSON:', parseError);
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('challenge_participants')
          .select('user_id, progress, completion_time')
          .eq('challenge_id', challengeId);

        if (error) {
          console.error('Error fetching leaderboard data:', error);
          return;
        }

        const formattedLeaderboard = await Promise.all(
          data.map(async (participant) => {
            const progress = typeof participant.progress === 'string' ? JSON.parse(participant.progress) : participant.progress;
            const userResponse = await supabase
              .from('users')
              .select('username, profile_picture')
              .eq('id', participant.user_id)
              .single();

            const username = userResponse.data?.username || 'Unknown User';
            const profilePicture = userResponse.data?.profile_picture || ''; // Base64 profile picture

            return {
              username,
              profilePicture,
              progressPercentage: Math.floor(progress.progressPercentage) || 0, // Round down to nearest whole number
              completionTime: participant.completion_time,
            };
          })
        );

        // Sort by progressPercentage, then by completionTime
        formattedLeaderboard.sort((a, b) => {
          if (b.progressPercentage === a.progressPercentage) {
            return new Date(a.completionTime).getTime() - new Date(b.completionTime).getTime();
          }
          return b.progressPercentage - a.progressPercentage;
        });

        // Get the top 3 participants
        const top3Leaderboard = formattedLeaderboard.slice(0, 3);
        setLeaderboard(top3Leaderboard);
      } catch (error) {
        console.error('Error parsing leaderboard data:', error);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await fetchChallengeDetails();
      await fetchTasks();
      await fetchProgress();
      await fetchLeaderboard();
      setLoading(false);
    };

    fetchData();
  }, [challengeId, userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
        <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
      </View>
    );
  }

  const currentTask = tasks[currentTaskIndex];

  return (
    <ImageBackground source={require('../assets/challenge.png')} style={styles.backgroundImage}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={wp('6%')} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{challengeDetails?.title || 'Challenge Progress'}</Text>
          </View>

          {/* Overall Progress Card */}
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{progressPercentage}% Complete</Text>
          </View>

          {/* Challenge Details */}
          {challengeDetails && (
            <View style={styles.challengeDetails}>
              <Text style={styles.sectionTitleBlack}>Challenge Details</Text>
              <View style={styles.ChallengeCard}>
                <Text style={styles.challengeText}>
                  Date: {moment(challengeDetails.start_date).format('MMM D, YYYY')} - {moment(challengeDetails.end_date).format('MMM D, YYYY')}
                </Text>
                <Text style={styles.challengeText}>Difficulty: {challengeDetails.difficulty}</Text>
                <Text style={styles.challengeText}>
                  Participants: {challengeDetails.participants ? challengeDetails.participants : 'No Limit'}
                </Text>
              </View>
            </View>
          )}

          {/* Task Section */}
          {currentTask && progressPercentage < 100 && (
            <View style={styles.taskSection}>
              <Text style={styles.sectionTitleBlack}>Current Task</Text>
              <View style={styles.taskCard}>
                <Text style={styles.taskName}>{currentTask.task_name}</Text>
                <Text style={styles.taskDescription}>{currentTask.task_description}</Text>
              </View>
            </View>
          )}

          {/* Submit Progress Button - Hide if progress is 100% */}
          {progressPercentage < 100 && (
            <View style={styles.submitProgressContainer}>
              <TouchableOpacity
                style={styles.submitProgressButton}
                onPress={() => navigation.navigate('SubmitChallengeProgressScreen', { taskId: currentTask?.id })}
              >
                <Text style={styles.submitProgressText}>Submit Progress</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Leaderboard Section */}
          <View style={styles.leaderboardSection}>
            <Text style={styles.sectionTitleBlack}>Leaderboard</Text>
            <View style={styles.leaderboardCard}>
              {leaderboard.map((participant, index) => (
                <Text key={index} style={styles.rankText}>
                  {index + 1}. {participant.username} - {participant.progressPercentage}%
                </Text>
              ))}
            </View>
            <TouchableOpacity
              style={styles.viewLeaderboardButton}
              onPress={() => navigation.navigate('LeaderboardScreen', { challengeId })} // Pass challengeId to LeaderboardScreen
            >
              <Text style={styles.viewLeaderboardText}>View Full Leaderboard</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Note */}
          <Text style={styles.footerNote}>Keep pushing forward and complete each task to stay on top!</Text>

          {/* Completion Modal */}
          {showCompletionModal && (
            <Modal
              transparent
              visible={showCompletionModal}
              animationType="fade"
              onRequestClose={() => setShowCompletionModal(false)}
            >
              <View style={styles.modalContainer}>
                <Text style={styles.congratsText}>Congratulations!</Text>
                <Text style={styles.congratsSubText}>You've completed the challenge!</Text>
                <ConfettiCannon count={200} origin={{ x: wp('50%'), y: -hp('5%') }} />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCompletionModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('4%'),
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('3%'),
  },
  backButton: {
    backgroundColor: '#fff',
    padding: wp('2.5%'),
    borderRadius: wp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: wp('6.5%'),
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#F7F7F7',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    marginBottom: hp('4%'),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  progressTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '600',
    color: '#000',
    marginBottom: hp('1.5%'),
  },
  progressBarContainer: {
    width: '100%',
    height: hp('2%'),
    backgroundColor: '#E0E0E0',
    borderRadius: wp('1%'),
    overflow: 'hidden',
    marginBottom: hp('1.5%'),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressPercentage: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#4CAF50',
  },
  challengeDetails: {
    marginBottom: hp('4%'),
  },
  ChallengeCard: {
    backgroundColor: '#FFF',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: hp('2%'),
  },
  sectionTitleBlack: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: hp('2%'),
  },
  challengeText: {
    fontSize: wp('4.5%'),
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  taskSection: {
    marginBottom: hp('4%'),
  },
  taskCard: {
    backgroundColor: '#FFF',
    padding: wp('5%'),
    borderRadius: wp('3%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  taskName: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  taskDescription: {
    fontSize: wp('4%'),
    color: '#555',
    lineHeight: hp('2.5%'),
  },
  submitProgressContainer: {
    marginBottom: hp('4%'),
    alignItems: 'center',
  },
  submitProgressButton: {
    backgroundColor: '#FF5733',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('10%'),
    borderRadius: wp('3%'),
  },
  submitProgressText: {
    color: '#FFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  leaderboardSection: {
    marginBottom: hp('4%'),
  },
  leaderboardCard: {
    backgroundColor: '#FFF',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: hp('2%'),
  },
  rankText: {
    fontSize: wp('4.5%'),
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  viewLeaderboardButton: {
    alignSelf: 'center',
    backgroundColor: '#3b5998',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('2%'),
  },
  viewLeaderboardText: {
    color: '#FFF',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: wp('4%'),
    color: '#FFF',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: wp('5%'),
  },
  congratsText: {
    fontSize: wp('6.5%'),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: hp('2%'),
  },
  congratsSubText: {
    fontSize: wp('5%'),
    color: '#FFF',
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  closeButton: {
    backgroundColor: '#FF5733',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('10%'),
    borderRadius: wp('3%'),
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ChallengeProgressScreen;
