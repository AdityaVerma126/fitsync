import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';

const ProfileScreen = () => {
  const { userInfo, logout } = useContext(AuthContext);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout() }
      ]
    );
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const toggleDarkMode = () => {
    setDarkModeEnabled(!darkModeEnabled);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialIcons name="settings" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://randomuser.me/api/portraits/men/36.jpg' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userInfo?.name || 'John Doe'}</Text>
            <Text style={styles.profileEmail}>{userInfo?.email || 'johndoe@example.com'}</Text>
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>28</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12k</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="person" size={24} color="#4285F4" style={styles.menuIcon} />
            <Text style={styles.menuText}>Personal Information</Text>
            <MaterialIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="history" size={24} color="#4CAF50" style={styles.menuIcon} />
            <Text style={styles.menuText}>Activity History</Text>
            <MaterialIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="lock" size={24} color="#FF9800" style={styles.menuIcon} />
            <Text style={styles.menuText}>Password & Security</Text>
            <MaterialIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.menuItem}>
            <MaterialIcons name="notifications" size={24} color="#9C27B0" style={styles.menuIcon} />
            <Text style={styles.menuText}>Notifications</Text>
            <Switch
              trackColor={{ false: "#CCC", true: "#4285F4" }}
              thumbColor="#FFF"
              ios_backgroundColor="#CCC"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>
          
          <View style={styles.menuItem}>
            <MaterialIcons name="brightness-2" size={24} color="#607D8B" style={styles.menuIcon} />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Switch
              trackColor={{ false: "#CCC", true: "#4285F4" }}
              thumbColor="#FFF"
              ios_backgroundColor="#CCC"
              onValueChange={toggleDarkMode}
              value={darkModeEnabled}
            />
          </View>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="language" size={24} color="#2196F3" style={styles.menuIcon} />
            <Text style={styles.menuText}>Language</Text>
            <View style={styles.menuValueContainer}>
              <Text style={styles.menuValue}>English</Text>
              <MaterialIcons name="chevron-right" size={24} color="#CCC" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>More</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="help" size={24} color="#8BC34A" style={styles.menuIcon} />
            <Text style={styles.menuText}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="privacy-tip" size={24} color="#9E9E9E" style={styles.menuIcon} />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={24} color="#CCC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#F44336" style={styles.menuIcon} />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
  settingsButton: {
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: '#F0F0F0',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4285F4',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    paddingVertical: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    color: '#999',
    marginRight: 5,
  },
  logoutText: {
    color: '#F44336',
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ProfileScreen;
