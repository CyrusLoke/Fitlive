import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';

// Define the RecipeMeal type
type RecipeMeal = {
  id: number;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_base64?: string;
  ingredients: string; // JSON string
  instructions: string; // Text
  serving_size: string;
};

// Imports for user screens
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import UserInfoScreen from './UserInfoScreen';
import ProgressTrackingScreen from './ProgressTrackingScreen';
import NutritionScreen from './NutritionScreen';
import CommunityScreen from './CommunityScreen';
import ProfileScreen from './ProfileScreen';
import EditProfileScreen from './EditProfileScreen';
import SettingsScreen from './SettingsScreen';
import EditFitnessPreferencesScreen from './EditFitnessPreferencesScreen';
import SelectFoodScreen from './SelectFoodScreen';
import ChallengeDetailScreen from './ChallengeDetailScreen';
import ChallengeProgressScreen from './ChallengeProgressScreen';
import SubmitChallengeProgressScreen from './SubmitChallengeProgressScreen';
import LeaderboardScreen from './LeaderboardScreen';
import AddMomentScreen from './AddMomentScreen';
import MomentReportScreen from './MomentReportScreen';
import UserProfileScreen from './UserProfileScreen';
import MomentDetailScreen from './MomentDetailScreen';
import AddArticleScreen from './AddArticleScreen';
import ArticleScreen from './ArticleScreen';
import NutritionGraphScreen from './NutritionGraphScreen';
import SubscriptionScreen from './SubscriptionScreen';
import MealPlansScreen from './MealPlansScreen';
import PaymentSuccessScreen from './PaymentSuccessScreen';
import MealPlanDetailScreen from './MealPlanDetailScreen';
import PersonalizedMealPlanScreen from './PersonalizedMealPlanScreen';
import RequestMealScreen from './RequestMealScreen';

// Imports for Admin Screens
import AdminHomeScreen from './AdminHomeScreen';
import AdminUserListScreen from './AdminUserListScreen';
import AdminUserEditScreen from './AdminUserEditScreen';
import AdminChallengesScreen from './AdminChallengesScreen';
import AdminCreateChallengeScreen from './AdminCreateChallengeScreen';
import AdminChallengeDetailScreen from './AdminChallengeDetailScreen';
import AdminEditChallengeScreen from './AdminEditChallengeScreen';
import AdminReportedMomentsScreen from './AdminReportedMomentsScreen';
import AdminContentApprovalScreen from './AdminContentApprovalScreen';
import AdminArticleDetailScreen from './AdminArticleDetailScreen';
import AdminChallengeTaskApprovalScreen from './AdminChallengeTaskApprovalScreen';
import AdminMealPlansScreen from './AdminMealPlansScreen';
import AdminAddMealPlanScreen from './AdminAddMealPlanScreen';
import AdminAddMealsScreen from './AdminAddMealsScreen';
import AdminCreateRecipeMealScreen from './AdminCreateRecipeMealScreen';
import AdminRecipeMealsScreen from './AdminRecipeMealsScreen';
import AdminRecipeDetailScreen from './AdminRecipeDetailScreen'; 
import AdminViewMealPlansScreen from './AdminViewMealPlansScreen';
import AdminCreatePersonalizedMealPlanScreen from './AdminCreatePersonalizedMealPlanScreen';

// Define route names and their params for the stack navigator
export type RootStackParamList = {
  HomeScreen: undefined;
  LoginScreen: undefined;
  SignUpScreen: undefined;
  ForgotPasswordScreen: undefined;
  UserInfoScreen: undefined;
  ProfileScreen: undefined;
  SettingsScreen: undefined;
  EditProfileScreen: undefined;
  EditFitnessPreferencesScreen: undefined;
  NutritionScreen: { selectedFood?: string; mealType?: string; date?: string };
  NutritionGraphScreen: undefined;
  SelectFoodScreen: { mealType: string; date: string };
  AdminHomeScreen: undefined;
  AdminUserListScreen: undefined;
  AdminUserEditScreen: { userId: number };
  AdminChallengesScreen: undefined;
  AdminCreateChallengeScreen: undefined;
  AdminChallengeDetailScreen: { challenge: any };
  AdminEditChallengeScreen: { challenge: any };
  ChallengeDetailScreen: { challengeId: number };
  ChallengeProgressScreen: { challengeId: number };
  SubmitChallengeProgressScreen: { taskId: number };
  LeaderboardScreen: { challengeId: number };
  AddMomentScreen: undefined;
  MomentReportScreen: { momentId: number };
  UserProfileScreen: { userId: string };
  MomentDetailScreen: { momentId: number };
  AdminReportedMomentsScreen: undefined;
  AddArticleScreen: undefined;
  AdminContentApprovalScreen: undefined;
  AdminArticleDetailScreen: { articleId: string };
  ArticleScreen: { articleId: string };
  AdminChallengeTaskApprovalScreen: undefined;
  AdminMealPlansScreen: undefined;
  AdminAddMealPlanScreen: { mealPlanId?: string; selectedMealIds?: number[] }; // Updated type
  AdminAddMealsScreen: { mealPlanId?: string; selectedMealIds?: number[] };
  AdminCreateRecipeMealScreen: { mealId?: number; mealData?: RecipeMeal };
  AdminRecipeDetailScreen: { mealId: number };
  AdminRecipeMealsScreen: undefined;
  AdminViewMealPlansScreen: undefined;
  AdminCreatePersonalizedMealPlanScreen: undefined;
  SubscriptionScreen: undefined;
  MealPlansScreen: undefined;
  PaymentSuccessScreen: undefined;
  MealPlanDetailScreen: { mealPlanId: string };
  PersonalizedMealPlanScreen: undefined;
  RequestMealScreen: undefined;
};

