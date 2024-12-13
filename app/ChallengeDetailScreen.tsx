import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, Image, Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import { RootStackParamList } from './App';

type ChallengeDetailRouteProp = RouteProp<RootStackParamList, 'ChallengeDetailScreen'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetailScreen'>;

const MAX_DISPLAY_PARTICIPANTS = 3;

interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  difficulty: string;
  target_audience: string;
  content: string;
  max_participants: number | null;
}

interface Participant {
  user_id: string;
  username: string;
  profile_picture: string | null;
}

const ChallengeDetailScreen: React.FC = () => {
  const route = useRoute<ChallengeDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { challengeId } = route.params;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);

  const fetchChallengeDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error) {
      Alert.alert('Error', 'Failed to load challenge details');
      console.error('Error fetching challenge details:', error);
    } else {
      setChallenge(data);
    }
    setLoading(false);
  };

  const fetchParticipants = async () => {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select('user_id, users (username, profile_picture)')
      .eq('challenge_id', challengeId)
      .order('joined_at', { ascending: true });

    if (error) {
      Alert.alert('Error', 'Failed to load participants');
      console.error('Error fetching participants:', error);
    } else if (data) {
      const formattedParticipants: Participant[] = data.map(participant => {
        const user = participant.users as unknown as { username: string; profile_picture: string | null };
        return {
          user_id: participant.user_id,
          username: user.username,
          profile_picture: user.profile_picture,
        };
      });
      setParticipants(formattedParticipants);
    }
  };

  const checkIfUserJoined = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      return;
    }

    const userId = userData.user.id;
    const { data: existingParticipant } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      setIsJoined(true);
    }
  };

  const joinChallenge = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      Alert.alert('Error', 'Failed to get user information');
      return;
    }

    const userId = userData.user.id;

    const { error: insertError } = await supabase
      .from('challenge_participants')
      .insert([{ challenge_id: challengeId, user_id: userId }]);

    if (insertError) {
      Alert.alert('Error', 'Failed to join challenge');
      return;
    }

    Alert.alert('Success', 'You have joined the challenge!');
    setIsJoined(true);
    fetchParticipants();
    navigation.navigate('ChallengeProgressScreen', { challengeId });
  };

  const subscribeToParticipants = () => {
    const channel = supabase
      .channel('challenge-participants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenge_participants',
        filter: `challenge_id=eq.${challengeId}`
      }, fetchParticipants)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchChallengeDetails();
    fetchParticipants();
    checkIfUserJoined();
    const unsubscribe = subscribeToParticipants();
    return unsubscribe;
  }, [challengeId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return '#A5D6A7';
      case 'intermediate':
        return '#FFD54F';
      case 'advanced':
        return '#E57373';
      default:
        return '#E0E0E0';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
        <Text style={styles.loadingText}>Loading challenge details...</Text>
      </View>
    );
  }

  if (!challenge) {
    return <Text style={styles.errorText}>Challenge not found.</Text>;
  }

  return (
    <ImageBackground source={require('../assets/challenge.png')} style={styles.container}>
      <ImageBackground source={require('../assets/challenge-banner.png')} style={styles.headerBackground}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{challenge.title}</Text>
          <Text style={styles.dateRange}>
            {moment(challenge.start_date).format('MMM DD, YYYY')} - {moment(challenge.end_date).format('MMM DD, YYYY')}
          </Text>
          <View style={styles.badgeContainer}>
            <Text style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
              {challenge.difficulty}
            </Text>
            <Text style={styles.audienceBadge}>{challenge.target_audience}</Text>
          </View>
          <Text style={styles.participantText}>
            Max Participants: {challenge.max_participants !== null ? challenge.max_participants : "No Limit"}
          </Text>
        </View>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="text-box-outline" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Challenge Overview</Text>
          </View>
          <Text style={styles.descriptionText}>{challenge.description}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#FFA500" />
            <Text style={styles.sectionTitle}>Challenge Content</Text>
          </View>
          <Text style={styles.contentText}>{challenge.content}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-multiple" size={20} color="#FFA500" />
            <Text style={styles.sectionTitle}>
              Participants ({participants.length})
            </Text>
          </View>
          {participants.length > 0 ? (
            <>
              {participants.slice(0, MAX_DISPLAY_PARTICIPANTS).map((participant, index) => (
                <View key={index} style={styles.participantItem}>
                  <Image
                    source={
                      participant.profile_picture
                        ? { uri: participant.profile_picture }
                        : require('../assets/default-profile.png')
                    }
                    style={styles.participantImage}
                  />
                  <Text style={styles.participantName}>{participant.username}</Text>
                </View>
              ))}
              {participants.length > MAX_DISPLAY_PARTICIPANTS && (
                <Text style={styles.moreParticipantsText}>
                  +{participants.length - MAX_DISPLAY_PARTICIPANTS} more
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.noParticipantsText}>No participants yet.</Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {isJoined ? (
            <TouchableOpacity style={styles.progressButton} onPress={() => navigation.navigate('ChallengeProgressScreen', { challengeId })}>
              <MaterialCommunityIcons name="chart-line" size={24} color="#FFF" />
              <Text style={styles.progressButtonText}>View Progress</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.joinButton} onPress={joinChallenge}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" />
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
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
  headerBackground: {
    width: '100%',
    height: hp('25%'),
    justifyContent: 'center',
    borderBottomLeftRadius: wp('6%'),
    borderBottomRightRadius: wp('6%'),
    overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: hp('4%'),
    left: wp('4%'),
    padding: wp('1.5%'),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: wp('6%'),
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: hp('5%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginTop: hp('3%'),
  },
  dateRange: {
    fontSize: wp('4%'),
    color: '#FFF',
    marginTop: hp('0.5%'),
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: hp('1%'),
  },
  difficultyBadge: {
    color: '#000',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    marginRight: wp('2%'),
    fontWeight: '600',
  },
  audienceBadge: {
    backgroundColor: '#4CAF50',
    color: '#000',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.5%'),
    borderRadius: wp('2%'),
    fontWeight: '600',
  },
  participantText: {
    fontSize: wp('4%'),
    color: '#FFF',
    marginTop: hp('1%'),
  },
  scrollContainer: {
    paddingHorizontal: wp('5%'),
    paddingTop: hp('2%'),
    paddingBottom: hp('2%'),
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    marginBottom: hp('2%'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#000',
    marginLeft: wp('2%'),
  },
  descriptionText: {
    fontSize: wp('4%'),
    color: '#000',
    lineHeight: hp('2.5%'),
    textAlign: 'justify',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1.5%'),
  },
  participantImage: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    marginRight: wp('3%'),
  },
  participantName: {
    fontSize: wp('4%'),
    color: '#000',
  },
  noParticipantsText: {
    fontSize: wp('4%'),
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: hp('3%'),
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: wp('5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginVertical: hp('2%'),
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  errorText: {
    textAlign: 'center',
    fontSize: hp('2.5%'),
    color: '#ff0000',
    marginVertical: hp('3%'),
  },
  contentText: {
    fontSize: wp('4%'),
    color: '#000',
    lineHeight: hp('2.5%'),
  },
  moreParticipantsText: {
    fontSize: wp('4%'),
    color: '#FFA500',
    textAlign: 'center',
    marginTop: hp('1%'),
  },  
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    borderRadius: wp('5%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('8%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    marginVertical: hp('2%'),
  },
  progressButtonText: {
    color: '#FFF',
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
});

export default ChallengeDetailScreen;
