import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

const DietScreen = () => {
  const [meals, setMeals] = useState([
    { id: 1, name: 'Oatmeal', calories: 300, selected: true },
    { id: 2, name: 'Chicken Salad', calories: 450, selected: true },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: ''
  });
  
  const totalCalories = meals
    .filter(meal => meal.selected)
    .reduce((total, meal) => total + meal.calories, 0);

  const handleAddMeal = () => {
    if (!newMeal.name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }
    
    if (!newMeal.calories.trim() || isNaN(newMeal.calories)) {
      Alert.alert('Error', 'Please enter valid calories');
      return;
    }
    
    const newId = meals.length > 0 ? Math.max(...meals.map(m => m.id)) + 1 : 1;
    
    setMeals([
      ...meals, 
      { 
        id: newId, 
        name: newMeal.name.trim(), 
        calories: parseInt(newMeal.calories), 
        selected: true 
      }
    ]);
    
    setNewMeal({ name: '', calories: '' });
    setModalVisible(false);
  };

  const toggleMealSelection = (id) => {
    setMeals(meals.map(meal => 
      meal.id === id ? { ...meal, selected: !meal.selected } : meal
    ));
  };

  const deleteMeal = (id) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setMeals(meals.filter(meal => meal.id !== id));
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diet Tracker</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="more-vert" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.formLabel}>Meal Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Breakfast"
            placeholderTextColor="#A0A0A0"
          />
          
          <Text style={styles.formLabel}>Calories</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 300"
            placeholderTextColor="#A0A0A0"
            keyboardType="numeric"
          />
          
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Meal</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.mealList}>
          {meals.map((meal) => (
            <View key={meal.id} style={styles.mealItem}>
              <TouchableOpacity
                style={styles.mealSelectButton}
                onPress={() => toggleMealSelection(meal.id)}
              >
                <View style={[
                  styles.mealSelectCircle,
                  meal.selected && styles.mealSelectCircleSelected
                ]}>
                  {meal.selected && <View style={styles.mealSelectInner} />}
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.mealDeleteButton}
                onPress={() => deleteMeal(meal.id)}
              >
                <MaterialIcons name="delete-outline" size={24} color="#999" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Calories</Text>
          <Text style={styles.totalValue}>{totalCalories} kcal</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.newMealButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newMealButtonText}>+ Add New Meal</Text>
        </TouchableOpacity>
      </View>
      
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
            
            <Text style={styles.inputLabel}>Meal Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Lunch, Dinner, Snack"
              value={newMeal.name}
              onChangeText={(text) => setNewMeal({...newMeal, name: text})}
            />
            
            <Text style={styles.inputLabel}>Calories</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., 500"
              keyboardType="numeric"
              value={newMeal.calories}
              onChangeText={(text) => setNewMeal({...newMeal, calories: text})}
            />
            
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
  filterButton: {
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
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealList: {
    flex: 1,
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  mealSelectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealSelectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  mealSelectCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  mealSelectInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  mealCalories: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mealDeleteButton: {
    padding: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  newMealButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  newMealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  modalInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  addMealButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addMealButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DietScreen;
