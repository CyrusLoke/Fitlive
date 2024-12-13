import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

type Challenge = {
  id: number;
  title: string;
  description?: string;
  content?: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  target_audience?: string;
  difficulty?: string;
  no_limit?: boolean;
};

type Task = {
  id?: number;
  task_name: string;
  task_description: string;
  challenge_id: number;
};

type AdminEditChallengeScreenRouteProp = RouteProp<{ params: { challenge: Challenge } }, 'params'>;

const AdminEditChallengeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AdminEditChallengeScreenRouteProp>();
  const { challenge } = route.params;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(challenge.start_date));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(challenge.end_date));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [difficulty, setDifficulty] = useState<string>(challenge.difficulty || 'Beginner');
  const [audience, setAudience] = useState<string>(challenge.target_audience || 'Everyone');
  const [maxParticipants, setMaxParticipants] = useState<string>(
    challenge.max_participants ? challenge.max_participants.toString() : ''
  );
  const [noLimit, setNoLimit] = useState(challenge.no_limit || challenge.max_participants === null);
  const [description, setDescription] = useState(challenge.description || '');
  const [content, setContent] = useState(challenge.content || '');
  const [title, setTitle] = useState(challenge.title);
  const [descriptionHeight, setDescriptionHeight] = useState(hp('12%'));
  const [contentHeight, setContentHeight] = useState(hp('12%'));

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
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
  };

  const handleAddTask = () => {
    setTasks([...tasks, { task_name: '', task_description: '', challenge_id: challenge.id }]);
  };

  const handleTaskChange = (index: number, field: 'task_name' | 'task_description', value: string) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (index: number) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, isStart: boolean) => {
    if (isStart) {
      setShowStartPicker(false);
      if (selectedDate) setStartDate(selectedDate);
    } else {
      setShowEndPicker(false);
      if (selectedDate) setEndDate(selectedDate);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleSaveChanges = async () => {
    if (!title || !description || !startDate || !endDate || !content) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Error', 'End date cannot be earlier than the start date.');
      return;
    }

    if (!noLimit && (!maxParticipants || isNaN(Number(maxParticipants)) || Number(maxParticipants) <= 0)) {
      Alert.alert('Error', 'Please enter a valid number for Max Participants.');
      return;
    }

    const participantsValue = noLimit ? null : Number(maxParticipants);

    const updatedChallenge = {
      title,
      description,
      content,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      max_participants: participantsValue,
      target_audience: audience,
      difficulty,
      no_limit: noLimit,
    };

    const { error: challengeError } = await supabase
      .from('challenges')
      .update(updatedChallenge)
      .eq('id', challenge.id);

    if (challengeError) {
      Alert.alert('Error', 'There was an error updating the challenge.');
      console.error('Error updating challenge:', challengeError);
      return;
    }

  const { error: tasksError } = await supabase
    .from('tasks')
    .upsert(tasks, { onConflict: 'id' });
  

    if (tasksError) {
      Alert.alert('Error', 'There was an error updating tasks.');
      console.error('Error updating tasks:', tasksError);
    } else {
      Alert.alert('Success', 'Challenge and tasks updated successfully!');
      navigation.goBack();
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Challenge</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Challenge Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#bbb"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Challenge Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { height: descriptionHeight }]}
                placeholder="Description"
                placeholderTextColor="#bbb"
                multiline
                value={description}
                onChangeText={setDescription}
                onContentSizeChange={(e) => setDescriptionHeight(e.nativeEvent.contentSize.height)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dynamic Content</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { height: contentHeight }]}
                placeholder="Add instructions, tips, or any content..."
                placeholderTextColor="#bbb"
                multiline
                value={content}
                onChangeText={setContent}
                onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
              />
            </View>

            <Text style={styles.label}>Tasks</Text>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskContainer}>
                <TextInput
                  placeholder="Task Name"
                  value={task.task_name}
                  onChangeText={(value) => handleTaskChange(index, 'task_name', value)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Task Description"
                  value={task.task_description}
                  onChangeText={(value) => handleTaskChange(index, 'task_description', value)}
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => handleDeleteTask(index)} style={styles.deleteTaskButton}>
                  <Icon name="delete" size={wp('6%')} color="#ff6347" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddTask} style={styles.addTaskButton}>
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Select Challenge Dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateSubLabel}>Start Date</Text>
                <TouchableOpacity style={styles.datePicker} onPress={() => setShowStartPicker(true)}>
                  <Icon name="calendar" size={wp('5%')} color="#555" />
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange(event, date, true)}
                  />
                )}
              </View>

              <View style={styles.dateColumn}>
                <Text style={styles.dateSubLabel}>End Date</Text>
                <TouchableOpacity style={styles.datePicker} onPress={() => setShowEndPicker(true)}>
                  <Icon name="calendar" size={wp('5%')} color="#555" />
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => handleDateChange(event, date, false)}
                  />
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Max Participants</Text>
              <View style={styles.maxParticipantsContainer}>
                <TextInput
                  style={[styles.input, styles.maxParticipantsInput, noLimit && styles.disabledInput]}
                  placeholder="Enter number"
                  placeholderTextColor="#bbb"
                  keyboardType="numeric"
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  editable={!noLimit}
                />
                <TouchableOpacity style={styles.noLimitButton} onPress={() => setNoLimit(!noLimit)}>
                  <Text style={styles.noLimitButtonText}>{noLimit ? 'Disable No Limit' : 'No Limit'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select Difficulty</Text>
              <Picker
                selectedValue={difficulty}
                onValueChange={(itemValue) => setDifficulty(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Beginner" value="Beginner" />
                <Picker.Item label="Intermediate" value="Intermediate" />
                <Picker.Item label="Advanced" value="Advanced" />
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Target Audience</Text>
              <Picker
                selectedValue={audience}
                onValueChange={(itemValue) => setAudience(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Everyone" value="Everyone" />
                <Picker.Item label="Men" value="Men" />
                <Picker.Item label="Women" value="Women" />
                <Picker.Item label="Children" value="Children" />
              </Picker>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  scrollContainer: {
    paddingBottom: hp('5%'),
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('4%'),
    marginBottom: hp('3%'),
    paddingHorizontal: wp('5%'),
  },
  backButton: {
    marginRight: wp('2%'),
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: '700',
    color: '#000',
  },
  formContainer: {
    flex: 1,
    padding: wp('5%'),
  },
  inputContainer: {
    marginBottom: hp('2%'),
  },
  label: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    fontSize: wp('4%'),
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  maxParticipantsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maxParticipantsInput: {
    flex: 1,
    marginRight: wp('3%'),
  },
  noLimitButton: {
    padding: wp('3%'),
    backgroundColor: '#28a745',
    borderRadius: wp('3%'),
  },
  noLimitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#e0e0e0',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  dateColumn: {
    width: '48%',
  },
  datePicker: {
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: wp('4%'),
    color: '#555',
    marginLeft: wp('2%'),
  },
  dateSubLabel: {
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  pickerContainer: {
    marginBottom: hp('2%'),
  },
  picker: {
    height: hp('6%'),
    width: '100%',
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: wp('2%'),
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('3%'),
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#28a745',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    marginLeft: wp('2%'),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('3%'),
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  taskContainer: {
    marginBottom: hp('2%'),
    backgroundColor: '#f9f9f9',
    padding: hp('1.5%'),
    borderRadius: wp('2%'),
  },
  deleteTaskButton: {
    alignSelf: 'flex-end',
    marginTop: hp('1%'),
  },
  addTaskButton: {
    backgroundColor: '#007bff',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  addTaskButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminEditChallengeScreen;
