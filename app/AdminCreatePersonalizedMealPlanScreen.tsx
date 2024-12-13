import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ImageBackground, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Progress from 'react-native-progress';

type Recipe = {
  id: string;
  name: string;
};

type UserRequest = {
  id: string;
  name: string;
  goal: string;
};

const AdminCreatePersonalizedMealPlanScreen: React.FC = () => {
  const navigation = useNavigation();
  const recipes: Recipe[] = [];
  const userRequests: UserRequest[] = [
    { id: '1', name: 'John Doe', goal: 'Muscle Gain' },
    { id: '2', name: 'Jane Smith', goal: 'Weight Loss' },
    { id: '3', name: 'Alice Johnson', goal: 'General Health' },
    { id: '4', name: 'Alice Johnson', goal: 'General Health' },
    { id: '5', name: 'Alice Johnson', goal: 'General Health' },
    { id: '6', name: 'Alice Johnson', goal: 'General Health' },
    { id: '7', name: 'Alice Johnson', goal: 'General Health' },
    { id: '8', name: 'Alice Johnson', goal: 'General Health' },
    { id: '9', name: 'Alice Johnson', goal: 'General Health' },
    { id: '10', name: 'Alice Johnson', goal: 'General Health' },
    { id: '11', name: 'Alice Johnson', goal: 'General Health' },
    { id: '12', name: 'Alice Johnson', goal: 'General Health' },
  ];

  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRequest | null>(null);

  const filteredRequests = userRequests.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserDetails = () => {
    setShowUserDetails((prev) => !prev);
  };

  const handleSelectUser = (user: UserRequest) => {
    setSelectedUser(user);
    setIsModalVisible(false);
  };

  const sections = [
    {
      id: '1',
      title: 'Select VIP User',
      icon: 'person-outline' as const,
      content: (
        <View>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.selectButtonText}>
              {selectedUser
                ? `Selected: ${selectedUser.name}`
                : 'Choose a User Request'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={toggleUserDetails}
          >
            <Text style={styles.dropdownText}>
              {showUserDetails ? 'Hide User Details' : 'Show User Details'}
            </Text>
            <Ionicons
              name={showUserDetails ? 'chevron-up' : 'chevron-down'}
              size={wp('5%')}
              color="#4CAF50"
            />
          </TouchableOpacity>
          {showUserDetails && (
            <View style={styles.userDetails}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Gender: </Text>Male
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Height: </Text>175 cm
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Weight: </Text>70 kg
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Goal: </Text>Muscle Gain
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Activity Level: </Text>Moderate
              </Text>
              <Text style={[styles.detailText, styles.multiLineText]}>
                <Text style={styles.detailLabel}>Dietary Preference: </Text>
                Vegan diet focusing on high protein meals including tofu, tempeh, and legumes.
              </Text>
              <Text style={[styles.detailText, styles.multiLineText]}>
                <Text style={styles.detailLabel}>Additional Comment: </Text>
                Please ensure all meals exclude nuts due to allergy concerns. Include meal prep instructions.
              </Text>
            </View>
          )}
        </View>
      ),
    },
    {
      id: '2',
      title: 'Meal Plan Details',
      icon: 'document-text-outline' as const,
      content: (
        <View>
          <TextInput style={styles.input} placeholder="Meal Plan Name" />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            multiline
          />
        </View>
      ),
    },
    {
      id: '3',
      title: 'Macro Overview',
      icon: 'nutrition-outline' as const,
      content: (
        <View style={styles.macroCards}>
          {[
            { name: 'Calories', value: 2000, percentage: 0.5, unit: 'kcal' },
            { name: 'Protein', value: 150, percentage: 0.75, unit: 'g' },
            { name: 'Carbs', value: 250, percentage: 0.6, unit: 'g' },
            { name: 'Fats', value: 50, percentage: 0.4, unit: 'g' },
          ].map((macro) => (
            <View key={macro.name} style={styles.macroCard}>
              <Text style={styles.macroLabel}>{macro.name}</Text>
              <Progress.Circle
                size={70}
                progress={macro.percentage}
                showsText
                formatText={() => `${Math.round(macro.percentage * 100)}%`}
                textStyle={styles.percentageText}
                color="#4CAF50"
              />
              <Text style={styles.macroValue}>{`${macro.value} ${macro.unit}`}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      id: '4',
      title: 'Selected Recipes',
      icon: 'list-outline' as const,
      content: (
        <View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Recipes</Text>
          </TouchableOpacity>
          <FlatList
            data={recipes}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.noRecipesText}>No recipes added yet.</Text>
            }
            renderItem={({ item }: { item: Recipe }) => (
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>{item.name}</Text>
              </View>
            )}
          />
        </View>
      ),
    },
  ];

  return (
    <ImageBackground
      source={require('../assets/admin.png')}
      style={styles.background}
    >
      {/* Header */}
      <View style={styles.header}>
      <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} // Navigate back
        >
          <Ionicons name="arrow-back" size={wp('6%')} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Meal Plan</Text>
      </View>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ImageBackground
              source={require('../assets/admin.png')}
              style={styles.modalBackground}
              resizeMode="cover"
            >
              <TextInput
                style={styles.searchBar}
                placeholder="Search user requests..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <FlatList
                data={filteredRequests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userCard}
                    onPress={() => handleSelectUser(item)}
                  >
                    <Text style={styles.userName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResultsText}>No user requests found.</Text>
                }
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ImageBackground>
          </View>
        </View>
      </Modal>

      {/* Content */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={item.icon} size={wp('5%')} color="#4CAF50" />
              <Text style={styles.sectionTitle}>{item.title}</Text>
            </View>
            {item.content}
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Meal Plan</Text>
          </TouchableOpacity>
        }
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('5%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#ffffff',
    marginVertical: hp('1.5%'),
    marginHorizontal: wp('4%'),
    padding: wp('5%'),
    borderRadius: wp('3%'),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  sectionTitle: {
    fontSize: wp('4.5%'),
    fontWeight: '600',
    color: '#333',
    marginLeft: wp('2%'),
  },
  selectButton: {
    backgroundColor: '#007BFF',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  selectButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  userDetails: {
    marginTop: hp('1%'),
    padding: wp('4%'),
    backgroundColor: '#f0f8ff',
    borderRadius: wp('2%'),
  },
  detailText: {
    fontSize: wp('4%'),
    color: '#333',
    marginBottom: hp('0.8%'), // Adjust spacing between lines
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  multiLineText: {
    flexWrap: 'wrap', // Ensure long text wraps
    lineHeight: wp('5%'), // Improve readability for multi-line text
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontSize: wp('4%'),
    marginBottom: hp('1%'),
  },
  textArea: {
    height: hp('10%'),
    textAlignVertical: 'top',
  },
  macroCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroCard: {
    backgroundColor: '#f5faff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    margin: wp('1%'),
    alignItems: 'center',
    width: '45%',
  },
  macroLabel: {
    fontSize: wp('4%'),
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  addButton: {
    backgroundColor: '#007BFF',
    borderRadius: wp('2%'),
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  addButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  recipeCard: {
    backgroundColor: '#f9f9f9',
    padding: wp('4%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  recipeTitle: {
    fontSize: wp('4%'),
    color: '#333',
  },
  noRecipesText: {
    fontSize: wp('4%'),
    color: '#999',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: wp('5%'),
    borderRadius: wp('3%'),
    paddingVertical: hp('2.5%'),
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: hp('2%'),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
  },
  dropdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    marginVertical: hp('1%'),
    borderRadius: wp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdownText: {
    fontSize: wp('4%'),
    color: '#333',
  },
  userCard: {
    padding: hp('2%'),
    marginVertical: hp('1%'),
    backgroundColor: '#f9f9f9',
    borderRadius: wp('2%'),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  userName: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  noResultsText: {
    fontSize: wp('4%'),
    color: '#999',
    textAlign: 'center',
    marginTop: hp('2%'),
  },
  closeButton: {
    marginTop: hp('2%'),
    backgroundColor: '#007BFF',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('10%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    borderRadius: wp('3%'),
    overflow: 'hidden',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    padding: wp('5%'),
  },
  searchBar: {
    width: '100%',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: wp('2%'),
    fontSize: wp('4%'),
    marginBottom: hp('2%'),
    backgroundColor: '#f9f9f9',
  },
  macroValue: {
    fontSize: wp('4.5%'),
    color: '#555',
    marginTop: hp('0.5%'),
    fontWeight: 'bold',
  },
  percentageText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AdminCreatePersonalizedMealPlanScreen;
