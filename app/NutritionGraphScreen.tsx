import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

interface NutritionDataItem {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  date: string;
}

const NutritionGraphScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Daily');
  const [nutritionData, setNutritionData] = useState<NutritionDataItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        Alert.alert('Error', 'Unable to fetch user information.');
        return;
      }
      setUserId(data.user.id);
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('daily_nutrition')
          .select('total_calories, total_protein, total_carbs, total_fats, date')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        if (error) throw error;
        if (data) setNutritionData(data as NutritionDataItem[]);
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert('Error', 'An unknown error occurred.');
        }
      }
    };

    fetchData();
  }, [userId]);

  const groupDataByWeek = () => {
    const groupedData: { [key: string]: { total_calories: number; total_protein: number; total_carbs: number; total_fats: number } } = {};
    const weekLabels: string[] = [];

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let currentWeekStart = new Date(firstDayOfMonth);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    const lastWeekEnd = new Date(lastDayOfMonth);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() + 6);

    let weekNumber = 1;
    while (currentWeekStart <= lastWeekEnd) {
      const label = `Week ${weekNumber}`;
      weekLabels.push(label);

      groupedData[label] = {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fats: 0,
      };

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      weekNumber++;
    }

    nutritionData.forEach((item) => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const label = `Week ${Math.ceil((date.getDate() - 1) / 7) + 1}`;

      if (groupedData[label]) {
        groupedData[label].total_calories += item.total_calories;
        groupedData[label].total_protein += item.total_protein;
        groupedData[label].total_carbs += item.total_carbs;
        groupedData[label].total_fats += item.total_fats;
      }
    });

    return { groupedData, weekLabels };
  };

  const getChartData = () => {
    const labels: string[] = [];
    const caloriesData: number[] = [];
    const proteinData: number[] = [];
    const carbsData: number[] = [];
    const fatsData: number[] = [];

    if (selectedTimeFrame === 'Daily') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const label = date.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(label);

        const dayData = nutritionData.find(
          (item) => new Date(item.date).toDateString() === date.toDateString()
        );

        caloriesData.push(dayData ? dayData.total_calories : 0);
        proteinData.push(dayData ? dayData.total_protein : 0);
        carbsData.push(dayData ? dayData.total_carbs : 0);
        fatsData.push(dayData ? dayData.total_fats : 0);
      }
    } else if (selectedTimeFrame === 'Weekly') {
      const { groupedData, weekLabels } = groupDataByWeek();

      weekLabels.forEach((label) => {
        labels.push(label);
        caloriesData.push(groupedData[label].total_calories || 0);
        proteinData.push(groupedData[label].total_protein || 0);
        carbsData.push(groupedData[label].total_carbs || 0);
        fatsData.push(groupedData[label].total_fats || 0);
      });
    } else if (selectedTimeFrame === 'Monthly') {
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const label = date.toLocaleDateString('en-US', { month: 'short' });
        labels.push(label);

        const monthData = nutritionData.filter(
          (item) =>
            new Date(item.date).getMonth() === date.getMonth() &&
            new Date(item.date).getFullYear() === date.getFullYear()
        );

        const monthlyCalories = monthData.reduce((sum, item) => sum + item.total_calories, 0);
        const monthlyProtein = monthData.reduce((sum, item) => sum + item.total_protein, 0);
        const monthlyCarbs = monthData.reduce((sum, item) => sum + item.total_carbs, 0);
        const monthlyFats = monthData.reduce((sum, item) => sum + item.total_fats, 0);

        caloriesData.push(monthlyCalories || 0);
        proteinData.push(monthlyProtein || 0);
        carbsData.push(monthlyCarbs || 0);
        fatsData.push(monthlyFats || 0);
      }
    }

    return {
      labels,
      datasets: [
        { data: caloriesData },
        { data: proteinData },
        { data: carbsData },
        { data: fatsData },
      ],
    };
  };

  const getNutritionOverview = () => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    if (selectedTimeFrame === 'Daily') {
      const today = new Date().toISOString().split('T')[0];
      const todayData = nutritionData.find((item) => item.date === today);
      if (todayData) {
        calories = todayData.total_calories;
        protein = todayData.total_protein;
        carbs = todayData.total_carbs;
        fats = todayData.total_fats;
      }
    } else if (selectedTimeFrame === 'Weekly') {
      const last7Days = nutritionData.slice(-7);
      last7Days.forEach((item) => {
        calories += item.total_calories;
        protein += item.total_protein;
        carbs += item.total_carbs;
        fats += item.total_fats;
      });
    } else if (selectedTimeFrame === 'Monthly') {
      const last30Days = nutritionData.slice(-30);
      last30Days.forEach((item) => {
        calories += item.total_calories;
        protein += item.total_protein;
        carbs += item.total_carbs;
        fats += item.total_fats;
      });
    }

    return { calories, protein, carbs, fats };
  };

  const overviewData = getNutritionOverview();
  const chartData = getChartData();

  return (
    <ImageBackground source={require('../assets/white.png')} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition Insights</Text>
        </View>

        <View style={styles.toggleContainer}>
          {['Daily', 'Weekly', 'Monthly'].map((timeFrame) => (
            <TouchableOpacity
              key={timeFrame}
              style={[styles.toggleButton, selectedTimeFrame === timeFrame && styles.activeButton]}
              onPress={() => setSelectedTimeFrame(timeFrame)}
            >
              <Text style={selectedTimeFrame === timeFrame ? styles.activeText : styles.toggleText}>{timeFrame}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView>
          <View style={styles.graphContainer}>
            <Text style={styles.chartTitle}>{`${selectedTimeFrame} Calories`}</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.datasets[0].data,
                    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                    strokeWidth: 4,
                  },
                ],
              }}
              width={wp('90%')}
              height={hp('30%')}
              chartConfig={{
                backgroundColor: '#f5f5f5',
                backgroundGradientFrom: '#f5f5f5',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                strokeWidth: 3,
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#fff',
                },
                decimalPlaces: 0,
              }}
              onDataPointClick={({ value, index }) => {
                const label = chartData.labels[index];
                Alert.alert('Calories Data', `Value: ${value} kcal on ${label}`);
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.graphContainer}>
            <Text style={styles.chartTitle}>{`${selectedTimeFrame} Macronutrients`}</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.datasets[1].data,
                    color: (opacity = 1) => `rgba(142, 68, 173, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.datasets[2].data,
                    color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
                    strokeWidth: 3,
                  },
                  {
                    data: chartData.datasets[3].data,
                    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={wp('90%')}
              height={hp('30%')}
              chartConfig={{
                backgroundColor: '#f5f5f5',
                backgroundGradientFrom: '#f5f5f5',
                backgroundGradientTo: '#fff',
                color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                strokeWidth: 3,
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#fff',
                },
                decimalPlaces: 0,
              }}
              onDataPointClick={({ value, index }) => {
                const label = chartData.labels[index];
                const nutrient = index === 0 ? 'Protein' : index === 1 ? 'Carbs' : 'Fats';
                Alert.alert(`${nutrient} Data`, `Value: ${value} g on ${label}`);
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Macronutrient Breakdown</Text>
            <View style={styles.legendItems}>
              {['#E74C3C', '#8E44AD', '#27AE60', '#3498DB'].map((color, index) => (
                <View style={styles.legendItem} key={index}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendLabel}>
                    {['Calories', 'Protein', 'Carbs', 'Fats'][index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionHeader}>{`${selectedTimeFrame} Nutrition Overview`}</Text>
            {['Total Calories', 'Protein', 'Carbohydrates', 'Fats'].map((label, index) => {
              const value =
                label === 'Total Calories'
                  ? overviewData.calories
                  : label === 'Protein'
                  ? overviewData.protein
                  : label === 'Carbohydrates'
                  ? overviewData.carbs
                  : overviewData.fats;
              return (
                <View style={styles.summaryCard} key={index}>
                  <Text style={styles.cardLabel}>{label}</Text>
                  <Text style={styles.cardValue}>
                    {value} {label === 'Total Calories' ? 'kcal' : 'g'}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495e',
    paddingTop: hp('4%'),
    paddingBottom: hp('2%'),
    paddingHorizontal: wp('4%'),
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: hp('3%'),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: hp('1%'),
    paddingHorizontal: wp('5%'),
  },
  toggleButton: {
    flex: 1,
    paddingVertical: hp('0.8%'),
    marginHorizontal: wp('1%'),
    borderRadius: 20,
    backgroundColor: '#dfe6e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#3498db',
  },
  toggleText: {
    fontSize: hp('1.8%'),
    color: '#2c3e50',
  },
  activeText: {
    fontSize: hp('1.8%'),
    color: '#fff',
  },
  graphContainer: {
    marginVertical: hp('2%'),
    marginHorizontal: wp('5%'),
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  chartTitle: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: '#34495e',
    textAlign: 'center',
    marginVertical: hp('1%'),
  },
  chart: {
    borderRadius: 10,
    paddingVertical: hp('1%'),
  },
  legendContainer: {
    marginVertical: hp('2%'),
    marginHorizontal: wp('5%'),
    padding: hp('1%'),
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  legendTitle: {
    fontSize: hp('2%'),
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: hp('1%'),
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: wp('3.5%'),
    height: wp('3.5%'),
    borderRadius: wp('1.75%'),
    marginRight: wp('1%'),
  },
  legendLabel: {
    fontSize: hp('1.8%'),
    color: '#7f8c8d',
  },
  summarySection: {
    paddingHorizontal: wp('5%'),
  },
  sectionHeader: {
    fontSize: hp('2.4%'),
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: hp('1.5%'),
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: hp('2%'),
    marginBottom: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  cardLabel: {
    fontSize: hp('1.9%'),
    color: '#7f8c8d',
  },
  cardValue: {
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
    color: '#34495e',
    marginTop: hp('0.5%'),
  },
});

export default NutritionGraphScreen;
