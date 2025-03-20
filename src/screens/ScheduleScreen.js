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
import { Calendar } from 'react-native-calendars';

const ScheduleScreen = () => {
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [events, setEvents] = useState([
    { id: 1, title: 'Gym Session', time: '6:00 PM - 7:00 PM', completed: false, date: formattedDate },
    { id: 2, title: 'Team Meeting', time: '2:00 PM - 3:30 PM', completed: false, date: formattedDate },
    { id: 3, title: 'Dentist Appointment', time: '4:30 PM - 5:30 PM', completed: false, date: formattedDate },
  ]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });
  
  // Create marked dates object for calendar
  const markedDates = {};
  events.forEach(event => {
    if (markedDates[event.date]) {
      markedDates[event.date].dots.push({ key: event.id, color: '#4285F4' });
    } else {
      markedDates[event.date] = {
        dots: [{ key: event.id, color: '#4285F4' }],
      };
    }
  });
  
  // Add selected date marking
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: '#4285F4',
  };

  const filteredEvents = events.filter(event => event.date === selectedDate);

  const toggleEventCompleted = (id) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, completed: !event.completed } : event
    ));
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
          onPress: () => {
            setEvents(events.filter(event => event.id !== id));
          }
        },
      ]
    );
  };

  const handleAddEvent = () => {
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
    
    const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1;
    
    setEvents([
      ...events, 
      { 
        id: newId, 
        title: newEvent.title.trim(), 
        time: `${newEvent.startTime} - ${newEvent.endTime}`, 
        completed: false,
        date: selectedDate
      }
    ]);
    
    setNewEvent({ title: '', startTime: '', endTime: '' });
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="search" size={24} color="#333" />
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
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        
        <ScrollView style={styles.eventsList}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <TouchableOpacity
                  style={styles.eventCheckbox}
                  onPress={() => toggleEventCompleted(event.id)}
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
                  <Text style={styles.eventTime}>{event.time}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.eventDeleteButton}
                  onPress={() => deleteEvent(event.id)}
                >
                  <MaterialIcons name="delete-outline" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialIcons name="event-busy" size={48} color="#CCC" />
              <Text style={styles.noEventsText}>No events scheduled for this day</Text>
            </View>
          )}
        </ScrollView>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
      
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
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Event Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Gym Session, Meeting"
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({...newEvent, title: text})}
            />
            
            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newEvent.startTime}
                  onChangeText={(text) => setNewEvent({...newEvent, startTime: text})}
                />
              </View>
              
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  value={newEvent.endTime}
                  onChangeText={(text) => setNewEvent({...newEvent, endTime: text})}
                />
              </View>
            </View>
            
            <Text style={styles.selectedDateText}>
              Date: {new Date(selectedDate).toDateString()}
            </Text>
            
            <TouchableOpacity 
              style={styles.addEventButton}
              onPress={handleAddEvent}
            >
              <Text style={styles.addEventButtonText}>Add Event</Text>
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
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  eventsContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2.22,
  },
  eventCheckbox: {
    marginRight: 10,
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
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  eventTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventDeleteButton: {
    padding: 5,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noEventsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
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
  selectedDateText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '500',
    marginBottom: 20,
  },
  addEventButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScheduleScreen;
