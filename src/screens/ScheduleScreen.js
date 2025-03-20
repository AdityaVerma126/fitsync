import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import mongoService from '../services/mongoService';

const ScheduleScreen = () => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'event'
  });

  // Fetch events from database
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await mongoService.getEvents();
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        console.error('Expected array of events but got:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to fetch events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create marked dates object for calendar
  const markedDates = {};
  events.forEach(event => {
    const eventDate = new Date(event.date).toISOString().split('T')[0];
    
    if (markedDates[eventDate]) {
      markedDates[eventDate].dots.push({ key: event._id, color: '#4285F4' });
    } else {
      markedDates[eventDate] = {
        dots: [{ key: event._id, color: '#4285F4' }],
      };
    }
  });
  
  // Add selected date marking
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: '#4285F4',
  };

  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date).toISOString().split('T')[0];
    return eventDate === selectedDate;
  });

  const toggleEventCompleted = async (id) => {
    try {
      const eventToToggle = events.find(event => event._id === id);
      if (!eventToToggle) return;
      
      const updatedEvent = { 
        ...eventToToggle, 
        completed: !eventToToggle.completed 
      };
      
      await mongoService.updateEvent(id, updatedEvent);
      
      // Update local state
      setEvents(events.map(event => 
        event._id === id ? { ...event, completed: !event.completed } : event
      ));
    } catch (error) {
      console.error('Error toggling event completion:', error);
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const deleteEvent = (id) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await mongoService.deleteEvent(id);
              setEvents(events.filter(event => event._id !== id));
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          }
        },
      ]
    );
  };

  const handleAddEvent = async () => {
    // Validate inputs
    if (!newEvent.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    
    if (!newEvent.startTime || !newEvent.endTime) {
      Alert.alert('Error', 'Please enter both start and end times');
      return;
    }
    
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    
    if (!timeRegex.test(newEvent.startTime) || !timeRegex.test(newEvent.endTime)) {
      Alert.alert('Error', 'Please enter valid times (HH:MM format)');
      return;
    }
    
    try {
      const eventToAdd = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        type: newEvent.type,
        date: new Date(selectedDate),
        completed: false
      };
      
      // Add to database
      const addedEvent = await mongoService.addEvent(eventToAdd);
      
      // Update local state
      setEvents([...events, addedEvent]);
      
      // Reset form
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'event'
      });
      setModalVisible(false);
    } catch (error) {
      console.error('Error adding event:', error);
      Alert.alert('Error', 'Failed to add event');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarContainer}>
        <Calendar
          markingType={'multi-dot'}
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          hideExtraDays={true}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#666',
            selectedDayBackgroundColor: '#4285F4',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#4285F4',
            dayTextColor: '#333',
            textDisabledColor: '#CCC',
            dotColor: '#4285F4',
            selectedDotColor: '#FFFFFF',
            arrowColor: '#4285F4',
            monthTextColor: '#333',
            indicatorColor: '#4285F4',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
      </View>
      
      <View style={styles.eventsContainer}>
        <Text style={styles.sectionTitle}>Events for {selectedDate}</Text>
        
        <ScrollView style={styles.eventsList}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <View key={event._id} style={styles.eventItem}>
                <TouchableOpacity
                  style={styles.eventCheckbox}
                  onPress={() => toggleEventCompleted(event._id)}
                >
                  <View style={[
                    styles.checkbox, 
                    event.completed && styles.checkboxChecked
                  ]}>
                    {event.completed && (
                      <MaterialIcons name="check" size={18} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.eventInfo}>
                  <Text style={[
                    styles.eventTitle,
                    event.completed && styles.eventTitleCompleted
                  ]}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventTime}>{event.startTime} - {event.endTime}</Text>
                  {event.description ? (
                    <Text style={styles.eventDescription}>{event.description}</Text>
                  ) : null}
                </View>
                
                <TouchableOpacity
                  style={styles.eventDeleteButton}
                  onPress={() => deleteEvent(event._id)}
                >
                  <MaterialIcons name="delete-outline" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialIcons name="event-busy" size={48} color="#CCC" />
              <Text style={styles.noEventsText}>No events scheduled for this day</Text>
              <TouchableOpacity 
                style={styles.addEventButtonEmpty}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.addEventButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* Add Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Event Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event title"
                value={newEvent.title}
                onChangeText={(text) => setNewEvent({...newEvent, title: text})}
              />
              
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter event description"
                multiline={true}
                numberOfLines={3}
                value={newEvent.description}
                onChangeText={(text) => setNewEvent({...newEvent, description: text})}
              />
              
              <Text style={styles.inputLabel}>Event Type</Text>
              <View style={styles.eventTypeSelector}>
                {['event', 'workout', 'meal', 'meeting'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.eventTypeOption,
                      newEvent.type === type && styles.selectedEventType
                    ]}
                    onPress={() => setNewEvent({...newEvent, type: type})}
                  >
                    <MaterialIcons 
                      name={
                        type === 'workout' ? 'fitness-center' :
                        type === 'meal' ? 'restaurant' :
                        type === 'meeting' ? 'work' : 'event'
                      } 
                      size={18} 
                      color={newEvent.type === type ? "#fff" : "#555"} 
                    />
                    <Text style={[
                      styles.eventTypeText,
                      newEvent.type === type && styles.selectedEventTypeText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.timeInputsContainer}>
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH:MM"
                    value={newEvent.startTime}
                    onChangeText={(text) => setNewEvent({...newEvent, startTime: text})}
                  />
                </View>
                
                <View style={styles.timeInputWrapper}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.timeInput}
                    placeholder="HH:MM"
                    value={newEvent.endTime}
                    onChangeText={(text) => setNewEvent({...newEvent, endTime: text})}
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddEvent}
              >
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
            </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4285F4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventCheckbox: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4285F4',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    color: '#888',
  },
  eventDeleteButton: {
    padding: 5,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  noEventsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
  },
  addEventButtonEmpty: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
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
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  timeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeInputWrapper: {
    width: '48%',
  },
  timeInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 10,
  },
  eventTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedEventType: {
    backgroundColor: '#4285F4',
  },
  eventTypeText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 5,
  },
  selectedEventTypeText: {
    color: '#FFFFFF',
  },
});

export default ScheduleScreen;
