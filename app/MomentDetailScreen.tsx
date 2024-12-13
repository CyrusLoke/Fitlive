import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView } from 'react-native';
import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';

type MomentDetailScreenRouteProp = RouteProp<RootStackParamList, 'MomentDetailScreen'>;

interface Comment {
  id: number;
  username: string;
  text: string;
  profilePicture: string | null;
}

const MomentDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<MomentDetailScreenRouteProp>();
  const { momentId } = route.params;

  const [caption, setCaption] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('User');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikedByCurrentUser, setIsLikedByCurrentUser] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string | null }>({ id: null });

  const fetchComments = async () => {
    try {
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .select('id, text, user_id')
        .eq('moment_id', momentId);
      if (commentError) throw commentError;

      const commentsWithUserDetails = await Promise.all(
        commentData.map(async (comment) => {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, profile_picture')
            .eq('id', comment.user_id)
            .single();
          if (userError) throw userError;

          return {
            id: comment.id,
            username: userData?.username || 'User',
            text: comment.text,
            profilePicture: userData?.profile_picture || null,
          };
        })
      );

      setComments(commentsWithUserDetails);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.id) {
        setCurrentUser({ id: data.user.id });
      }
    };

    const fetchMomentDetails = async () => {
      setLoading(true);
      try {
        const { data: momentData, error: momentError } = await supabase
          .from('moments')
          .select('user_id, caption, image_base64, likes (id, user_id)')
          .eq('id', momentId)
          .single();
        if (momentError) throw momentError;

        setCaption(momentData?.caption || 'No caption');
        setImageBase64(momentData?.image_base64 || null);
        setLikeCount(momentData.likes ? momentData.likes.length : 0);
        setIsLikedByCurrentUser(momentData.likes?.some((like) => like.user_id === currentUser.id));

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, profile_picture')
          .eq('id', momentData.user_id)
          .single();
        if (userError) throw userError;

        setUsername(userData?.username || 'User');
        setProfilePicture(userData?.profile_picture || null);
      } catch (error) {
        console.error('Error fetching moment or user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
    fetchMomentDetails();
    fetchComments();
  }, [momentId, currentUser.id]);

  const toggleLike = async () => {
    if (!currentUser.id) return;

    const updatedLikeStatus = !isLikedByCurrentUser;
    setIsLikedByCurrentUser(updatedLikeStatus);
    setLikeCount(updatedLikeStatus ? likeCount + 1 : likeCount - 1);

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
          setIsLikedByCurrentUser(!updatedLikeStatus);
          setLikeCount(updatedLikeStatus ? likeCount - 1 : likeCount + 1);
        }
      } else {
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ moment_id: momentId, user_id: currentUser.id });

        if (insertError) {
          console.error('Error liking moment:', insertError);
          setIsLikedByCurrentUser(!updatedLikeStatus);
          setLikeCount(updatedLikeStatus ? likeCount - 1 : likeCount + 1);
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() && currentUser.id) {
      try {
        const { error } = await supabase
          .from('comments')
          .insert({ text: newComment, user_id: currentUser.id, moment_id: momentId });
        if (error) throw error;

        setNewComment('');
        fetchComments();
      } catch (error) {
        console.error('Error adding comment:', error);
      }
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
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      {/* Header outside the ScrollView */}
      <View style={styles.userRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={wp('6%')} color="#333" />
        </TouchableOpacity>
        <Image
          source={
            profilePicture
              ? { uri: profilePicture }
              : require('../assets/default-profile.png')
          }
          style={styles.userAvatar}
        />
        <Text style={styles.username}>@{username}</Text>
      </View>

      {/* Main content in the ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {imageBase64 && (
          <Image source={{ uri: `data:image/png;base64,${imageBase64}` }} style={styles.image} />
        )}
        <View style={styles.contentContainer}>
          <TouchableOpacity style={styles.likeContainer} onPress={toggleLike}>
            <Ionicons
              name={isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={wp('5%')}
              color={isLikedByCurrentUser ? '#e91e63' : '#333'}
            />
            <Text style={styles.likesText}>{likeCount} likes</Text>
          </TouchableOpacity>
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>@{username} </Text>
            {caption}
          </Text>
          {comments.length === 0 ? (
            <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
          ) : (
            comments.map((item) => (
              <View key={item.id} style={styles.commentContainer}>
                <Image
                  source={
                    item.profilePicture
                      ? { uri: item.profilePicture }
                      : require('../assets/default-profile.png')
                  }
                  style={styles.commentAvatar}
                />
                <View style={styles.commentTextContainer}>
                  <Text style={styles.commentUsername}>{item.username}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment input section */}
      <View style={styles.addCommentContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity onPress={handleAddComment}>
          <Text style={styles.postButton}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    paddingBottom: 100,
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    marginTop: hp('2%'),
  },
  backButton: {
    marginRight: wp('2%'),
  },
  userAvatar: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    marginRight: wp('2%'),
  },
  username: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: hp('50%'),
    backgroundColor: '#f2f2f2',
  },
  contentContainer: {
    padding: wp('4%'),
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  likesText: {
    marginLeft: wp('2%'),
    fontSize: wp('4%'),
    color: '#333',
  },
  captionText: {
    fontSize: wp('4%'),
    color: '#333',
    marginBottom: hp('1%'),
  },
  captionUsername: {
    fontWeight: 'bold',
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: hp('1%'),
  },
  commentAvatar: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    marginRight: wp('2%'),
  },
  commentTextContainer: {
    flexShrink: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    marginRight: wp('2%'),
  },
  commentText: {
    fontSize: wp('4%'),
    color: '#333',
    flexShrink: 1,
  },
  noCommentsText: {
    fontSize: wp('4%'),
    color: '#777',
    textAlign: 'center',
    marginTop: hp('2%'),
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('1%'),
    borderTopWidth: 0.5,
    borderColor: '#000',
    backgroundColor: '#FFF',
  },
  commentInput: {
    flex: 1,
    fontSize: wp('4%'),
    padding: wp('2%'),
    borderRadius: 20,
    borderColor: '#000',
    borderWidth: 1,
    marginRight: wp('2%'),
  },
  postButton: {
    color: '#007bff',
    fontSize: wp('4%'),
  },
});

export default MomentDetailScreen;
