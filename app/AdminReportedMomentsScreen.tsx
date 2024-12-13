import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, ImageBackground, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

interface Report {
  id: number;
  username: string;
  profile_picture: string;
  caption: string;
  image_base64: string;
  reason: string;
  additional_comment?: string;
  moment_id: number;
}

const AdminReportedMomentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          additional_comment,
          moment_id,
          moments (
            id,
            caption,
            image_base64,
            users (
              username,
              profile_picture
            )
          )
        `);

      if (!error && data) {
        const formattedReports: Report[] = data.map((report) => {
          const moment = Array.isArray(report.moments) ? report.moments[0] : report.moments;
          const user = moment && Array.isArray(moment.users) ? moment.users[0] : moment.users;

          return {
            id: report.id,
            reason: report.reason,
            additional_comment: report.additional_comment,
            caption: moment?.caption || "No caption provided",
            image_base64: moment?.image_base64 || "",
            username: user && !Array.isArray(user) ? user.username : "Unknown User",
            profile_picture: user && !Array.isArray(user) ? user.profile_picture : "",
            moment_id: moment?.id || 0,
          };
        });
        setReports(formattedReports);
      } else {
        console.log("Error fetching reports:", error.message);
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBase64Image = (base64String: string) => {
    if (!base64String.startsWith('data:image')) {
      return `data:image/png;base64,${base64String}`;
    }
    return base64String;
  };

  const deleteReport = async (reportId: number) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .match({ id: reportId });

      if (!error) {
        Alert.alert("Success", "Report approved and removed.");
        fetchReports(); // Refresh the list after deletion
      } else {
        console.log("Error deleting report:", error.message);
      }
    } catch (error) {
      console.log("Error deleting report:", error);
    }
  };

  const deleteMomentAndReports = async (momentId: number) => {
    try {
      const { error: reportsError } = await supabase
        .from('reports')
        .delete()
        .match({ moment_id: momentId });

      if (!reportsError) {
        const { error: momentError } = await supabase
          .from('moments')
          .delete()
          .match({ id: momentId });

        if (!momentError) {
          Alert.alert("Success", "Moment and associated reports deleted.");
          fetchReports();
        } else {
          console.log("Error deleting moment:", momentError.message);
        }
      } else {
        console.log("Error deleting reports:", reportsError.message);
      }
    } catch (error) {
      console.log("Error deleting moment and reports:", error);
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.background}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={wp('6%')} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reported Moments</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          <Icon name="checkmark-circle" size={wp('5%')} color="#28a745" /> Approves the reported moment and marks it as reviewed.{"\n"}
          <Icon name="trash" size={wp('5%')} color="#f44336" /> Permanently removes the reported moment and all associated reports.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Image source={require('../assets/loading.gif')} style={styles.loadingImage} />
          <Text style={styles.loadingText}>Cai XuKun is dribbling, please wait...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.momentsList}>
          {reports.map((report) => (
            <View key={report.id} style={styles.momentCard}>
              <View style={styles.cardTop}>
                <View style={styles.profileInfo}>
                  <Image
                    source={
                      report.profile_picture
                        ? { uri: formatBase64Image(report.profile_picture) }
                        : require('../assets/default-profile.png')
                    }
                    style={styles.profilePic}
                  />
                  <Text style={styles.username}>{report.username}</Text>
                </View>
                <View style={styles.iconsContainer}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => deleteReport(report.id)}>
                    <Icon name="checkmark-circle" size={wp('5%')} color="#28a745" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => deleteMomentAndReports(report.moment_id)}
                  >
                    <Icon name="trash" size={wp('5%')} color="#f44336" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.momentContent}>
                <Image
                  source={{ uri: formatBase64Image(report.image_base64) }}
                  style={styles.momentImage}
                />
                <Text style={styles.momentCaption}>{report.caption}</Text>
                <Text style={styles.reportReason}>Reason: {report.reason}</Text>
                {report.additional_comment ? (
                  <Text style={styles.additionalComment}>Additional Comment: {report.additional_comment}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
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
    backgroundColor: 'rgba(0, 123, 255, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hp('4%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    marginBottom: hp('1%'),
  },
  backButton: {
    marginRight: wp('2.5%'),
    marginTop: hp('0.5%'),
  },
  headerTitle: {
    color: '#FFF',
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginTop: hp('0.5%'),
  },
  infoBox: {
    backgroundColor: '#f1f1f1',
    padding: wp('3%'),
    marginHorizontal: wp('4%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
    borderColor: '#ddd',
    borderWidth: 1,
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#333',
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
  momentsList: {
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('2%'),
  },
  momentCard: {
    backgroundColor: '#FFF',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginRight: wp('3%'),
  },
  username: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: wp('2%'),
  },
  momentContent: {
    marginTop: hp('1%'),
  },
  momentImage: {
    width: '100%',
    height: hp('25%'),
    borderRadius: wp('2%'),
    marginBottom: hp('1%'),
  },
  momentCaption: {
    fontSize: wp('4%'),
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  reportReason: {
    fontSize: wp('4%'),
    color: '#e53935',
    fontStyle: 'italic',
  },
  additionalComment: {
    fontSize: wp('4%'),
    color: '#555',
    fontStyle: 'italic',
    marginTop: hp('0.5%'),
  },
});

export default AdminReportedMomentsScreen;
