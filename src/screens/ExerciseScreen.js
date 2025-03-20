import React, { useState, useEffect, useRef, useContext } from 'react';
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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import mongoService from '../services/mongoService';

const ExerciseScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timerActive, setTimerActive] = useState(false);
  const [activeTimer, setActiveTimer] = useState(null);
  const timerRef = useRef(null);
  
  // New exercise form
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: '',
    reps: '',
    duration: ''
  });

  // Fetch exercises from database
  useEffect(() => {
    fetchExercises();
  }, []);

  // Handle main timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => {
          let newSeconds = prevTimer.seconds + 1;
          let newMinutes = prevTimer.minutes;
          let newHours = prevTimer.hours;

          if (newSeconds === 60) {
            newSeconds = 0;
            newMinutes += 1;
          }

          if (newMinutes === 60) {
            newMinutes = 0;
            newHours += 1;
          }

          return { hours: newHours, minutes: newMinutes, seconds: newSeconds };
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive]);

  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const data = await mongoService.getExercises();
      setExercises(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch exercises');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time) => {
    return time < 10 ? `0${time}` : time;
  };

  const toggleExerciseCompleted = async (id) => {
    try {
      const exercise = exercises.find(ex => ex._id === id);
      if (!exercise) return;

      const updatedExercise = { ...exercise, completed: !exercise.completed };
      
      // Update UI immediately for better UX
      setExercises(exercises.map(ex => 
        ex._id === id ? updatedExercise : ex
      ));

      // Update in database
      await mongoService.updateExercise(id, { completed: updatedExercise.completed });
    } catch (error) {
      Alert.alert('Error', 'Failed to update exercise');
      console.error(error);
      
      // Revert UI change if API call fails
      fetchExercises();
    }
  };

  const toggleTimer = (id) => {
    if (activeTimer === id) {
      // Stop this timer
      setActiveTimer(null);
      
      // Update exercise completion time in the database
      const exercise = exercises.find(ex => ex._id === id);
      if (exercise) {
        const completionTime = `${formatTime(timer.hours)}:${formatTime(timer.minutes)}:${formatTime(timer.seconds)}`;
        mongoService.updateExercise(id, { completionTime })
          .catch(error => {
            console.error('Failed to update completion time:', error);
          });
      }
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

  const handleAddExercise = async () => {
    // Validate inputs
    if (!newExercise.name) {
      Alert.alert('Validation Error', 'Please enter an exercise name');
      return;
    }

    const isDuration = newExercise.duration && !newExercise.sets && !newExercise.reps;
    const isSetsReps = !newExercise.duration && newExercise.sets && newExercise.reps;

    if (!isDuration && !isSetsReps) {
      Alert.alert('Validation Error', 'Please enter either duration or sets and reps');
      return;
    }

    try {
      const exerciseToAdd = {
        name: newExercise.name,
        completed: false,
      };

      if (isDuration) {
        exerciseToAdd.duration = parseInt(newExercise.duration, 10);
      } else {
        exerciseToAdd.sets = parseInt(newExercise.sets, 10);
        exerciseToAdd.reps = parseInt(newExercise.reps, 10);
      }

      // Add to database
      await mongoService.addExercise(exerciseToAdd);
      
      // Refresh exercises from server
      await fetchExercises();
      
      // Reset form
      setNewExercise({ name: '', sets: '', reps: '', duration: '' });
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add exercise');
      console.error(error);
    }
  };

  const handleDeleteExercise = async (id) => {
    try {
      // Update UI immediately for better UX
      setExercises(exercises.filter(ex => ex._id !== id));
      
      // Delete from database
      await mongoService.deleteExercise(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete exercise');
      console.error(error);
      
      // Revert UI change if API call fails
      fetchExercises();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Exercises</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={fetchExercises}
        >
          <MaterialIcons name="refresh" size={24} color="#333" />
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
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={64} color="#DDD" />
            <Text style={styles.emptyStateText}>No exercises yet</Text>
            <Text style={styles.emptyStateSubtext}>Add your first exercise to get started</Text>
          </View>
        ) : (
          exercises.map((exercise) => (
            <View key={exercise._id} style={styles.exerciseItem}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteExercise(exercise._id)}
                  >
                    <MaterialIcons name="delete" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleExerciseCompleted(exercise._id)}
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
              </View>
              
              <Text style={styles.exerciseDetails}>
                {exercise.duration 
                  ? `${exercise.duration} seconds` 
                  : `${exercise.sets} sets of ${exercise.reps} reps`
                }
              </Text>
              
              {exercise.completionTime && (
                <Text style={styles.completionTime}>
                  Last completion time: {exercise.completionTime}
                </Text>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.startTimerButton,
                  activeTimer === exercise._id && styles.activeTimerButton
                ]}
                onPress={() => toggleTimer(exercise._id)}
              >
                <MaterialIcons 
                  name={activeTimer === exercise._id ? "stop" : "play-arrow"} 
                  size={16} 
                  color="#fff" 
                />
                <Text style={styles.startTimerText}>
                  {activeTimer === exercise._id ? "Stop Timer" : "Start Timer"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
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
    shadowRadius: 3,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    fontVariant: ['tabular-nums'],
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
    backgroundColor: '#4A90E2',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseItem: {
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A90E2',
  },
  exerciseDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  completionTime: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  startTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  activeTimerButton: {
    backgroundColor: '#FF6B6B',
  },
  startTimerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 5,
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
  inputHalf: {
    width: '48%',
  },
  inputNote: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  addExerciseButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addExerciseButtonText: {
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

export default ExerciseScreen;
