import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ImageBackground, Image, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen'; // Import responsive screen
import { supabase } from '../supabaseClient';

// Define route parameters type
type RouteParams = {
  taskId: number;
};

type SubmitChallengeProgressScreenRouteProp = RouteProp<{ params: RouteParams }, 'params'>;

type TaskDetails = {
  task_name: string;
  task_description: string;
};

const SubmitChallengeProgressScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<SubmitChallengeProgressScreenRouteProp>();
  const { taskId } = route.params;

  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null);
  const [description, setDescription] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const [proofType, setProofType] = useState<'image' | 'video' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null); // New state for status
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch the user ID from Supabase
  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.user?.id) {
        console.error('Error fetching user ID:', error);
        return;
      }
      setUserId(data.session.user.id);
    };
    fetchUserId();
  }, []);

  // Fetch the task details and existing submission from the database
  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('task_name, task_description')
          .eq('id', taskId)
          .single();

        if (error) {
          console.error('Error fetching task details:', error);
        } else {
          setTaskDetails(data);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      }
    };

    const fetchSubmission = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('challenge_submissions')
          .select('id, proof, description, status')
          .eq('user_id', userId)
          .eq('task_id', taskId)
          .maybeSingle(); // Use maybeSingle to allow for no rows without an error

        if (error) {
          console.error('Error fetching submission:', error);
        } else if (data) {
          // If a submission exists, populate the state
          setSubmissionId(data.id);
          setDescription(data.description);
          setProof(data.proof);
          setStatus(data.status); // Set the status
          setProofType(data.proof.startsWith('/9j/') ? 'image' : 'video'); // Check if proof is an image or video
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
      } finally {
        setLoading(false); // Set loading to false once data is loaded
      }
    };

    fetchTaskDetails();
    fetchSubmission();
  }, [taskId, userId]);

  // Handle image or video upload and convert to Base64
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const type = result.assets[0].type;

      // Convert to Base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      setProof(base64);
      setProofType(type === 'image' ? 'image' : 'video');
    }
  };

  // Handle submission (update if an existing submission exists)
  const handleSubmit = async () => {
    if (!userId || !taskId || !proof || !description) {
      Alert.alert('Error', 'Please fill in all fields and upload proof.');
      return;
    }

    try {
      if (submissionId) {
        // Update existing submission with new submission time
        const { error } = await supabase
          .from('challenge_submissions')
          .update({
            proof,
            description,
            status: 'pending',
            submission_time: new Date().toISOString(), // Refresh submission time
          })
          .eq('id', submissionId);

        if (error) {
          Alert.alert('Error', 'Failed to update the proof. Please try again.');
          console.error('Error updating submission:', error);
        } else {
          Alert.alert('Success', 'Proof updated successfully!');
          navigation.goBack();
        }
      } else {
        // Insert new submission
        const { error } = await supabase.from('challenge_submissions').insert([
          {
            user_id: userId,
            task_id: taskId,
            proof,
            description,
            status: 'pending',
            submission_time: new Date().toISOString(), // Set new submission time
          },
        ]);

        if (error) {
          Alert.alert('Error', 'Failed to submit proof. Please try again.');
          console.error('Error uploading submission:', error);
        } else {
          Alert.alert('Success', 'Proof submitted successfully!');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error handling submission:', error);
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
    <ImageBackground source={require('../assets/white.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Progress</Text>
        </View>

        {/* Main Content */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* Current Task Details */}
          {taskDetails && (
            <View style={styles.taskDetailsSection}>
              <Text style={styles.taskTitle}>{taskDetails.task_name}</Text>
              <Text style={styles.taskDescription}>{taskDetails.task_description}</Text>
            </View>
          )}

          {/* Message if Submission is Declined */}
          {status === 'decline' && (
            <Text style={styles.declinedMessage}>
              Your previous submission was declined. Please review and resubmit.
            </Text>
          )}

          {/* Image/Video Upload Section */}
          <View style={styles.imageUploadSection}>
            <TouchableOpacity style={styles.imageUploadButton} onPress={handlePickImage}>
              {proof ? (
                proofType === 'image' ? (
                  <Image source={{ uri: `data:image/png;base64,${proof}` }} style={styles.proofPreview} />
                ) : (
                  <Video
                    source={{ uri: `data:video/mp4;base64,${proof}` }}
                    style={styles.proofPreview}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                  />
                )
              ) : (
                <>
                  <Icon name="camera-plus" size={wp('10%')} color="#FF5733" />
                  <Text style={styles.imageUploadText}>Upload Proof</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Informational Text */}
          <Text style={styles.infoText}>
            You can edit your submission anytime before the admin reviews it.
          </Text>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Describe your progress..."
              placeholderTextColor="#aaa"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Proof</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    paddingVertical: wp('4%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: wp('4%'),
  },
  backButton: {
    padding: wp('3%'),
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: wp('6%'),
    color: '#333',
    fontWeight: '700',
    marginLeft: wp('2%'),
  },
  content: {
    alignItems: 'center',
  },
  taskDetailsSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: wp('4%'),
    marginBottom: wp('5%'),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: wp('5.5%'),
    fontWeight: 'bold',
    color: '#FF5733',
    marginBottom: wp('2%'),
  },
  taskDescription: {
    fontSize: wp('4%'),
    color: '#555',
    lineHeight: wp('5%'),
  },
  declinedMessage: {
    fontSize: wp('4.5%'),
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: wp('4%'),
  },
  imageUploadSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: wp('5%'),
  },
  imageUploadButton: {
    width: wp('60%'),
    height: wp('35%'),
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF5733',
    borderStyle: 'dashed',
  },
  imageUploadText: {
    color: '#FF5733',
    fontSize: wp('4%'),
    marginTop: wp('2%'),
  },
  proofPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#888',
    textAlign: 'center',
    marginVertical: wp('3%'),
  },
  inputContainer: {
    width: '100%',
    marginBottom: wp('5%'),
  },
  inputLabel: {
    fontSize: wp('4.5%'),
    color: '#333',
    marginBottom: wp('2%'),
  },
  textInput: {
    width: '100%',
    minHeight: wp('20%'),
    backgroundColor: '#fff',
    color: '#333',
    padding: wp('4%'),
    borderRadius: 10,
    fontSize: wp('4%'),
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButton: {
    backgroundColor: '#FF5733',
    paddingVertical: wp('3%'),
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: wp('5%'),
    fontWeight: 'bold',
  },
});

export default SubmitChallengeProgressScreen;
