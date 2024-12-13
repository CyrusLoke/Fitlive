import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './App';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const PersonalizedMealPlanScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <ImageBackground source={require('../assets/recipe.png')} style={styles.background}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={wp('6%')} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>My Meal Plan Requests</Text>
            </View>

            {/* User Info Message */}
            <View style={styles.messageContainer}>
                <Text style={styles.messageText}>
                    View your personalized meal plan requests and responses from the nutritionist.
                </Text>
            </View>

            {/* Meal Plan Requests List */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Sample Request Card */}
                <TouchableOpacity style={styles.requestCard} onPress={() => navigation.navigate('MealPlanDetailScreen', { planId: 2 })}>
                    <Text style={styles.requestTitle}>Dietary Preference: Keto</Text>
                    <Text style={styles.requestDetails}>Comments: Prefer high-protein, low-carb meals.</Text>
                    <View style={styles.responseContainer}>
                        <Text style={styles.responseTitle}>Nutritionist Response:</Text>
                        <Text style={styles.responseText}>Your personalized meal plan includes high-protein options with minimal carbs.</Text>
                    </View>
                </TouchableOpacity>

                {/* Another Sample Request Card */}
                <TouchableOpacity style={styles.requestCard} onPress={() => navigation.navigate('MealPlanDetailScreen', { planId: 2 })}>
                    <Text style={styles.requestTitle}>Dietary Preference: Vegan</Text>
                    <Text style={styles.requestDetails}>Comments: No soy or tofu.</Text>
                    <View style={styles.responseContainer}>
                        <Text style={styles.responseTitle}>Response Pending</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            {/* No Requests Text */}
            <Text style={styles.noRequestsText}>No meal plan requests found.</Text>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('RequestMealScreen')}>
                <Icon name="add" size={wp('8%')} color="#fff" />
            </TouchableOpacity>
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
        padding: wp('5%'),
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        elevation: 3,
    },
    backButton: {
        marginRight: wp('3%'),
    },
    title: {
        fontSize: wp('6%'),
        fontWeight: 'bold',
        color: '#333',
    },
    messageContainer: {
        padding: wp('5%'),
        backgroundColor: 'rgba(224, 247, 233, 0.9)',
        borderRadius: wp('3%'),
        margin: wp('5%'),
    },
    messageText: {
        fontSize: wp('4.5%'),
        color: '#555',
        textAlign: 'center',
    },
    scrollContainer: {
        paddingHorizontal: wp('5%'),
    },
    requestCard: {
        backgroundColor: '#fff',
        padding: wp('4%'),
        borderRadius: wp('3%'),
        marginBottom: hp('2%'),
        elevation: 2,
    },
    requestTitle: {
        fontSize: wp('5%'),
        fontWeight: 'bold',
        color: '#4caf50',
        marginBottom: hp('1%'),
    },
    requestDetails: {
        fontSize: wp('4%'),
        color: '#333',
        marginBottom: hp('1%'),
    },
    responseContainer: {
        marginTop: hp('1%'),
        padding: wp('3%'),
        backgroundColor: '#e0f7e9',
        borderRadius: wp('2%'),
    },
    responseTitle: {
        fontSize: wp('4.5%'),
        fontWeight: 'bold',
        color: '#4caf50',
    },
    responseText: {
        fontSize: wp('4%'),
        color: '#333',
        marginTop: hp('0.5%'),
    },
    noRequestsText: {
        fontSize: wp('4.5%'),
        color: '#666',
        textAlign: 'center',
        marginTop: hp('3%'),
    },
    fab: {
        position: 'absolute',
        bottom: hp('5%'),
        right: wp('5%'),
        backgroundColor: '#4caf50',
        width: wp('15%'),
        height: wp('15%'),
        borderRadius: wp('7.5%'),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
});

export default PersonalizedMealPlanScreen;
