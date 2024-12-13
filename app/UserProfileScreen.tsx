import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert, ImageBackground } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './App';
import { supabase } from '../supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfileScreen'>;

interface Moment {
  id: number;
  image_base64: string | null;
}

interface Article {
  id: number;
  title: string;
  content: string;
}

interface User {
  username: string;
  profile_picture: string | null;
}

const UserProfileScreen: React.FC = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'Moments' | 'Articles'>('Moments');

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, profile_picture')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUser(userData);

        const { data: momentsData, error: momentsError } = await supabase
          .from('moments')
          .select('id, image_base64, is_private')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (momentsError) throw momentsError;

        // Filter out private moments
        const publicMoments = (momentsData || []).filter((moment) => !moment.is_private);
        setMoments(publicMoments);

        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('id, title, content')
          .eq('user_id', userId)
          .eq('approval_status', 'approve')
          .order('created_at', { ascending: false });

        if (articlesError) throw articlesError;
        setArticles(articlesData || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to load data');
        console.error('Data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const formattedMoments: Array<Moment | null> = [...moments];
  while (formattedMoments.length % 3 !== 0) {
    formattedMoments.push(null);
  }

  return (
    <ImageBackground source={require('../assets/white.png')} style={styles.background}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.username}>@{user?.username || 'User'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <Image
            source={
              user?.profile_picture
                ? { uri: user.profile_picture }
                : require('../assets/default-profile.png')
            }
            style={styles.profilePicture}
          />
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{moments.length}</Text>
              <Text style={styles.statLabel}>Moments</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{articles.length}</Text>
              <Text style={styles.statLabel}>Articles</Text>
            </View>
          </View>
        </View>

        {/* Toggle Section */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setSelectedTab('Moments')}>
            <Text style={[styles.tabText, selectedTab === 'Moments' && styles.activeTabText]}>Moments</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedTab('Articles')}>
            <Text style={[styles.tabText, selectedTab === 'Articles' && styles.activeTabText]}>Articles</Text>
          </TouchableOpacity>
        </View>

        {/* Content Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
            <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
          </View>
        ) : selectedTab === 'Moments' ? (
          <FlatList
            data={formattedMoments}
            numColumns={3}
            key={'Moments'} 
            renderItem={({ item }) =>
              item ? (
                <TouchableOpacity
                  style={styles.moment}
                  onPress={() => navigation.navigate('MomentDetailScreen', { momentId: item.id })}
                >
                  <Image source={{ uri: `data:image/png;base64,${item.image_base64}` }} style={styles.momentImage} />
                </TouchableOpacity>
              ) : (
                <View style={styles.momentPlaceholder} />
              )
            }
            keyExtractor={(item, index) => (item ? item.id.toString() : `placeholder-${index}`)}
            contentContainerStyle={styles.momentsContainer}
          />
        ) : (
          <FlatList
            data={articles}
            key={'Articles'} 
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.articleCard}
                onPress={() => navigation.navigate('ArticleScreen', { articleId: item.id.toString() })}
              >
                <View style={styles.articleContentWrapper}>
                  <Text style={styles.articleTitle}>{item.title}</Text>
                  <Text style={styles.articleSnippet}>{item.content.substring(0, 150)}...</Text>
                  <Text style={styles.readMoreText}>Read More</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.articlesContainer}
          />
        )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  backButton: {
    padding: wp('2%'),
  },
  username: {
    flex: 1,
    fontSize: wp('5%'),
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
  },
  headerSpacer: {
    width: wp('6%'),
  },
  profileInfo: {
    alignItems: 'center',
    padding: wp('4%'),
  },
  profilePicture: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: wp('12.5%'),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginVertical: hp('2%'),
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp('1%'),
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  tabText: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#333',
  },
  activeTabText: {
    color: '#007bff',
    textDecorationLine: 'underline',
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
  momentsContainer: {
    padding: wp('1%'),
  },
  moment: {
    flex: 1,
    margin: wp('0.5%'),
    aspectRatio: 1,
  },
  momentImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp('1%'),
  },
  momentPlaceholder: {
    flex: 1,
    margin: wp('0.5%'),
    aspectRatio: 1,
    backgroundColor: 'transparent',
  },
  articlesContainer: {
    padding: wp('2%'),
  },
  articleCard: {
    backgroundColor: '#FFF',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleContentWrapper: {
    flex: 1,
  },
  articleTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    color: '#333',
  },
  articleSnippet: {
    fontSize: wp('3.5%'),
    color: '#555',
    marginBottom: hp('1%'),
  },
  readMoreText: {
    fontSize: wp('3.5%'),
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default UserProfileScreen;
