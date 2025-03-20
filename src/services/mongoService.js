import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for our local API server
// For development on same machine, use your machine's IP instead of localhost
// Example: 'http://192.168.1.100:5001'
const BASE_URL = 'http://192.168.1.8:5001'; // Use 10.0.2.2 for Android emulator to access host machine

class MongoService {
  constructor() {
    this.token = null;
    this.user = null;
    this.initializeFromStorage();
  }

  async initializeFromStorage() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const user = await AsyncStorage.getItem('user_info');
      
      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
      }
    } catch (error) {
      console.error('Error initializing MongoDB service:', error);
    }
  }

  // Set auth header for API requests
  getAuthHeader() {
    return {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    };
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      this.token = response.data.token;
      this.user = response.data.user;
      
      await AsyncStorage.setItem('auth_token', this.token);
      await AsyncStorage.setItem('user_info', JSON.stringify(this.user));
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || error;
    }
  }

  async register(name, email, password) {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/register`, {
        name,
        email,
        password
      });
      
      this.token = response.data.token;
      this.user = response.data.user;
      
      await AsyncStorage.setItem('auth_token', this.token);
      await AsyncStorage.setItem('user_info', JSON.stringify(this.user));
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error.response?.data || error;
    }
  }

  async logout() {
    this.token = null;
    this.user = null;
    
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_info');
  }

  // User profile methods
  async getUserProfile() {
    try {
      const response = await axios.get(`${BASE_URL}/api/users/profile`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error.response?.data || error;
    }
  }

  // Exercise methods
  async getExercises() {
    try {
      const response = await axios.get(`${BASE_URL}/api/exercises`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error.response?.data || error;
    }
  }

  async addExercise(exerciseData) {
    try {
      const response = await axios.post(`${BASE_URL}/api/exercises`, exerciseData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding exercise:', error);
      throw error.response?.data || error;
    }
  }

  async updateExercise(id, exerciseData) {
    try {
      const response = await axios.put(`${BASE_URL}/api/exercises/${id}`, exerciseData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error.response?.data || error;
    }
  }

  async deleteExercise(id) {
    try {
      const response = await axios.delete(`${BASE_URL}/api/exercises/${id}`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error.response?.data || error;
    }
  }

  // Meal methods
  async getMeals() {
    try {
      const response = await axios.get(`${BASE_URL}/api/meals`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error.response?.data || error;
    }
  }

  async addMeal(mealData) {
    try {
      const response = await axios.post(`${BASE_URL}/api/meals`, mealData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error.response?.data || error;
    }
  }

  async updateMeal(id, mealData) {
    try {
      const response = await axios.put(`${BASE_URL}/api/meals/${id}`, mealData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error.response?.data || error;
    }
  }

  async deleteMeal(id) {
    try {
      const response = await axios.delete(`${BASE_URL}/api/meals/${id}`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error.response?.data || error;
    }
  }

  // Event methods
  async getEvents() {
    try {
      const response = await axios.get(`${BASE_URL}/api/events`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error.response?.data || error;
    }
  }

  async addEvent(eventData) {
    try {
      const response = await axios.post(`${BASE_URL}/api/events`, eventData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error.response?.data || error;
    }
  }

  async updateEvent(id, eventData) {
    try {
      const response = await axios.put(`${BASE_URL}/api/events/${id}`, eventData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error.response?.data || error;
    }
  }

  async deleteEvent(id) {
    try {
      const response = await axios.delete(`${BASE_URL}/api/events/${id}`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error.response?.data || error;
    }
  }
}

export default new MongoService();
