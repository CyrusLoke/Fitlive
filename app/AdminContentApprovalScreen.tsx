import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../supabaseClient';
import { RootStackParamList } from './App'; // Adjust this import based on your file structure

interface User {
  username: string;
}

interface Article {
  id: string;
  title: string;
  username: string;
  created_at: string;
}

const AdminContentApprovalScreen: React.FC = () => {
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Fetch pending articles
  const fetchPendingArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        created_at,
        users!inner(username)
      `)
      .eq('approval_status', 'pending');

    if (error) {
      console.log('Error fetching articles:', error);
    } else if (data) {
      const formattedData = data.map((article) => ({
        id: article.id,
        title: article.title,
        username: (article.users as unknown as User).username,
        created_at: article.created_at,
      })) as Article[];
      setPendingArticles(formattedData);
    }
  };

  // Trigger fetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchPendingArticles();
    }, [])
  );

  // Handle updating the approval status
  const handleApprovalStatus = async (articleId: string, status: 'approve' | 'decline') => {
    const { error } = await supabase
      .from('articles')
      .update({ approval_status: status }) // Update approval_status based on button pressed
      .eq('id', articleId);

    if (error) {
      console.log('Error updating approval status:', error);
      Alert.alert('Update Failed', 'There was an error updating the status. Please try again.');
    } else {
      Alert.alert('Success', `Article ${status}d successfully.`);
      fetchPendingArticles(); // Refresh the list
    }
  };

  // Render each article item
  const renderItem = ({ item }: { item: Article }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>Submitted by: {item.username}</Text>
      <Text style={styles.cardDate}>Date: {new Date(item.created_at).toLocaleDateString()}</Text>

      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => navigation.navigate('AdminArticleDetailScreen', { articleId: item.id })}
      >
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.approveButton} onPress={() => handleApprovalStatus(item.id, 'approve')}>
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={() => handleApprovalStatus(item.id, 'decline')}>
          <Text style={styles.buttonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={hp('3%')} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Content Approvals</Text>
      </View>

      {pendingArticles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending articles for approval.</Text>
        </View>
      ) : (
        <FlatList
          data={pendingArticles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    marginTop: hp('1%'),
    marginRight: wp('4%'),
  },
  title: {
    marginTop: hp('1%'),
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: hp('2%'),
    color: '#888',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  cardSubtitle: {
    fontSize: hp('1.8%'),
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  cardDate: {
    fontSize: hp('1.6%'),
    color: '#888',
    marginBottom: hp('1%'),
  },
  viewDetailsButton: {
    backgroundColor: '#007bff',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: wp('2%'),
    alignSelf: 'flex-start',
    marginBottom: hp('1%'),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('2%'),
  },
  declineButton: {
    backgroundColor: '#F44336',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('6%'),
    borderRadius: wp('2%'),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: hp('1.8%'),
  },
});

export default AdminContentApprovalScreen;
