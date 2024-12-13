import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  username: string;
  image_base64?: string;
}

const AdminArticleDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { articleId } = route.params as { articleId: string };
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticleDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          created_at,
          image_base64,
          users (username)
        `)
        .eq('id', articleId)
        .single();

      if (error) {
        console.log('Error fetching article:', error);
      } else if (data) {
        const formattedData = {
          id: data.id,
          title: data.title,
          content: data.content,
          created_at: data.created_at,
          username: (data.users as unknown as { username: string }).username,
          image_base64: data.image_base64,
        };
        setArticle(formattedData);
      }
      setLoading(false);
    };

    fetchArticleDetails();
  }, [articleId]);

  // Function to update approval status
  const updateApprovalStatus = async (status: 'approve' | 'decline') => {
    const { error } = await supabase
      .from('articles')
      .update({ approval_status: status })
      .eq('id', articleId);

    if (error) {
      console.log('Error updating approval status:', error);
      Alert.alert('Update Failed', 'There was an error updating the status. Please try again.');
    } else {
      Alert.alert('Success', `Article ${status}d successfully.`);
      navigation.goBack();
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
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={hp('3%')} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Article Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.metadataContainer}>
          <Text style={styles.articleTitle}>{article?.title}</Text>
          <Text style={styles.articleMetadata}>Submitted by: {article?.username}</Text>
          <Text style={styles.articleMetadata}>
            Date: {article?.created_at ? new Date(article.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {article?.image_base64 && (
          <Image
            source={{
              uri: article.image_base64.startsWith('data:image')
                ? article.image_base64
                : `data:image/png;base64,${article.image_base64}`,
            }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.articleContent}>{article?.content}</Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.approveButton} onPress={() => updateApprovalStatus('approve')}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={() => updateApprovalStatus('decline')}>
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    marginTop: ('4%'),
    marginRight: wp('4%'),
  },
  header: {
    marginTop: ('4%'),
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    padding: wp('5%'),
  },
  metadataContainer: {
    marginBottom: hp('2%'),
  },
  articleTitle: {
    fontSize: hp('2.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  articleMetadata: {
    fontSize: hp('2%'),
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  imagePreview: {
    width: '100%',
    height: hp('30%'),
    borderRadius: wp('2%'),
    marginVertical: hp('2%'),
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    marginVertical: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleContent: {
    fontSize: hp('2%'),
    color: '#333',
    lineHeight: hp('2.5%'),
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('3%'),
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
    fontSize: hp('2%'),
  },
});

export default AdminArticleDetailScreen;
