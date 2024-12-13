import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { Ionicons } from '@expo/vector-icons';
import { RadioButton } from 'react-native-paper';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MomentReportScreen'>;

const MomentReportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { momentId } = route.params as { momentId: number };
  
  const [reportReason, setReportReason] = useState<string>('');
  const [additionalComment, setAdditionalComment] = useState<string>('');
  const [momentData, setMomentData] = useState<{ caption: string; image_base64: string | null } | null>(null);

  const fetchMomentData = async () => {
    const { data, error } = await supabase
      .from('moments')
      .select('caption, image_base64')
      .eq('id', momentId)
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to load moment data.');
      console.error('Error fetching moment:', error);
    } else {
      setMomentData(data);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportReason) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      return;
    }

    const { error } = await supabase.from('reports').insert([
      {
        moment_id: momentId,
        reason: reportReason,
        additional_comment: additionalComment || null,
      },
    ]);

    if (error) {
      Alert.alert('Error', 'Failed to submit report.');
      console.error('Error submitting report:', error);
    } else {
      Alert.alert('Report Submitted', 'Thank you for reporting. We’ll review this moment soon.');
      navigation.goBack();
    }
  };

  useEffect(() => {
    fetchMomentData();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={hp('3%')} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Report Moment</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {momentData && (
          <View style={styles.previewContainer}>
            {momentData.image_base64 ? (
              <Image source={{ uri: `data:image/png;base64,${momentData.image_base64}` }} style={styles.previewImage} />
            ) : null}
            <Text style={styles.previewCaption}>{momentData.caption}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Reason for Reporting</Text>
        <View style={styles.radioGroup}>
          {[
            'Inappropriate Content',
            'Spam or Misleading',
            'Harassment',
            'Hate Speech',
            'Violence or Dangerous Behavior',
            'Misinformation',
            'Other'
          ].map((reason) => (
            <TouchableOpacity key={reason} style={styles.radioItem} onPress={() => setReportReason(reason)}>
              <RadioButton
                value={reason}
                status={reportReason === reason ? 'checked' : 'unchecked'}
                onPress={() => setReportReason(reason)}
                color="#e91e63"
              />
              <Text style={styles.radioText}>{reason}</Text>
            </TouchableOpacity>
          ))}
          {reportReason === 'Other' && (
            <TextInput
              style={styles.customReasonInput}
              placeholder="Please specify..."
              placeholderTextColor="#888"
              value={additionalComment}
              onChangeText={setAdditionalComment}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Additional Comments (Optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Add any additional information..."
          placeholderTextColor="#888"
          multiline
          value={additionalComment}
          onChangeText={setAdditionalComment}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleReportSubmit}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: hp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    marginBottom: hp('2%'),
  },
  backButton: {
    marginRight: wp('2%'),
  },
  title: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('2%'),
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  previewImage: {
    width: wp('40%'),
    height: wp('40%'),
    borderRadius: 10,
    marginBottom: hp('1%'),
  },
  previewCaption: {
    fontSize: hp('2%'),
    color: '#555',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: hp('2.2%'),
    fontWeight: '600',
    color: '#333',
    marginVertical: hp('1%'),
  },
  radioGroup: {
    marginBottom: hp('2%'),
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  radioText: {
    fontSize: hp('2%'),
    color: '#333',
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    fontSize: hp('2%'),
    color: '#333',
    marginTop: hp('1%'),
    backgroundColor: '#f5f5f5',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    fontSize: hp('2%'),
    color: '#333',
    height: hp('12%'),
    backgroundColor: '#f5f5f5',
    marginBottom: hp('2%'),
  },
  submitButton: {
    backgroundColor: '#e91e63',
    paddingVertical: hp('2%'),
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: hp('2%'),
    fontWeight: 'bold',
  },
});

export default MomentReportScreen;
