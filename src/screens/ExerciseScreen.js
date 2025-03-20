import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';

const ExerciseScreen = () => {
  const [exercises, setExercises] = useState([
    { id: 1, name: 'Push-ups', sets: 3, reps: 12, completed: false, timerActive: false },
    { id: 2, name: 'Squats', sets: 4, reps: 15, completed: false, timerActive: false },
    { id: 3, name: 'Plank', duration: 60, completed: false, timerActive: false },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timerActive, setTimerActive] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  
  // New exercise form
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    duration: ''
  });

  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time;
  };

  const toggleExerciseCompleted = (id) => {
    setExercises(exercises.map(exercise => 
      exercise.id === id ? { ...exercise, completed: !exercise.completed } : exercise
    ));
  };

  const toggleTimer = (id) => {
    if (activeTimer === id) {
      // Stop this timer
      setActiveTimer(null);
    } else {
      // Stop any active timer and start this one
      setActiveTimer(id);
    }
  };

  const resetMainTimer = () => {
    setTimer({ hours: 0, minutes: 0, seconds: 0 });
    setTimerActive(false);
  };

  const toggleMainTimer = () => {
    setTimerActive(!timerActive);
  };

  const handleAddExercise = () => {
    // Validate inputs
    if (!newExercise.name) {
      alert('Please enter an exercise name');
      return;
    }

    const isDuration = newExercise.duration && !newExercise.sets && !newExercise.reps;
    const isSetsReps = !newExercise.duration && newExercise.sets && newExercise.reps;

    if (!isDuration && !isSetsReps) {
      alert('Please enter either duration or sets and reps');
      return;
    }

    const newId = exercises.length > 0 ? Math.max(...exercises.map(e => e.id)) + 1 : 1;
    
    const exerciseToAdd = {
      id: newId,
      name: newExercise.name,
      completed: false,
      timerActive: false
    };

    if (isDuration) {
      exerciseToAdd.duration = parseInt(newExercise.duration, 10);
    } else {
      exerciseToAdd.sets = parseInt(newExercise.sets, 10);
      exerciseToAdd.reps = parseInt(newExercise.reps, 10);
    }

    setExercises([...exercises, exerciseToAdd]);
    setNewExercise({ name: '', sets: '', reps: '', duration: '' });
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Exercises</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {formatTime(timer.hours)}:{formatTime(timer.minutes)}:{formatTime(timer.seconds)}
        </Text>
        <View style={styles.timerControls}>
          <TouchableOpacity 
            style={[styles.timerButton, styles.playButton]}
            onPress={toggleMainTimer}
          >
            <MaterialIcons 
              name={timerActive ? "pause" : "play-arrow"} 
              size={30} 
              color="#fff" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.timerButton}
            onPress={resetMainTimer}
          >
            <MaterialIcons name="replay" size={24} color="#555" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.exerciseList}>
        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseItem}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <TouchableOpacity
                onPress={() => toggleExerciseCompleted(exercise.id)}
              >
                <View style={[
                  styles.checkbox, 
                  exercise.completed && styles.checkboxChecked
                ]}>
                  {exercise.completed && (
                    <MaterialIcons name="check" size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.exerciseDetails}>
              {exercise.duration 
                ? `${exercise.duration} seconds` 
                : `${exercise.sets} sets of ${exercise.reps} reps`
              }
            </Text>
            
            <TouchableOpacity 
              style={styles.startTimerButton}
              onPress={() => toggleTimer(exercise.id)}
            >
              <MaterialIcons 
                name={activeTimer === exercise.id ? "stop" : "play-arrow"} 
                size={16} 
                color="#fff" 
              />
              <Text style={styles.startTimerText}>
                {activeTimer === exercise.id ? "Stop Timer" : "Start Timer"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Exercise</Text>
      </TouchableOpacity>
      
      {/* Add Exercise Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Exercise</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Exercise Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Push-ups, Squats, etc."
              value={newExercise.name}
              onChangeText={(text) => setNewExercise({...newExercise, name: text})}
            />
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Sets</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 3"
                  keyboardType="numeric"
                  value={newExercise.sets}
                  onChangeText={(text) => setNewExercise({...newExercise, sets: text})}
                />
              </View>
              
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                  value={newExercise.reps}
                  onChangeText={(text) => setNewExercise({...newExercise, reps: text})}
                />
              </View>
            </View>
            
            <Text style={styles.inputLabel}>Duration (seconds)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 60"
              keyboardType="numeric"
              value={newExercise.duration}
              onChangeText={(text) => setNewExercise({...newExercise, duration: text})}
            />
            
            <Text style={styles.inputNote}>
              Note: Fill either Sets & Reps OR Duration
            </Text>
            
            <TouchableOpacity 
              style={styles.addExerciseButton}
              onPress={handleAddExercise}
            >
              <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
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
  timerContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  timerControls: {
    flexDirection: 'row',
    marginTop: 15,
  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginHorizontal: 10,
  },
  playButton: {
    backgroundColor: '#4285F4',
  },
  exerciseList: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  exerciseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4285F4',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  startTimerButton: {
    flexDirection: 'row',
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  startTimerText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 5,
  },
  addButton: {
    backgroundColor: '#4285F4',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
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
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  inputNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  addExerciseButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExerciseScreen;
