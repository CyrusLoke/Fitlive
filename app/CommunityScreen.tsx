import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ImageBackground, Modal, FlatList, TextInput, KeyboardAvoidingView, ImageSourcePropType } from 'react-native';
import { supabase } from '../supabaseClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetailScreen' | 'AddMomentScreen' | 'UserProfileScreen' | 'AddArticleScreen' | 'ArticleScreen'>;

interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface Comment {
  id: number;
  username: string;
  text: string;
  profileImage: string;
}

interface MomentWithUser {
  id: number;
  caption: string;
  image_base64: string | null;
  created_at: string;
  user_id: string;
  users: {
    username: string;
    profile_picture: string;
  };
  username?: string;
  profile_picture?: any;
  likes: { id: number; user_id: string }[];
  likeCount: number;
  isLikedByCurrentUser?: boolean;
  comments?: { id: number }[];
  commentCount?: number;
  is_private?: boolean;
}

interface Article {
  id: number;
  title: string;
  content: string;
  image_base64: string | null;
}

const CommunityScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'Moments' | 'Articles' | 'Challenges'>('Moments');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [moments, setMoments] = useState<MomentWithUser[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<number | null>(null);
  const [selectedComments, setSelectedComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const navigation = useNavigation<NavigationProp>();
  const [selectedMomentOwnerId, setSelectedMomentOwnerId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string | null }>({ id: null });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setCurrentUser({ id: data.user.id });
      } else {
        console.error('Error fetching user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('challenges').select('*');

    if (error) {
      Alert.alert('Error', 'Failed to load challenges');
      console.error('Error fetching challenges:', error);
    } else {
      const currentDate = moment();
      const filteredChallenges = data.filter((challenge) => moment(challenge.end_date).isAfter(currentDate));
      setChallenges(filteredChallenges);
    }
    setLoading(false);
  };

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, content, image_base64')
      .eq('approval_status', 'approve')
      .order('created_at', { ascending: false });
  
    if (error) {
      Alert.alert('Error', 'Failed to load articles');
      console.error('Error fetching articles:', error);
    } else {
      setArticles(data);
    }
    setLoading(false);
  };

  const fetchMoments = async () => {
    setLoading(true);

    const { data: momentsData, error } = await supabase
      .from('moments')
      .select(`
        id,
        caption,
        image_base64,
        created_at,
        user_id,
        users (username, profile_picture),
        likes (id, user_id),
        comments (id),
        is_private
      `)
      .order('created_at', { ascending: false }) as { data: MomentWithUser[] | null; error: any };

    if (error) {
      Alert.alert('Error', 'Failed to load moments');
      console.error('Error fetching moments:', error);
    } else if (momentsData) {
      const userId = currentUser.id;

      const publicMoments = momentsData.filter(moment => !moment.is_private);

      const momentsWithDetails = publicMoments.map((moment) => ({
        ...moment,
        likeCount: moment.likes ? moment.likes.length : 0,
        commentCount: moment.comments ? moment.comments.length : 0,
        isLikedByCurrentUser: moment.likes?.some((like) => like.user_id === userId),
        username: moment.users?.username || 'Guest',
        profile_picture: moment.users?.profile_picture
          ? { uri: moment.users.profile_picture }
          : require('../assets/default-profile.png'),
      }));

      setMoments(momentsWithDetails);
    }
    setLoading(false);
  };  

  const fetchComments = async (momentId: number) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        text,
        user_id,
        users (
          username,
          profile_picture
        )
      `)
      .eq('moment_id', momentId) 
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else if (data) {
      const formattedComments = data.map((comment) => {
        const user = Array.isArray(comment.users) ? comment.users[0] : comment.users;
        return {
          id: comment.id,
          username: user?.username || 'Unknown',
          text: comment.text,
          profileImage: user?.profile_picture
            ? { uri: user.profile_picture } 
            : require('../assets/default-profile.png'),
        };
      });
      setSelectedComments(formattedComments);
    }
  };  

  useFocusEffect(
    useCallback(() => {
      if (currentUser.id) {
        fetchMoments();
        fetchArticles();
      }
    }, [currentUser.id])
  );  

  useFocusEffect(
    useCallback(() => {
      fetchChallenges();
    }, [])
  );

  const toggleLike = async (momentId: number) => {
    if (!currentUser.id) return;

    const updatedMoments = moments.map((moment) => {
      if (moment.id === momentId) {
        return {
          ...moment,
          isLikedByCurrentUser: !moment.isLikedByCurrentUser,
          likeCount: moment.isLikedByCurrentUser ? moment.likeCount - 1 : moment.likeCount + 1,
        };
      }
      return moment;
    });

    setMoments(updatedMoments);

    try {
      const { data: existingLikes, error: fetchError } = await supabase
        .from('likes')
        .select('id')
        .eq('moment_id', momentId)
        .eq('user_id', currentUser.id);

      if (fetchError) {
        console.error('Error fetching like:', fetchError);
        return;
      }

      if (existingLikes && existingLikes.length > 0) {
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLikes[0].id);

        if (deleteError) {
          console.error('Error unliking moment:', deleteError);
          setMoments((prevMoments) =>
            prevMoments.map((moment) =>
              moment.id === momentId
                ? {
                    ...moment,
                    isLikedByCurrentUser: !moment.isLikedByCurrentUser,
                    likeCount: moment.isLikedByCurrentUser ? moment.likeCount - 1 : moment.likeCount + 1,
                  }
                : moment
            )
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ moment_id: momentId, user_id: currentUser.id });

        if (insertError) {
          console.error('Error liking moment:', insertError);
          setMoments((prevMoments) =>
            prevMoments.map((moment) =>
              moment.id === momentId
                ? {
                    ...moment,
                    isLikedByCurrentUser: !moment.isLikedByCurrentUser,
                    likeCount: moment.isLikedByCurrentUser ? moment.likeCount - 1 : moment.likeCount + 1,
                  }
                : moment
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const getChallengeStatus = (startDate: string, endDate: string) => {
    const currentDate = moment();
    const start = moment(startDate);
    const end = moment(endDate);

    if (currentDate.isBefore(start)) {
      return { status: 'Upcoming', text: 'Starts Soon' };
    } else if (currentDate.isAfter(end)) {
      return { status: 'Ended', text: 'Challenge Ended' };
    } else {
      return { status: 'Ongoing', text: 'View Details' };
    }
  };

  const handleViewDetails = (challenge: Challenge) => {
    navigation.navigate('ChallengeDetailScreen', { challengeId: challenge.id });
  };

  const handleOptionsPress = (momentId: number, userId: string) => {
    setSelectedMomentId(momentId);
    setSelectedMomentOwnerId(userId);
    setOptionsVisible(true);
  };

  const handleOptionSelect = (option: string) => {
    setOptionsVisible(false);
    if (selectedMomentOwnerId !== null && selectedMomentId !== null) {
      if (option === 'View Profile') {
        navigation.navigate('UserProfileScreen', { userId: selectedMomentOwnerId });
      } else if (option === 'Report') {
        navigation.navigate('MomentReportScreen', { momentId: selectedMomentId });
      }
    } else {
      console.warn("Selected moment owner ID or moment ID is null");
    }
  };

  const handleFabPress = () => {
    if (selectedTab === 'Moments') {
      navigation.navigate('AddMomentScreen');
    } else if (selectedTab === 'Articles') {
      navigation.navigate('AddArticleScreen');
    }
  };

  const showComments = async (momentId: number) => {
    setSelectedMomentId(momentId);
    await fetchComments(momentId);
    setCommentsVisible(true);
  };

  const addComment = async () => {
    if (newComment.trim() === '') return;

    const { error } = await supabase.from('comments').insert([
      { moment_id: selectedMomentId, text: newComment, user_id: currentUser.id }
    ]);

    if (error) {
      console.error('Error adding comment:', error);
    } else {
      setNewComment('');

      await fetchComments(selectedMomentId!);

      setMoments((prevMoments) =>
        prevMoments.map((moment) =>
          moment.id === selectedMomentId
            ? { ...moment, commentCount: (moment.commentCount || 0) + 1 }
            : moment
        )
      );
    }
  };

  const handleAddMoment = () => {
    setAddOptionsVisible(false);
    navigation.navigate('AddMomentScreen');
  };

  const handleCancelAdd = () => {
    setAddOptionsVisible(false);
  };

  const handleReadMore = (articleId: number) => {
    navigation.navigate('ArticleScreen', { articleId: articleId.toString() });
  };  

  const currentChallenges = challenges.filter(challenge => {
    const currentDate = moment();
    return moment(challenge.start_date).isBefore(currentDate) && moment(challenge.end_date).isAfter(currentDate);
  });

  const upcomingChallenges = challenges.filter(challenge => {
    const currentDate = moment();
    return moment(challenge.start_date).isAfter(currentDate);
  });

  return (
    <View style={styles.container}>
      <ImageBackground source={require('../assets/community-bg.png')} style={styles.headerBackground}>
        <View style={styles.overlay} />
        <Text style={styles.headerTitle}>Community</Text>
      </ImageBackground>

      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setSelectedTab('Moments')}>
          <Text style={[styles.tabText, selectedTab === 'Moments' && styles.activeTabText]}>Moments</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('Articles')}>
          <Text style={[styles.tabText, selectedTab === 'Articles' && styles.activeTabText]}>Articles</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedTab('Challenges')}>
          <Text style={[styles.tabText, selectedTab === 'Challenges' && styles.activeTabText]}>Challenges</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
            <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
          </View>
        ) : (
          <>
            {selectedTab === 'Moments' && (
              moments.map((item) => (
                <View key={item.id} style={styles.card}>
                  <TouchableOpacity style={styles.optionsIcon} onPress={() => handleOptionsPress(item.id, item.user_id)}>
                    <Ionicons name="ellipsis-vertical" size={24} color="gray" />
                  </TouchableOpacity>
                  <View style={styles.userInfo}>
                    <Image style={styles.profileImage} source={item.profile_picture} />
                    <View style={styles.userDetails}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Text style={styles.timestamp}>{moment(item.created_at).format('MMM D, YYYY, h:mm a')}</Text>
                    </View>
                  </View>

                  {item.image_base64 && (
                    <TouchableOpacity onPress={() => navigation.navigate('MomentDetailScreen', { momentId: item.id })}>
                      <Image
                      source={{ uri: `data:image/png;base64,${item.image_base64}` }}
                      style={styles.cardImage}
                    />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.cardContent}>{item.caption}</Text>
                  <View style={styles.interactionContainer}>
                    <View style={styles.likeContainer}>
                      <TouchableOpacity onPress={() => toggleLike(item.id)}>
                        <Ionicons
                          name={item.isLikedByCurrentUser ? "heart" : "heart-outline"}
                          size={hp('2.5%')}
                          color={item.isLikedByCurrentUser ? 'red' : '#888'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.likeCount}>{item.likeCount}</Text>
                    </View>
                    <TouchableOpacity onPress={() => showComments(item.id)}>
                      <Text style={styles.icon}>
                        💬 <Text>{item.commentCount}</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {selectedTab === 'Articles' && (
              articles.map((article) => (
                <View key={article.id} style={styles.card}>
                  {article.image_base64 && (
                    <Image
                      source={{
                        uri: article.image_base64.startsWith('data:image')
                          ? article.image_base64
                          : `data:image/jpeg;base64,${article.image_base64}`,
                      }}
                      style={styles.articleImage}
                    />
                  )}
                  <Text style={styles.cardTitle}>{article.title}</Text>
                  <Text style={styles.cardContent}>
                    {article.content.substring(0, 100)}...
                  </Text>
                  <TouchableOpacity style={styles.readMoreButton} onPress={() => handleReadMore(article.id)}>
                    <Text style={styles.readMoreText}>Read More</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {selectedTab === 'Challenges' && (
              <>
                <Text style={styles.sectionTitle}>Current Challenges</Text>
                {currentChallenges.length === 0 ? (
                  <Text style={styles.noChallengeText}>No current challenges</Text>
                ) : (
                  currentChallenges.map((challenge) => (
                    <View key={challenge.id} style={styles.challengeCard}>
                      <Text style={styles.challengeTitle}>🔥 {challenge.title}</Text>
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                      <Text style={styles.challengeDates}>
                        Start: {moment(challenge.start_date).format('MMM DD, YYYY')} - End: {moment(challenge.end_date).format('MMM DD, YYYY')}
                      </Text>
                      <TouchableOpacity 
                        style={styles.challengeButton}
                        onPress={() => handleViewDetails(challenge)}
                      >
                        <Text style={styles.challengeButtonText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                <Text style={styles.sectionTitle}>Upcoming Challenges</Text>
                {upcomingChallenges.length === 0 ? (
                  <Text style={styles.noChallengeText}>No upcoming challenges</Text>
                ) : (
                  upcomingChallenges.map((challenge) => (
                    <View key={challenge.id} style={styles.challengeCard}>
                      <Text style={styles.challengeTitle}>🔥 {challenge.title}</Text>
                      <Text style={styles.challengeDescription}>{challenge.description}</Text>
                      <Text style={styles.challengeDates}>
                        Start: {moment(challenge.start_date).format('MMM DD, YYYY')} - End: {moment(challenge.end_date).format('MMM DD, YYYY')}
                      </Text>
                      <Text style={styles.upcomingText}>Starts Soon</Text>
                    </View>
                  ))
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {(selectedTab === 'Moments' || selectedTab === 'Articles') && (
        <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
          <Ionicons name="add" size={hp('4%')} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={optionsVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.enhancedModalContent}>
            <Text style={styles.modalTitle}>What would you like to do?</Text>
            <TouchableOpacity onPress={() => handleOptionSelect('View Profile')} style={styles.viewProfileButton}>
              <Text style={styles.viewProfileButtonText}>View Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleOptionSelect('Report')} style={styles.reportButton}>
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOptionsVisible(false)} style={styles.enhancedCancelButton}>
              <Text style={styles.enhancedCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={commentsVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView style={styles.modalContainer} behavior="padding">
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeIcon} onPress={() => setCommentsVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments ({selectedComments.length})</Text>

            {selectedComments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet, add some comments</Text>
            ) : (
              <FlatList
                data={selectedComments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    {item.profileImage && (
                      <Image source={item.profileImage as ImageSourcePropType} style={styles.commentProfileImage} />
                    )}
                    <View style={styles.commentTextContainer}>
                      <Text style={styles.commentUsername}>{item.username}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#888"
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.submitButton} onPress={addComment}>
              <Text style={styles.submitButtonText}>Post Comment</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgrey',
  },
  headerBackground: {
    width: '100%',
    height: hp('15%'),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerTitle: {
    fontSize: hp('4%'),
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp('1%'),
    backgroundColor: '#FFF',
    marginBottom: hp('2%'),
  },
  tabText: {
    fontSize: hp('2%'),
    color: '#333',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: wp('3%'),
    paddingBottom: hp('2%'),
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
  sectionTitle: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: hp('1%'),
  },
  challengeCard: {
    backgroundColor: '#ffcc80',
    padding: wp('3%'),
    borderRadius: 8,
    marginBottom: hp('1.5%'),
  },
  challengeTitle: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: '#333',
  },
  challengeDescription: {
    fontSize: hp('1.8%'),
    color: '#333',
    marginTop: hp('0.5%'),
    textAlign: 'justify',
  },
  challengeDates: {
    fontSize: hp('1.5%'),
    color: '#666',
    marginTop: hp('0.5%'),
  },
  challengeButton: {
    marginTop: hp('1%'),
    backgroundColor: '#fff',
    padding: hp('0.8%'),
    borderRadius: 5,
    alignItems: 'center',
    borderColor: '#ff5722',
    borderWidth: 1,
  },
  challengeButtonText: {
    fontSize: hp('1.8%'),
    fontWeight: 'bold',
    color: '#ff5722',
  },
  upcomingText: {
    marginTop: hp('1%'),
    fontSize: hp('1.8%'),
    fontWeight: 'bold',
    color: '#ff5722',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  profileImage: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginRight: wp('3%'),
  },
  userDetails: {
    flexDirection: 'column',
  },
  username: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: hp('1.5%'),
    color: '#888',
  },
  cardContent: {
    fontSize: hp('1.8%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: wp('5%'),
  },
  icon: {
    color: '#888',
    fontSize: hp('1.8%'),
  },
  readMoreButton: {
    padding: hp('0.8%'),
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: hp('0.8%'),
  },
  readMoreText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noChallengeText: {
    textAlign: 'center',
    fontSize: hp('2%'),
    marginVertical: hp('2%'),
    color: '#888',
  },
  fab: {
    position: 'absolute',
    bottom: hp('3%'),
    right: wp('5%'),
    backgroundColor: '#007bff',
    width: hp('7%'),
    height: hp('7%'),
    borderRadius: hp('3.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentTextContainer: {
    flexDirection: 'column',
  },
  commentUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  enhancedModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  enhancedOptionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  enhancedOptionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  enhancedCancelButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  enhancedCancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  optionsIcon: { 
    position: 'absolute', 
    top: 10, 
    right: 10,
  },
  viewProfileButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewProfileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardImage: {
    width: '100%',
    height: hp('20%'),
    borderRadius: 10,
    marginBottom: hp('0.5%'),
  },
  articleImage: {
    width: '100%',
    height: hp('20%'),
    borderRadius: 10,
    marginBottom: hp('1%'),
  },
  reportButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('1%'),
  },
  likeCount: {
    color: '#888',
    fontSize: hp('1.8%'),
    marginLeft: wp('0.5%'),
  },
  noCommentsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default CommunityScreen;

