import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import * as Progress from 'react-native-progress';
import { useNavigation } from '@react-navigation/native';
import mongoService from '../services/mongoService';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [todaysEvents, setTodaysEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    fetchUserData();
    fetchTodaysEvents();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await mongoService.getUserProfile();
      setUserName(userData.name || 'User');
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserName('User');
    }
  };

  const fetchTodaysEvents = async () => {
    try {
      setLoading(true);
      const events = await mongoService.getEvents();
      
      if (!Array.isArray(events)) {
        console.error('Events data is not an array:', events);
        setTodaysEvents([]);
        setTotalEvents(0);
        setCompletedEvents(0);
        setLoading(false);
        return;
      }
      
      // Filter today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const filtered = events.filter(event => {
        if (!event.date) return false;
        
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });
      
      // Sort by start time
      filtered.sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return String(a.startTime).localeCompare(String(b.startTime));
      });
      
      setTodaysEvents(filtered);
      setTotalEvents(filtered.length);
      setCompletedEvents(filtered.filter(event => event.completed).length);
    } catch (error) {
      console.error('Error fetching today\'s events:', error);
      setTodaysEvents([]);
      setTotalEvents(0);
      setCompletedEvents(0);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    await fetchTodaysEvents();
    setRefreshing(false);
  };

  const handleEventToggle = async (event) => {
    try {
      const updatedEvent = { ...event, completed: !event.completed };
      await mongoService.updateEvent(event._id, updatedEvent);
      
      // Update local state
      setTodaysEvents(prevEvents => 
        prevEvents.map(e => e._id === event._id ? updatedEvent : e)
      );
      
      // Update completion count
      if (updatedEvent.completed) {
        setCompletedEvents(prev => prev + 1);
      } else {
        setCompletedEvents(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const navigateToSchedule = () => {
    navigation.navigate('Schedule');
  };

  const getEventTypeFromTitle = (event) => {
    const title = event.title.toLowerCase();
    const type = event.type || 'event';
    
    if (type) {
      return type.toLowerCase();
    }
    
    // Fallback detection based on title
    if (title.includes('workout') || title.includes('gym') || title.includes('exercise') || title.includes('training')) {
      return 'workout';
    } else if (title.includes('meal') || title.includes('lunch') || title.includes('dinner') || title.includes('breakfast') || title.includes('eat')) {
      return 'meal';
    } else if (title.includes('meeting') || title.includes('call') || title.includes('conference') || title.includes('appointment')) {
      return 'meeting';
    }
    
    return 'event';
  };

  const getEventIcon = (event) => {
    const eventType = getEventTypeFromTitle(event);
    
    switch (eventType) {
      case 'workout':
        return {
          icon: <MaterialIcons name="fitness-center" size={24} color="#fff" />,
          color: '#FF5252'
        };
      case 'meal':
        return {
          icon: <MaterialIcons name="restaurant" size={24} color="#fff" />,
          color: '#4CAF50'
        };
      case 'meeting':
        return {
          icon: <MaterialIcons name="work" size={24} color="#fff" />,
          color: '#448AFF'
        };
      default:
        return {
          icon: <MaterialIcons name="event" size={24} color="#fff" />,
          color: '#9C27B0'
        };
    }
  };

  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [60, 65, 70, 65, 60, 68, 75],
        color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 0,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#4285F4'
    }
  };

  const renderEventsList = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading your schedule...</Text>
        </View>
      );
    }

    if (todaysEvents.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-busy" size={64} color="#DDD" />
          <Text style={styles.emptyText}>No events scheduled for today</Text>
          <TouchableOpacity 
            style={styles.addEventButton}
            onPress={navigateToSchedule}
          >
            <Text style={styles.addEventButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        {todaysEvents.map((event, index) => {
          const { icon, color } = getEventIcon(event);
          
          return (
            <TouchableOpacity 
              key={event._id || index} 
              style={styles.eventItem}
              onPress={() => handleEventToggle(event)}
            >
              <View style={[styles.eventIconContainer, { backgroundColor: color }]}>
                {icon}
              </View>
              
              <View style={styles.eventContent}>
                <Text style={[
                  styles.eventTitle,
                  event.completed && styles.eventCompleted
                ]}>
                  {event.title}
                </Text>
                
                <Text style={styles.eventTime}>
                  {event.startTime || '00:00'} - {event.endTime || '00:00'}
                </Text>
                
                {event.description ? (
                  <Text style={styles.eventDescription} numberOfLines={1}>
                    {event.description}
                  </Text>
                ) : null}
              </View>
              
              <View style={styles.eventStatus}>
                <View style={[
                  styles.statusIndicator, 
                  event.completed ? styles.statusCompleted : styles.statusPending
                ]}>
                  {event.completed ? (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={navigateToSchedule}
        >
          <Text style={styles.viewAllText}>View Full Schedule</Text>
          <MaterialIcons name="chevron-right" size={20} color="#4285F4" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName}!</Text>
            <Text style={styles.date}>{new Date().toDateString()}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=User&background=4285F4&color=fff' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="fire" size={24} color="#FF6B6B" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>1,204</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="shoe-print" size={24} color="#2196F3" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>8,546</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="timer" size={24} color="#4CAF50" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>32</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Weekly Progress</Text>
            <TouchableOpacity>
              <Text style={styles.chartAction}>See More</Text>
            </TouchableOpacity>
          </View>
          <LineChart
            data={data}
            width={screenWidth - 50}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
        
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressValue}>
                {Math.round((completedEvents / Math.max(totalEvents, 1)) * 100)}%
              </Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <Progress.Bar 
                progress={totalEvents ? completedEvents / totalEvents : 0} 
                width={200} 
                height={12}
                color="#4285F4"
                unfilledColor="#E0E0E0"
                borderWidth={0}
                borderRadius={6}
              />
              <Text style={styles.progressText}>
                {completedEvents}/{totalEvents} tasks
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {renderEventsList()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chartAction: {
    fontSize: 14,
    color: '#4285F4',
  },
  chart: {
    marginLeft: -15,
    borderRadius: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  progressContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressInfo: {
    marginRight: 20,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  scheduleSection: {
    marginBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  addEventButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  addEventButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  eventsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  eventIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  eventCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  eventDescription: {
    fontSize: 12,
    color: '#888',
  },
  eventStatus: {
    marginLeft: 10,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPending: {
    borderWidth: 2,
    borderColor: '#DDDDDD',
  },
  statusCompleted: {
    backgroundColor: '#4CAF50',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
    marginRight: 5,
  },
});

export default HomeScreen;
