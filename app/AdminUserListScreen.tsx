import React, { useEffect, useState, useCallback} from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, TextInput, Modal, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Picker } from '@react-native-picker/picker'; 
import { supabase } from '../supabaseClient'; 
import { RootStackParamList } from './App';

type AdminUserListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminUserListScreen'>;

interface User {
  id: number;
  username: string | null;
  email: string;
  role: string | number | null;
  profile_picture: string | null; 
}

const AdminUserListScreen: React.FC = () => {
  const navigation = useNavigation<AdminUserListScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('username'); 
  const [isAscending, setIsAscending] = useState(true);
  const [lastSortBy, setLastSortBy] = useState(''); 
  const [users, setUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false); 
  const [activeUser, setActiveUser] = useState<User | null>(null); 

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, profile_picture')
      .neq('role', 3);

    if (!error) {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const sortUsers = (usersList: User[]) => {
    return [...usersList].sort((a, b) => {
      let comparison = 0;
      const aValue = sortBy === 'username' ? a.username || '' : sortBy === 'email' ? a.email || '' : a.role || '';
      const bValue = sortBy === 'username' ? b.username || '' : sortBy === 'email' ? b.email || '' : b.role || '';

      comparison = aValue.toString().localeCompare(bValue.toString());

      return isAscending ? comparison : -comparison;
    });
  };

  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === lastSortBy) {
      setIsAscending(!isAscending);
    } else {
      setSortBy(newSortBy);
      setIsAscending(true);
    }
    setLastSortBy(newSortBy); 
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOpenMenu = (user: User) => {
    setActiveUser(user);
    setModalVisible(true);
  };

  const handleEdit = () => {
    if (activeUser) {
      setModalVisible(false);
      navigation.navigate('AdminUserEditScreen', { userId: activeUser.id });
    }
  };

  const handleDelete = async () => {
    setModalVisible(false);

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${activeUser?.username}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            if (activeUser) {
              const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', activeUser.id);

              if (error) {
                Alert.alert("Error", "Failed to delete user");
              } else {
                setUsers(users.filter(user => user.id !== activeUser.id));
                Alert.alert("Deleted", `${activeUser.username} has been deleted.`);
              }
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const filteredUsers = users.filter(user =>
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedUsers = sortUsers(filteredUsers);

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
        
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-left" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Total Users ({users.length})</Text>
        </View>

        <TextInput
          style={styles.searchBar}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <Picker
            selectedValue={sortBy}
            style={styles.picker}
            onValueChange={(itemValue) => handleSortChange(itemValue)}
          >
            <Picker.Item label="Username" value="username" />
            <Picker.Item label="Email" value="email" />
            <Picker.Item label="Role" value="role" />
          </Picker>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {sortedUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <Image
                source={user.profile_picture ? { uri: user.profile_picture } : require('../assets/default-profile.png')}
                style={styles.profileImage}
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{user.username || 'Guest'}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={styles.role}>
                  {user.role === '1' || user.role === 1 ? 'User' : user.role === '2' || user.role === 2 ? 'Admin' : 'Unknown Role'}
                </Text>
              </View>
              <View style={styles.menuButton}>
                <Icon name="dots-vertical" size={wp('6%')} color="#333" onPress={() => handleOpenMenu(user)} />
              </View>
            </View>
          ))}
        </ScrollView>

        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity onPress={handleEdit} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.modalButton}>
                <Text style={[styles.modalButtonText, { color: 'red' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('2%'),
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: wp('2%'),
  },
  title: {
    fontSize: wp('7%'),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchBar: {
    backgroundColor: '#fff',
    padding: wp('3%'),
    borderRadius: wp('3%'),
    borderColor: '#ccc',
    borderWidth: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    marginRight: wp('2%'),
  },
  picker: {
    width: wp('40%'),
  },
  scrollContainer: {
    paddingVertical: hp('2%'),
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: wp('2%'),
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: wp('3.5%'),
    color: '#666',
  },
  role: {
    fontSize: wp('3.5%'),
    color: '#007BFF',
  },
  menuButton: {
    padding: wp('2%'),
  },
  profileImage: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('7.5%'),
    marginRight: wp('5%'),
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalButton: {
    paddingVertical: 15,
  },
  modalButtonText: {
    fontSize: 18,
    textAlign: 'center',
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
});

export default AdminUserListScreen;
