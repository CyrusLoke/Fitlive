import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ImageBackground, Alert, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { supabase } from '../supabaseClient';

// Define the type for a recipe meal
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

// Define the type for the route parameters
type AdminCreateRecipeMealScreenRouteProp = RouteProp<{ AdminCreateRecipeMealScreen: { mealId?: number; mealData?: RecipeMeal | null } }, 'AdminCreateRecipeMealScreen'>;

type Ingredient = {
  name: string;
  quantity: string;
  unit: string;
};

const AdminCreateRecipeMealScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AdminCreateRecipeMealScreenRouteProp>();
  const { mealId, mealData } = route.params || {};

  // States for the recipe meal
  const [recipeName, setRecipeName] = useState(mealData?.name || '');
  const [description, setDescription] = useState(mealData?.description || '');
  const [calories, setCalories] = useState(mealData?.calories?.toString() || '');
  const [carbs, setCarbs] = useState(mealData?.carbs?.toString() || '');
  const [protein, setProtein] = useState(mealData?.protein?.toString() || '');
  const [fats, setFats] = useState(mealData?.fats?.toString() || '');
  const [servingSize, setServingSize] = useState(mealData?.serving_size || '');
  const [instructions, setInstructions] = useState(mealData?.instructions || '');
  const [instructionsHeight, setInstructionsHeight] = useState(hp('10%'));
  const [ingredients, setIngredients] = useState<Ingredient[]>(mealData?.ingredients ? JSON.parse(mealData.ingredients) : []);
  const [ingredientName, setIngredientName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(mealData?.image_base64 || null);

  // Function to add ingredient to the list
  const handleAddIngredient = () => {
    if (ingredientName && quantity && unit) {
      setIngredients([...ingredients, { name: ingredientName, quantity, unit }]);
      setIngredientName('');
      setQuantity('');
      setUnit('');
    } else {
      Alert.alert('Error', 'Please fill out all ingredient fields.');
    }
  };

  // Function to remove an ingredient from the list
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Function to handle image selection
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  // Function to save or update the recipe meal
  const handleSaveRecipeMeal = async () => {
    if (
      !recipeName ||
      !description ||
      !calories ||
      !carbs ||
      !protein ||
      !fats ||
      !servingSize ||
      !instructions ||
      ingredients.length === 0 ||
      !imageBase64
    ) {
      Alert.alert('Error', 'Please fill out all fields, add at least one ingredient, and upload an image.');
      return;
    }

    try {
      if (mealId) {
        // Update existing meal
        const { error } = await supabase
          .from('recipe_meals')
          .update({
            name: recipeName,
            description,
            calories: parseInt(calories),
            carbs: parseInt(carbs),
            protein: parseInt(protein),
            fats: parseInt(fats),
            ingredients: JSON.stringify(ingredients),
            instructions,
            serving_size: servingSize,
            image_base64: imageBase64,
          })
          .eq('id', mealId);

        if (error) throw error;
        Alert.alert('Success', 'Recipe meal updated successfully!');
      } else {
        // Create new meal
        const { error } = await supabase
          .from('recipe_meals')
          .insert([
            {
              name: recipeName,
              description,
              calories: parseInt(calories),
              carbs: parseInt(carbs),
              protein: parseInt(protein),
              fats: parseInt(fats),
              ingredients: JSON.stringify(ingredients),
              instructions,
              serving_size: servingSize,
              image_base64: imageBase64,
            },
          ]);

        if (error) throw error;
        Alert.alert('Success', 'Recipe meal created successfully!');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ImageBackground source={require('../assets/admin.png')} style={styles.backgroundImage}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={wp('6%')} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{mealId ? 'Edit Recipe Meal' : 'Create Recipe Meal'}</Text>
        </View>

        {/* Recipe Name */}
        <Text style={styles.label}>Recipe Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter recipe name"
          placeholderTextColor="#aaa"
          value={recipeName}
          onChangeText={setRecipeName}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter recipe description"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* Nutritional Information */}
        <Text style={styles.label}>Nutritional Information (per serving)</Text>
        <View style={styles.nutritionRow}>
          <TextInput
            style={styles.nutritionInput}
            placeholder="Calories (kcal)"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
            value={calories}
            onChangeText={setCalories}
          />
          <TextInput
            style={styles.nutritionInput}
            placeholder="Carbs (g)"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
            value={carbs}
            onChangeText={setCarbs}
          />
        </View>
        <View style={styles.nutritionRow}>
          <TextInput
            style={styles.nutritionInput}
            placeholder="Protein (g)"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
            value={protein}
            onChangeText={setProtein}
          />
          <TextInput
            style={styles.nutritionInput}
            placeholder="Fats (g)"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
            value={fats}
            onChangeText={setFats}
          />
        </View>

        {/* Ingredients Section */}
        <Text style={styles.label}>Ingredients</Text>
        <View style={styles.ingredientInputRow}>
          <TextInput
            style={styles.ingredientInput}
            placeholder="Ingredient"
            value={ingredientName}
            onChangeText={setIngredientName}
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.ingredientInput}
            placeholder="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />
          <TextInput
            style={styles.ingredientInput}
            placeholder="Unit"
            value={unit}
            onChangeText={setUnit}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={handleAddIngredient}>
            <Ionicons name="add-circle" size={wp('7%')} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* List of Added Ingredients */}
        {ingredients.length > 0 && (
          <View style={styles.ingredientsList}>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>
                  {ingredient.quantity} {ingredient.unit} {ingredient.name}
                </Text>
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                  <Ionicons name="close-circle" size={wp('6%')} color="#ff0000" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Instructions Section */}
        <Text style={styles.label}>Instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea, { height: instructionsHeight }]}
          placeholder="Enter step-by-step instructions"
          placeholderTextColor="#aaa"
          multiline
          value={instructions}
          onChangeText={setInstructions}
          onContentSizeChange={(e) => setInstructionsHeight(e.nativeEvent.contentSize.height)}
        />

        {/* Image Upload */}
        <Text style={styles.label}>Upload Image</Text>
        <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
          <Ionicons name="cloud-upload-outline" size={wp('7%')} color="#555" />
          <Text style={styles.imageUploadText}>Upload Image</Text>
        </TouchableOpacity>
        {imageBase64 && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
            style={{ width: '100%', height: 200, marginTop: hp('2%') }}
          />
        )}

        {/* Serving Size */}
        <Text style={styles.label}>Serving Size</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter serving size (e.g., 2 servings)"
          placeholderTextColor="#aaa"
          value={servingSize}
          onChangeText={setServingSize}
        />

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipeMeal}>
          <Text style={styles.saveButtonText}>Save Recipe Meal</Text>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flexGrow: 1,
    padding: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  backButton: {
    marginRight: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp('1%'),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontSize: wp('4%'),
    color: '#333',
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('2%'),
  },
  nutritionInput: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontSize: wp('4%'),
    color: '#333',
    flex: 1,
    marginHorizontal: wp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  ingredientInput: {
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    fontSize: wp('4%'),
    color: '#333',
    flex: 1,
    marginRight: wp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ingredientsList: {
    marginBottom: hp('2%'),
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    marginBottom: hp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ingredientText: {
    fontSize: wp('4%'),
    color: '#333',
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    padding: wp('3%'),
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: hp('2%'),
  },
  imageUploadText: {
    fontSize: wp('4%'),
    color: '#555',
    marginLeft: wp('2%'),
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: wp('2%'),
    padding: wp('4%'),
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: wp('4.5%'),
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminCreateRecipeMealScreen;
