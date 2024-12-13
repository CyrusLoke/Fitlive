import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';

type AdminCreateChallengeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminCreateChallengeScreen'
>;

const AdminCreateChallengeScreen: React.FC = () => {
  const navigation = useNavigation<AdminCreateChallengeScreenNavigationProp>();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [difficulty, setDifficulty] = useState<string>('Beginner');
  const [audience, setAudience] = useState<string>('Everyone');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [noLimit, setNoLimit] = useState(false);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [inputHeight, setInputHeight] = useState(hp('12%'));
  const [title, setTitle] = useState<string>('');
  const [tasks, setTasks] = useState([{ name: '', description: '' }]);

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
    if (!date) return 'Select Date';
    return date.toISOString().split('T')[0];
  };

  const handleAddTask = () => {
    setTasks([...tasks, { name: '', description: '' }]);
  };

  const handleTaskChange = (index: number, field: 'name' | 'description', value: string) => {
    const updatedTasks = tasks.map((task, i) => (i === index ? { ...task, [field]: value } : task));
    setTasks(updatedTasks);
  };

  const handleCreateChallenge = async () => {
    let errorMessages = [];

    if (!title) {
      errorMessages.push('Challenge title is required.');
    }
    if (!description) {
      errorMessages.push('Challenge description is required.');
    }
    if (!content) {
      errorMessages.push('Challenge content is required.');
    }
    if (!startDate) {
      errorMessages.push('Start date is required.');
    }
    if (!endDate) {
      errorMessages.push('End date is required.');
    } else if (endDate && startDate && endDate < startDate) {
      errorMessages.push('End date cannot be earlier than the start date.');
    }

    const validTasks = tasks.filter(task => task.name.trim() !== '' && task.description.trim() !== '');
    if (validTasks.length === 0) {
      errorMessages.push('Please add at least one task with a name and description.');
    }

    if (!noLimit && (!maxParticipants || isNaN(Number(maxParticipants)))) {
      errorMessages.push('Please enter a valid number for max participants.');
    }

    if (errorMessages.length > 0) {
      Alert.alert('Error', errorMessages.join('\n'));
      return;
    }

    const challengeData = {
      title,
      description,
      content,
      start_date: formatDate(startDate || new Date()),
      end_date: formatDate(endDate || new Date()),
      max_participants: noLimit ? null : Number(maxParticipants),
      no_limit: noLimit,
      difficulty,
      target_audience: audience,
    };

    const { data: challengeDataResponse, error: challengeError } = await supabase
      .from('challenges')
      .insert([challengeData])
      .select()
      .single();

    if (challengeError) {
      Alert.alert('Error', 'There was an error creating the challenge.');
      console.error('Error inserting challenge:', challengeError);
      return;
    }

    const challengeId = challengeDataResponse.id;

    const { error: tasksError } = await supabase.from('tasks').insert(
      validTasks.map(task => ({
        challenge_id: challengeId,
        task_name: task.name,
        task_description: task.description,
      }))
    );

    if (tasksError) {
      Alert.alert('Error', 'Failed to add tasks.');
      console.error('Error inserting tasks:', tasksError);
    } else {
      Alert.alert('Success', 'Challenge and tasks created successfully!');
      navigation.navigate('AdminChallengesScreen');
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Challenge</Text>
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
                style={[styles.input, styles.multilineInput, { height: inputHeight }]}
                placeholder="Description"
                placeholderTextColor="#bbb"
                multiline
                value={description}
                onChangeText={setDescription}
                onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dynamic Content</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { height: inputHeight }]}
                placeholder="Add instructions, tips, or any content..."
                placeholderTextColor="#bbb"
                multiline
                value={content}
                onChangeText={setContent}
                onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
              />
            </View>

            <Text style={styles.label}>Tasks:</Text>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskContainer}>
                <TextInput
                  placeholder="Task Name"
                  value={task.name}
                  onChangeText={(value) => handleTaskChange(index, 'name', value)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Task Description"
                  value={task.description}
                  onChangeText={(value) => handleTaskChange(index, 'description', value)}
                  style={styles.input}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleAddTask} style={styles.addTaskButton}>
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Select Challenge Dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateSubLabel}>Start</Text>
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
                <Text style={styles.dateSubLabel}>End</Text>
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
              <TouchableOpacity style={styles.createButton} onPress={handleCreateChallenge}>
                <Text style={styles.createButtonText}>Create Challenge</Text>
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
  taskContainer: {
    marginBottom: hp('2%'),
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
  createButton: {
    flex: 2,
    backgroundColor: '#28a745',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    marginLeft: wp('2%'),
  },
  createButtonText: {
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
});

export default AdminCreateChallengeScreen;
