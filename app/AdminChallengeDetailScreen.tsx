import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import moment from 'moment';
import * as Progress from 'react-native-progress';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';

type Challenge = {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  target_audience?: string;
  content?: string;
};

type Task = {
  id: number;
  task_name: string;
  task_description: string;
  challenge_id: number;
};

type AdminChallengeDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminChallengeDetailScreen'
>;

type AdminChallengeDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  'AdminChallengeDetailScreen'
>;

const AdminChallengeDetailScreen: React.FC = () => {
  const navigation = useNavigation<AdminChallengeDetailScreenNavigationProp>();
  const route = useRoute<AdminChallengeDetailScreenRouteProp>();
  const { challenge } = route.params;

  const [challengeData, setChallengeData] = useState<Challenge>(challenge);
  const [tasks, setTasks] = useState<Task[]>([]);

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
      const progressPercentage = Math.min(100, Math.round((timeElapsed / totalDuration) * 100));
      return { status: 'Ongoing', progressPercentage };
    }
  };

  const statusData = determineStatus(challengeData.start_date, challengeData.end_date);

  const fetchChallengeData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challenge.id)
        .single();

      if (error) {
        console.error('Error fetching challenge:', error);
        return;
      }

      if (data) {
        setChallengeData(data);
      }
    } catch (error) {
      console.error('Error fetching challenge data:', error);
    }
  }, [challenge.id]);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('challenge_id', challenge.id);

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      if (data) {
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [challenge.id]);

  useFocusEffect(
    useCallback(() => {
      fetchChallengeData();
      fetchTasks();
    }, [fetchChallengeData, fetchTasks])
  );

  const handleDeleteChallenge = async () => {
    Alert.alert(
      'Delete Challenge',
      'Are you sure you want to delete this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('challenges')
              .delete()
              .eq('id', challengeData.id);

            if (error) {
              Alert.alert('Error', 'Failed to delete the challenge');
            } else {
              Alert.alert('Success', 'Challenge deleted successfully!');
              navigation.goBack();
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={wp('6%')} color="#000" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.title}>{challengeData.title}</Text>

            <Text style={styles.statusText}>Status: {statusData.status}</Text>

            <View style={styles.dateContainer}>
              <View style={styles.dateBox}>
                <Icon name="calendar" size={wp('6%')} color="#00BFFF" />
                <Text style={styles.dateText}>Start Date: {challengeData.start_date}</Text>
              </View>
              <View style={styles.dateBox}>
                <Icon name="calendar" size={wp('6%')} color="#FF6347" />
                <Text style={styles.dateText}>End Date: {challengeData.end_date}</Text>
              </View>
            </View>

            {statusData.status === 'Ongoing' && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Challenge Progress</Text>
                <Progress.Bar
                  progress={statusData.progressPercentage / 100}
                  width={null}
                  color="#00BFFF"
                  unfilledColor="#e0e0e0"
                  borderWidth={0}
                  height={hp('1%')}
                  borderRadius={wp('2%')}
                />
                <Text style={styles.progressPercentage}>{statusData.progressPercentage}% Complete</Text>
              </View>
            )}

            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {challengeData.description || 'No description available for this challenge.'}
            </Text>

            <Text style={styles.descriptionTitle}>Content</Text>
            <Text style={styles.descriptionText}>
              {challengeData.content || 'No additional content available for this challenge.'}
            </Text>

            <Text style={styles.descriptionTitle}>Tasks</Text>
            {tasks.length > 0 ? (
              tasks.map(task => (
                <View key={task.id} style={styles.taskContainer}>
                  <Text style={styles.taskName}>{task.task_name}</Text>
                  <Text style={styles.taskDescription}>{task.task_description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noTasksText}>No tasks available for this challenge.</Text>
            )}

            <View style={styles.participantsContainer}>
              <Text style={styles.participantTitle}>Participants</Text>
              <Text style={styles.participantCount}>
                {challengeData.max_participants ? `${challengeData.max_participants} Participants` : 'No limit'}
              </Text>
            </View>

            <View style={styles.targetAudienceContainer}>
              <Text style={styles.targetAudienceTitle}>Target Audience</Text>
              <Text style={styles.targetAudienceText}>
                {challengeData.target_audience || 'No specific audience'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('AdminEditChallengeScreen', { challenge: challengeData })}
          >
            <Icon name="pencil" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Edit Challenge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteChallenge}>
            <Icon name="delete" size={wp('5%')} color="#fff" />
            <Text style={styles.buttonText}>Delete Challenge</Text>
          </TouchableOpacity>
        </View>
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
  headerContainer: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
    marginTop: hp('2%'),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: wp('2%'),
    borderRadius: wp('2%'),
  },
  backButtonText: {
    marginLeft: wp('2%'),
    fontSize: wp('4.5%'),
    color: '#000',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: hp('5%'),
  },
  content: {
    paddingTop: hp('2%'),
    paddingHorizontal: wp('4%'),
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginVertical: hp('2%'),
  },
  statusText: {
    fontSize: wp('4.5%'),
    color: '#FF6347',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  dateContainer: {
    marginBottom: hp('4%'),
    paddingHorizontal: wp('4%'),
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1%'),
    backgroundColor: '#fff',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('2%'),
  },
  dateText: {
    fontSize: wp('4.5%'),
    marginLeft: wp('2%'),
    color: '#000',
  },
  progressContainer: {
    marginBottom: hp('4%'),
    paddingHorizontal: wp('6%'),
    alignItems: 'center',
  },
  progressText: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: hp('1.5%'),
  },
  progressPercentage: {
    marginTop: hp('1%'),
    fontSize: wp('4%'),
    color: '#00BFFF',
  },
  descriptionTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: hp('1%'),
    paddingHorizontal: wp('4%'),
  },
  descriptionText: {
    fontSize: wp('4%'),
    color: '#000',
    lineHeight: hp('2.5%'),
    marginBottom: hp('3%'),
    paddingHorizontal: wp('4%'),
  },
  taskContainer: {
    marginBottom: hp('2%'),
    backgroundColor: '#f9f9f9',
    padding: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  taskName: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: hp('0.5%'),
  },
  taskDescription: {
    fontSize: wp('4%'),
    color: '#000',
    lineHeight: hp('2.2%'),
  },
  noTasksText: {
    fontSize: wp('4%'),
    color: '#888',
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  participantsContainer: {
    paddingHorizontal: wp('4%'),
  },
  participantTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: hp('1%'),
  },
  participantCount: {
    fontSize: wp('4.5%'),
    color: '#000',
    marginBottom: hp('3%'),
  },
  targetAudienceContainer: {
    paddingHorizontal: wp('4%'),
  },
  targetAudienceTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: hp('1%'),
  },
  targetAudienceText: {
    fontSize: wp('4.5%'),
    color: '#000',
    marginBottom: hp('3%'),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    backgroundColor: 'transparent',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BFFF',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3%'),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6347',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('3%'),
  },
  buttonText: {
    marginLeft: wp('2%'),
    fontSize: wp('4.5%'),
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminChallengeDetailScreen;
