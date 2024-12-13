import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ImageBackground, Image, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { Video, ResizeMode } from 'expo-av';

interface ChallengeSubmission {
  id: string;
  user_id: string;
  submission_time: string;
  proof: string;
  status: string;
  description: string;
  task: {
    id: number;
    task_name: string;
    task_description: string;
    challenge_id: number;
    challenge?: {
      title: string;
    };
  };
}

const AdminChallengeTaskApprovalScreen: React.FC = () => {
  const navigation = useNavigation();
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<{ type: 'image' | 'video'; content: string } | null>(null);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select(`
          id,
          user_id,
          submission_time,
          proof,
          status,
          description,
          task:task_id (
            id,
            task_name,
            task_description,
            challenge_id,
            challenge:challenge_id (title)
          )
        `)
        .eq('status', 'pending')
        .order('submission_time', { ascending: true }); // Sort submissions by submission_time in ascending order

      if (error) {
        console.error('Error fetching submissions:', error);
      } else {
        setSubmissions(data as unknown as ChallengeSubmission[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const isImage = (base64: string) => {
    return base64.startsWith('/9j/') || base64.startsWith('iVBOR') || base64.startsWith('R0lGOD');
  };

  const openModal = (type: 'image' | 'video', content: string) => {
    setModalContent({ type, content });
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setModalContent(null);
  };

  const updateStatus = async (
    id: string,
    newStatus: string,
    userId: string,
    currentTaskId: number,
    challengeId: number,
    submissionTime: string // Pass submissionTime as a parameter
  ) => {
    try {
      // Update the submission status
      const { error: updateError } = await supabase
        .from('challenge_submissions')
        .update({ status: newStatus })
        .eq('id', id);
  
      if (updateError) {
        Alert.alert('Error', `Failed to update status to ${newStatus}. Please try again.`);
        console.error('Error updating status:', updateError);
        return;
      }
  
      if (newStatus === 'approve') {
        // Fetch the current progress of the user
        const { data: participant, error: participantError } = await supabase
          .from('challenge_participants')
          .select('progress')
          .eq('user_id', userId)
          .eq('challenge_id', challengeId)
          .single();
  
        if (participantError || !participant) {
          console.error('Error fetching user progress:', participantError);
          Alert.alert('Error', 'Failed to fetch user progress. Please try again.');
          return;
        }
  
        // Parse the progress JSON
        let progressData = typeof participant.progress === 'string'
          ? JSON.parse(participant.progress)
          : participant.progress;
  
        // Update tasksCompleted
        progressData.tasksCompleted = (progressData.tasksCompleted || 0) + 1;
  
        // Calculate the progress percentage
        const { data: totalTasks, error: totalTasksError } = await supabase
          .from('tasks')
          .select('id')
          .eq('challenge_id', challengeId);
  
        if (totalTasksError || !totalTasks) {
          console.error('Error fetching total tasks:', totalTasksError);
          Alert.alert('Error', 'Failed to fetch total tasks. Please try again.');
          return;
        }
  
        const totalTasksCount = totalTasks.length;
        progressData.progressPercentage = Math.min(
          (progressData.tasksCompleted / totalTasksCount) * 100,
          100
        );
  
        // Update the progress and completion_time in the database
        const { error: progressUpdateError } = await supabase
          .from('challenge_participants')
          .update({
            progress: JSON.stringify(progressData),
            completion_time: submissionTime, // Always update completion_time
          })
          .eq('user_id', userId)
          .eq('challenge_id', challengeId);
  
        if (progressUpdateError) {
          console.error('Error updating progress:', progressUpdateError);
          Alert.alert('Error', 'Failed to update user progress. Please try again.');
        } else {
          Alert.alert('Success', 'Task approved and progress updated successfully!');
        }
      } else {
        Alert.alert('The submission has been declined.');
      }
  
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
        <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={hp('3%')} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Approvals</Text>
        </View>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <View key={submission.id} style={styles.taskCard}>
                {submission.task.challenge ? (
                  <Text style={styles.challengeTitle}>Challenge: {submission.task.challenge.title}</Text>
                ) : (
                  <Text style={styles.challengeTitle}>Challenge: N/A</Text>
                )}
                <Text style={styles.taskName}>
                  Task: {submission.task.task_name}
                </Text>
                <Text style={styles.taskDescription}>{submission.task.task_description}</Text>
                <Text style={styles.uploadTime}>
                  Upload Time: {format(new Date(submission.submission_time), "MMM do, yyyy 'at' hh:mm:ss a")}
                </Text>
                <Text style={styles.userDescription}>
                  User's Description: "{submission.description}"
                </Text>
                <TouchableOpacity
                  style={styles.proofContainer}
                  onPress={() => openModal(isImage(submission.proof) ? 'image' : 'video', submission.proof)}
                >
                  {isImage(submission.proof) ? (
                    <Image
                      style={styles.proofImage}
                      source={{ uri: `data:image/png;base64,${submission.proof}` }}
                    />
                  ) : (
                    <Video
                      style={styles.proofVideo}
                      source={{ uri: `data:video/mp4;base64,${submission.proof}` }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                    />
                  )}
                </TouchableOpacity>
                <Text style={styles.proofLabel}>Proof Photo/Video</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      updateStatus(
                        submission.id,
                        'approve',
                        submission.user_id,
                        submission.task.id,
                        submission.task.challenge_id,
                        submission.submission_time // Pass submissionTime as the sixth argument
                      )
                    }
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      updateStatus(
                        submission.id,
                        'decline',
                        submission.user_id,
                        submission.task.id,
                        submission.task.challenge_id,
                        submission.submission_time // Pass submissionTime as the sixth argument
                      )
                    }
                  >
                    <Text style={styles.buttonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noTasksText}>No pending tasks at the moment.</Text>
          )}
        </ScrollView>

        {/* Full-Screen Modal for Image/Video */}
        {modalContent && (
          <Modal visible={isModalVisible} transparent={true} animationType="fade">
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              {modalContent.type === 'image' ? (
                <Image
                  style={styles.fullScreenImage}
                  source={{ uri: `data:image/png;base64,${modalContent.content}` }}
                />
              ) : (
                <Video
                  style={styles.fullScreenVideo}
                  source={{ uri: `data:video/mp4;base64,${modalContent.content}` }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                />
              )}
            </View>
          </Modal>
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: wp('5%'),
    borderBottomRightRadius: wp('5%'),
  },
  backButton: {
    marginRight: wp('3%'),
    marginTop: hp('1%'),
  },
  headerTitle: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#fff',
    marginTop: hp('1%'),
  },
  contentContainer: {
    padding: wp('4%'),
  },
  taskCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  challengeTitle: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  taskName: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: hp('1%'),
  },
  taskDescription: {
    fontSize: hp('1.8%'),
    color: '#555',
    marginBottom: hp('1%'),
  },
  uploadTime: {
    fontSize: hp('1.8%'),
    color: '#777',
    marginBottom: hp('1%'),
  },
  userDescription: {
    fontSize: hp('1.8%'),
    color: '#333',
    fontStyle: 'italic',
    marginBottom: hp('2%'),
  },
  proofContainer: {
    borderRadius: wp('3%'),
    borderWidth: 2,
    borderColor: '#FF5733',
    padding: wp('2%'),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofImage: {
    width: '100%',
    height: hp('25%'),
    borderRadius: wp('2%'),
    resizeMode: 'cover',
  },
  proofVideo: {
    width: '100%',
    height: hp('25%'),
    borderRadius: wp('2%'),
  },
  proofLabel: {
    fontSize: hp('1.8%'),
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  noTasksText: {
    fontSize: hp('2.2%'),
    color: '#888',
    textAlign: 'center',
    marginTop: hp('5%'),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#28a745',
    borderRadius: wp('2%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    elevation: 2,
  },
  declineButton: {
    backgroundColor: '#dc3545',
    borderRadius: wp('2%'),
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
    elevation: 2,
  },
  buttonText: {
    fontSize: hp('2%'),
    color: '#fff',
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  modalCloseText: {
    color: '#333',
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  fullScreenVideo: {
    width: '90%',
    height: '80%',
  },
});

export default AdminChallengeTaskApprovalScreen;
