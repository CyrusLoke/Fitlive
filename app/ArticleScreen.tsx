import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface RouteParams {
  articleId: string;
}

const ArticleScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { articleId } = route.params as RouteParams;

  const [article, setArticle] = useState<any>(null);
  const [author, setAuthor] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data: articleData, error: articleError } = await supabase
          .from('articles')
          .select('title, content, created_at, user_id, image_base64')
          .eq('id', articleId)
          .single();

        if (articleError) {
          console.error('Error fetching article:', articleError);
          return;
        }

        setArticle(articleData);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username')
          .eq('id', articleData.user_id)
          .single();

        if (userError) {
          console.error('Error fetching author:', userError);
          return;
        }

        setAuthor(userData.username);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../assets/loading.gif')} style={styles.loadingGif} />
        <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header with 'X' Icon */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={hp('3%')} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Article Header */}
        <View style={styles.articleHeader}>
          {article?.image_base64 ? (
            <Image
              source={{
                uri: article.image_base64.startsWith('data:image')
                  ? article.image_base64
                  : `data:image/png;base64,${article.image_base64}`,
              }}
              style={styles.articleImage}
            />
          ) : (
            <Image
              source={require('../assets/capy.png')} // Fallback image
              style={styles.articleImage}
            />
          )}
          <Text style={styles.articleTitle}>{article?.title}</Text>
          <Text style={styles.articleAuthor}>
            by {author} • {new Date(article?.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Article Content */}
        <Text style={styles.articleContent}>{article?.content}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7D3B0', 
  },
  header: {
    width: '100%',
    height: hp('8%'),
    backgroundColor: '#E7D3B0',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('1%'),
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  contentContainer: {
    paddingTop: hp('12%'),
    paddingHorizontal: wp('4%'),
  },
  articleHeader: {
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  articleImage: {
    width: '100%',
    height: hp('25%'),
    borderRadius: 10,
    marginBottom: hp('1%'),
  },
  articleTitle: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp('0.5%'),
  },
  articleAuthor: {
    fontSize: hp('1.8%'),
    color: '#666',
    textAlign: 'center',
  },
  articleContent: {
    fontSize: hp('2%'),
    lineHeight: hp('3%'),
    color: '#333',
    textAlign: 'justify',
    marginTop: hp('2%'),
    marginBottom: hp('3%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingGif: {
    width: wp('20%'),
    height: wp('20%'),
    marginBottom: hp('2%'),
  },
  loadingText: {
    fontSize: wp('3%'), 
    color: '#000',
  },
});

export default ArticleScreen;