// Create Stack and Tab navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Stack for Nutrition and its related screens
const NutritionStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NutritionScreen" component={NutritionScreen} />
      <Stack.Screen name="SelectFoodScreen" component={SelectFoodScreen} />
      <Stack.Screen name="NutritionGraphScreen" component={NutritionGraphScreen} />
    </Stack.Navigator>
  );
};

// Tab Navigator that contains the main app screens (with bottom tab bar)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Nutrition') {
            iconName = focused ? 'nutrition' : 'nutrition-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          paddingBottom: 3,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Progress" component={ProgressTrackingScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Nutrition" component={NutritionStack} options={{ headerShown: false }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_51QKdJvIorn0Rz2pz5L9JTt7Y4OcapO3sujSiLLA8JT6ELfSQbARRPbcZjyRs0cUu0rd4m8mb5lgA67RVR7TIviOv00UwyShvs9">
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen">
          {/* Authentication Screens */}
          <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="UserInfoScreen" component={UserInfoScreen} options={{ headerShown: false }} />

          {/* Main App Tab Screens */}
          <Stack.Screen name="HomeScreen" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MealPlansScreen" component={MealPlansScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="PaymentSuccessScreen" component={PaymentSuccessScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="MealPlanDetailScreen" component={MealPlanDetailScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="PersonalizedMealPlanScreen" component={PersonalizedMealPlanScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RequestMealScreen" component={RequestMealScreen} options={{ headerShown: false }}/>

          {/* Admin Screens */}
          <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminUserListScreen" component={AdminUserListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminUserEditScreen" component={AdminUserEditScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminChallengesScreen" component={AdminChallengesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminCreateChallengeScreen" component={AdminCreateChallengeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminChallengeDetailScreen" component={AdminChallengeDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminEditChallengeScreen" component={AdminEditChallengeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminReportedMomentsScreen" component={AdminReportedMomentsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminContentApprovalScreen" component={AdminContentApprovalScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminArticleDetailScreen" component={AdminArticleDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminChallengeTaskApprovalScreen" component={AdminChallengeTaskApprovalScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminMealPlansScreen" component={AdminMealPlansScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminAddMealPlanScreen" component={AdminAddMealPlanScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminAddMealsScreen" component={AdminAddMealsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminCreateRecipeMealScreen" component={AdminCreateRecipeMealScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminRecipeMealsScreen" component={AdminRecipeMealsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminRecipeDetailScreen" component={AdminRecipeDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminViewMealPlansScreen" component={AdminViewMealPlansScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminCreatePersonalizedMealPlanScreen" component={AdminCreatePersonalizedMealPlanScreen} options={{ headerShown: false }} />

          {/* Other Screens (no bottom tab bar) */}
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditFitnessPreferencesScreen" component={EditFitnessPreferencesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ headerShown: false }} />

          {/* Community Screens */}
          <Stack.Screen name="ChallengeDetailScreen" component={ChallengeDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChallengeProgressScreen" component={ChallengeProgressScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SubmitChallengeProgressScreen" component={SubmitChallengeProgressScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LeaderboardScreen" component={LeaderboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddMomentScreen" component={AddMomentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MomentReportScreen" component={MomentReportScreen} options={{ headerShown: false }} />
          <Stack.Screen name="UserProfileScreen" component={UserProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MomentDetailScreen" component={MomentDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddArticleScreen" component={AddArticleScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ArticleScreen" component={ArticleScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast />
    </StripeProvider>
  );
}
