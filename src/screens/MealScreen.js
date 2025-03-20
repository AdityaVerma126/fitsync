import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import mongoService from '../services/mongoService';

const MealScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [dailyCarbs, setDailyCarbs] = useState(0);
  const [dailyFat, setDailyFat] = useState(0);
  
  // New meal form
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast' // Default meal type
  });

  // Fetch meals from database
  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    setIsLoading(true);
    try {
      const data = await mongoService.getMeals();
      if (Array.isArray(data)) {
        setMeals(data);
        calculateDailyNutrition(data);
      } else {
        console.error('Expected array of meals but got:', data);
        setMeals([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch meals');
      console.error(error);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDailyNutrition = (mealData) => {
    // Filter for today's meals
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const todaysMeals = mealData.filter(meal => {
      const mealDate = new Date(meal.date).toISOString().split('T')[0];
      return mealDate === todayString;
    });
    
    // Calculate totals
    const totals = todaysMeals.reduce((acc, meal) => {
      return {
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    setDailyCalories(totals.calories);
    setDailyProtein(totals.protein);
    setDailyCarbs(totals.carbs);
    setDailyFat(totals.fat);
  };

  const handleAddMeal = async () => {
    // Validate inputs
    if (!newMeal.name) {
      Alert.alert('Validation Error', 'Please enter a meal name');
      return;
    }

    if (!newMeal.calories) {
      Alert.alert('Validation Error', 'Please enter calories');
      return;
    }

    try {
      const mealToAdd = {
        name: newMeal.name,
        calories: parseInt(newMeal.calories, 10) || 0,
        protein: newMeal.protein ? parseInt(newMeal.protein, 10) : 0,
        carbs: newMeal.carbs ? parseInt(newMeal.carbs, 10) : 0,
        fat: newMeal.fat ? parseInt(newMeal.fat, 10) : 0,
        mealType: newMeal.mealType || 'breakfast',
        date: new Date()
      };

      // Add to database
      await mongoService.addMeal(mealToAdd);
      
      // Refresh meals from server
      await fetchMeals();
      
      // Reset form
      setNewMeal({
        name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        mealType: 'breakfast'
      });
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add meal');
      console.error(error);
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      // Update UI immediately for better UX
      setMeals(meals.filter(meal => meal._id !== id));
      
      // Update nutrition totals
      const mealToDelete = meals.find(meal => meal._id === id);
      if (mealToDelete) {
        const mealDate = new Date(mealToDelete.date).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        
        if (mealDate === today) {
          setDailyCalories(prev => prev - (mealToDelete.calories || 0));
          setDailyProtein(prev => prev - (mealToDelete.protein || 0));
          setDailyCarbs(prev => prev - (mealToDelete.carbs || 0));
          setDailyFat(prev => prev - (mealToDelete.fat || 0));
        }
      }
      
      // Delete from database
      await mongoService.deleteMeal(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete meal');
      console.error(error);
      
      // Revert UI change if API call fails
      fetchMeals();
    }
  };

  const getMealTypeIcon = (mealType) => {
    if (!mealType) return 'restaurant'; // Default icon if mealType is undefined
    
    switch(mealType) {
      case 'breakfast':
        return 'wb-sunny';
      case 'lunch':
        return 'restaurant';
      case 'dinner':
        return 'nights-stay';
      case 'snack':
        return 'fastfood';
      default:
        return 'restaurant';
    }
  };

  const getMealTypeColor = (mealType) => {
    if (!mealType) return '#9E9E9E'; // Default color if mealType is undefined
    
    switch(mealType) {
      case 'breakfast':
        return '#FFC107';
      case 'lunch':
        return '#4CAF50';
      case 'dinner':
        return '#3F51B5';
      case 'snack':
        return '#FF5722';
      default:
        return '#9E9E9E';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading meals...</Text>
      </SafeAreaView>
    );
  }

  // Group meals by date (only if we have meals)
  const groupedMeals = meals.length > 0 ? meals.reduce((groups, meal) => {
    if (!meal || !meal.date) return groups;
    
    const date = new Date(meal.date).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {}) : {};

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedMeals).sort((a, b) => new Date(b) - new Date(a));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diet Tracker</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchMeals}
        >
          <MaterialIcons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.nutritionSummary}>
        <Text style={styles.summaryTitle}>Today's Nutrition</Text>
        
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{dailyCalories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{dailyProtein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{dailyCarbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{dailyFat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.mealList}>
        {meals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="restaurant" size={64} color="#DDD" />
            <Text style={styles.emptyStateText}>No meals logged yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first meal to start tracking</Text>
          </View>
        ) : (
          sortedDates.map(date => {
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            });
            
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <View key={date}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>
                    {isToday ? 'Today' : formattedDate}
                  </Text>
                </View>
                
                {groupedMeals[date].map(meal => (
                  <View key={meal._id} style={styles.mealItem}>
                    <View style={styles.mealHeader}>
                      <View style={styles.mealTypeContainer}>
                        <View 
                          style={[
                            styles.mealTypeIcon, 
                            { backgroundColor: getMealTypeColor(meal.mealType) }
                          ]}
                        >
                          <MaterialIcons 
                            name={getMealTypeIcon(meal.mealType)} 
                            size={18} 
                            color="#fff" 
                          />
                        </View>
                        <Text style={styles.mealType}>
                          {meal.mealType ? meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1) : 'Meal'}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteMeal(meal._id)}
                      >
                        <MaterialIcons name="delete" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.mealName}>{meal.name}</Text>
                    
                    <View style={styles.mealNutrition}>
                      <Text style={styles.calorieText}>{meal.calories} calories</Text>
                      
                      <View style={styles.macros}>
                        {meal.protein > 0 && (
                          <Text style={styles.macroText}>P: {meal.protein}g</Text>
                        )}
                        {meal.carbs > 0 && (
                          <Text style={styles.macroText}>C: {meal.carbs}g</Text>
                        )}
                        {meal.fat > 0 && (
                          <Text style={styles.macroText}>F: {meal.fat}g</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Meal</Text>
      </TouchableOpacity>
      
      {/* Add Meal Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Meal</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Meal Type</Text>
            <View style={styles.mealTypeSelector}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeOption,
                    newMeal.mealType === type && styles.selectedMealType,
                    { backgroundColor: newMeal.mealType === type ? getMealTypeColor(type) : '#F0F0F0' }
                  ]}
                  onPress={() => setNewMeal({...newMeal, mealType: type})}
                >
                  <MaterialIcons 
                    name={getMealTypeIcon(type)} 
                    size={20} 
                    color={newMeal.mealType === type ? "#fff" : "#555"} 
                  />
                  <Text 
                    style={[
                      styles.mealTypeText,
                      newMeal.mealType === type && styles.selectedMealTypeText
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.inputLabel}>Meal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Grilled Chicken Salad"
              value={newMeal.name}
              onChangeText={(text) => setNewMeal({...newMeal, name: text})}
            />
            
            <Text style={styles.inputLabel}>Calories</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 350"
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={(text) => setNewMeal({...newMeal, calories: text})}
            />
            
            <View style={styles.inputRow}>
              <View style={styles.inputThird}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 25"
                  keyboardType="numeric"
                  value={newMeal.protein}
                  onChangeText={(text) => setNewMeal({...newMeal, protein: text})}
                />
              </View>
              
              <View style={styles.inputThird}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 30"
                  keyboardType="numeric"
                  value={newMeal.carbs}
                  onChangeText={(text) => setNewMeal({...newMeal, carbs: text})}
                />
              </View>
              
              <View style={styles.inputThird}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 12"
                  keyboardType="numeric"
                  value={newMeal.fat}
                  onChangeText={(text) => setNewMeal({...newMeal, fat: text})}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.addMealButton}
              onPress={handleAddMeal}
            >
              <Text style={styles.addMealButtonText}>Add Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  nutritionSummary: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  mealList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateHeader: {
    marginVertical: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  mealItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mealType: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  macros: {
    flexDirection: 'row',
  },
  macroText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    margin: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mealTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  selectedMealType: {
    backgroundColor: '#4A90E2',
  },
  mealTypeText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#555',
  },
  selectedMealTypeText: {
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputThird: {
    width: '31%',
  },
  addMealButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  addMealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});

export default MealScreen;
