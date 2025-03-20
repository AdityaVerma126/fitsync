import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);

  // Mocked data for demonstration
  const achievements = [
    { id: 1, name: '5-Day Streak', icon: 'whatshot' },
    { id: 2, name: 'Goal Achieved', icon: 'emoji-events' },
    { id: 3, name: 'Early Bird', icon: 'star' },
  ];

  const schedule = [
    { 
      id: 1, 
      type: 'workout', 
      title: 'Morning Workout', 
      time: '6:00 AM - 7:00 AM', 
      icon: 'fitness-center' 
    },
    { 
      id: 2, 
      type: 'meeting', 
      title: 'Team Meeting', 
      time: '3:00 PM - 4:00 PM', 
      icon: 'work' 
    },
    { 
      id: 3, 
      type: 'meal', 
      title: 'Meal Prep', 
      time: '7:00 PM - 8:00 PM', 
      icon: 'restaurant' 
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/36.jpg' }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.username}>{userInfo?.name || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications" size={24} color="#333" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigation.navigate('Diet')}
          >
            <MaterialIcons name="restaurant" size={24} color="#4285F4" />
            <Text style={styles.quickAccessText}>Diet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigation.navigate('Exercise')}
          >
            <MaterialCommunityIcons name="weight-lifter" size={24} color="#4CAF50" />
            <Text style={styles.quickAccessText}>Exercise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickAccessItem}
            onPress={() => navigation.navigate('Schedule')}
          >
            <MaterialIcons name="event" size={24} color="#9C27B0" />
            <Text style={styles.quickAccessText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Your Achievements</Text>
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <MaterialIcons 
                  name={achievement.icon} 
                  size={24} 
                  color={achievement.id === 1 ? '#FFA000' : achievement.id === 2 ? '#FFD700' : '#2196F3'} 
                />
                <Text style={styles.achievementText}>{achievement.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scheduleContainer}>
            {schedule.map((item) => (
              <View key={item.id} style={styles.scheduleItem}>
                <View style={[
                  styles.scheduleIconContainer, 
                  { 
                    backgroundColor: 
                      item.type === 'workout' ? '#E8F5E9' : 
                      item.type === 'meeting' ? '#E3F2FD' : 
                      '#FFF3E0'
                  }
                ]}>
                  <MaterialIcons 
                    name={item.icon} 
                    size={20} 
                    color={
                      item.type === 'workout' ? '#4CAF50' : 
                      item.type === 'meeting' ? '#2196F3' : 
                      '#FF9800'
                    } 
                  />
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>{item.title}</Text>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Details</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressValue}>75%</Text>
              </View>
              <Text style={styles.progressLabel}>Weekly Goal</Text>
            </View>
            
            <View style={styles.progressItem}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressValue}>3/5</Text>
              </View>
              <Text style={styles.progressLabel}>Workouts</Text>
            </View>
            
            <View style={styles.progressItem}>
              <View style={styles.progressCircle}>
                <Text style={styles.progressValue}>1850</Text>
              </View>
              <Text style={styles.progressLabel}>Calories</Text>
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
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
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  quickAccessItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickAccessText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  achievementItem: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    width: '30%',
  },
  achievementText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
  },
  scheduleContainer: {
    marginTop: 5,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  scheduleTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressItem: {
    alignItems: 'center',
    width: '30%',
  },
  progressCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default HomeScreen;
