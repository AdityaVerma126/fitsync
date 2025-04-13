import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Define your base URL based on platform
const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    // For Android emulator, use the IP address of your computer on your local network
    return 'http://192.168.1.7:5001'; // Replace X with your actual IP address
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:5001';
  } else {
    return 'http://localhost:5001';
  }
};

const BASE_URL = getBaseUrl();
console.log('Using server URL:', BASE_URL);

class MongoService {
  // Add this to the constructor
  constructor() {
    this.token = null;
    this.user = null;
    this.lastAuthTime = 0; // Track when authentication happened
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Request interceptor to always use the latest token
    this.axiosInstance.interceptors.request.use(
      async config => {
        try {
          // Try to get the latest token from storage if not in memory
          if (!this.token) {
            const storedToken = await AsyncStorage.getItem('auth_token');
            if (storedToken) {
              this.token = storedToken;
              this.updateAxiosHeaders(storedToken);
              console.log('Token retrieved from storage and applied to request');
            }
          }
          
          // Add token to this specific request if available
          if (this.token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${this.token}`;
          }
          
          return config;
        } catch (error) {
          console.error('Error in request interceptor:', error);
          return config;
        }
      },
      error => Promise.reject(error)
    );

    // Response interceptor for handling errors
    this.axiosInstance.interceptors.response.use(
      response => response,
      async error => {
        // Only clear storage for 401 errors that aren't from auth endpoints
        // AND aren't immediately after registration/login
        if (error.response?.status === 401 && 
            !error.config.url.includes('/api/auth/login') && 
            !error.config.url.includes('/api/auth/register') &&
            !error.config.url.includes('/api/users/profile') && // Don't clear on first profile fetch
            Date.now() - this.lastAuthTime > 5000) { // Only if more than 5 seconds since last auth
          console.log('Authentication error detected, clearing storage');
          await this.clearStorage();
          console.log('User needs to login again');
        }
        return Promise.reject(error);
      }
    );
  }

  updateAxiosHeaders(token) {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Headers updated with token');
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['Authorization'];
      console.log('Authorization headers removed');
    }
  }

  getAuthHeader() {
    // Always return the current token if available
    if (this.token) {
      return {
        headers: {
          Authorization: `Bearer ${this.token}`
        }
      };
    }
    return {};
  }

  async clearStorage() {
    this.token = null;
    this.user = null;
    this.updateAxiosHeaders(null);
    await AsyncStorage.multiRemove(['auth_token', 'user_info']);
  }

  // Add authentication methods
  // Update the register method with better error handling
  // Update the register method to fix the issue
  // Update the register method to handle network issues better
  // Update the register method
  async register(userData) {
    try {
      console.log('Attempting registration with:', BASE_URL);
      
      // Fix for when a string is passed instead of an object
      let formattedUserData = userData;
      
      // If userData is just an email string
      if (typeof userData === 'string' && userData.includes('@')) {
        console.log('Converting email string to proper user data object');
        formattedUserData = {
          email: userData.trim(),
          password: '', // This will be caught by validation on the server
          name: ''      // This will be caught by validation on the server
        };
      } 
      // If userData is just a name string
      else if (typeof userData === 'string') {
        console.log('Converting name string to proper user data object');
        formattedUserData = {
          name: userData.trim(),
          email: '',    // This will be caught by validation on the server
          password: ''  // This will be caught by validation on the server
        };
      }
      
      // Final validation
      if (typeof formattedUserData !== 'object' || formattedUserData === null) {
        console.error('Invalid userData format after conversion:', formattedUserData);
        throw new Error('User data must be an object with email, password, and name');
      }
      
      // Log the data we're about to send
      console.log('User data being sent:', JSON.stringify(formattedUserData));
      
      // Use standard post method instead of the complex configuration
      const response = await this.axiosInstance.post(
        '/api/auth/register',
        formattedUserData
      );
      
      console.log('Registration successful:', response.data);
      
      // Automatically log in after successful registration
      if (response.data && response.data.token && response.data.user) {
        // Store authentication data
        this.token = response.data.token;
        this.user = response.data.user;
        this.lastAuthTime = Date.now(); // Track when authentication happened
        this.updateAxiosHeaders(response.data.token);
        
        // Persist in storage
        await AsyncStorage.setItem('auth_token', response.data.token);
        await AsyncStorage.setItem('user_info', JSON.stringify(response.data.user));
        
        console.log('Auto-login after registration successful');
      }
      
      return response.data;
    } catch (error) {
      // Improved error logging
      console.error('Registration error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        url: `${BASE_URL}/api/auth/register`,
        data: userData
      });
      
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw new Error(`Registration failed: ${error.message}`);
      }
    }
  }

  async login(credentials) {
    try {
      // Fix for when credentials are not properly formatted
      if (!credentials || typeof credentials !== 'object') {
        console.error('Invalid credentials format:', credentials);
        throw new Error('Credentials must be an object with email and password');
      }
      
      // Handle case where credentials might be a string (email)
      if (typeof credentials === 'string' && credentials.includes('@')) {
        console.log('Converting email string to proper credentials object');
        credentials = {
          email: credentials.trim(),
          password: '' // This will be caught by validation
        };
      }
      
      // Final validation and debugging
      if (!credentials.email || !credentials.password) {
        console.error('Missing required fields in credentials:', JSON.stringify(credentials));
        throw new Error('Both email and password are required');
      }
      
      // Add more detailed logging
      console.log('Attempting login with credentials:', {
        email: credentials.email,
        passwordLength: credentials.password ? credentials.password.length : 0
      });
      
      // Ensure credentials are properly formatted for the server
      const loginData = {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password
      };
      
      // Use axiosInstance with explicit content type
      const response = await this.axiosInstance.post('/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Validate response
      if (!response.data || !response.data.token || !response.data.user) {
        throw new Error('Invalid server response');
      }

      const { token, user } = response.data;
      
      // Store authentication data
      this.token = token;
      this.user = user;
      this.lastAuthTime = Date.now(); // Track when authentication happened
      
      // Update axios headers
      this.updateAxiosHeaders(token);
      
      // Persist in storage - use Promise.all for better performance
      await Promise.all([
        AsyncStorage.setItem('auth_token', token),
        AsyncStorage.setItem('user_info', JSON.stringify(user))
      ]);
      
      console.log('Login successful for:', user.email || user.name);
      return response.data; // Return the full response data including token and user
    } catch (error) {
      console.error('Login error:', error.message);
      // Rethrow with more details
      if (error.response?.data) {
        throw error.response.data;
      } else {
        throw error;
      }
    }
  }

  async checkAuth() {
    try {
      // Get stored credentials
      const [token, userInfo] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('user_info')
      ]);
      
      if (!token || !userInfo) {
        console.log('No stored credentials found');
        return false;
      }
      
      // Set in memory
      this.token = token;
      this.user = JSON.parse(userInfo);
      this.updateAxiosHeaders(token);
      
      // Verify token with server - but don't fail if server is unreachable
      try {
        const response = await this.axiosInstance.get('/api/auth/verify');
        return response.data?.valid === true;
      } catch (verifyError) {
        console.warn('Token verification failed, but keeping local session:', verifyError.message);
        // Return true to maintain local session even if server verification fails
        // This prevents immediate logout if server is temporarily unavailable
        return true;
      }
    } catch (error) {
      console.error('Auth check error:', error.message);
      await this.clearStorage();
      return false;
    }
  }

  async logout() {
    try {
      // Use axiosInstance instead of direct axios
      await this.axiosInstance.post('/api/auth/logout', {}).catch(() => {});
      await this.clearStorage();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure local cleanup even if server request fails
      await this.clearStorage();
    }
  }

  async retryRequest(requestFn, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }

  // For events
  async getEvents() {
    try {
      const response = await this.axiosInstance.get('/api/events', this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async addEvent(eventData) {
    try {
      const response = await this.axiosInstance.post('/api/events', eventData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding event:', error);
      throw error;
    }
  }

  async updateEvent(eventId, eventData) {
    try {
      const response = await this.axiosInstance.put(`/api/events/${eventId}`, eventData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId) {
    try {
      const response = await this.axiosInstance.delete(`/api/events/${eventId}`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // For meals
  async getMeals() {
    try {
      const response = await this.axiosInstance.get('/api/meals', this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  }

  async addMeal(mealData) {
    try {
      const response = await this.axiosInstance.post('/api/meals', mealData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  }

  async updateMeal(mealId, mealData) {
    try {
      const response = await this.axiosInstance.put(`/api/meals/${mealId}`, mealData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  }

  async deleteMeal(mealId) {
    try {
      const response = await this.axiosInstance.delete(`/api/meals/${mealId}`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  }

  // For workouts
  async getWorkouts() {
    try {
      const response = await this.axiosInstance.get('/api/workouts', this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
  }

  async addWorkout(workoutData) {
    try {
      const response = await this.axiosInstance.post('/api/workouts', workoutData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding workout:', error);
      throw error;
    }
  }

  async updateWorkout(workoutId, workoutData) {
    try {
      const response = await this.axiosInstance.put(`/api/workouts/${workoutId}`, workoutData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  }

  async deleteWorkout(workoutId) {
    try {
      const response = await this.axiosInstance.delete(`/api/workouts/${workoutId}`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  // For exercises
  async getExercises() {
    try {
      const response = await this.axiosInstance.get('/api/exercises', this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  }

  async addExercise(exerciseData) {
    try {
      const response = await this.axiosInstance.post('/api/exercises', exerciseData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error adding exercise:', error);
      throw error;
    }
  }

  // For user profile
  async getUserProfile() {
    try {
      const response = await this.axiosInstance.get('/api/users/profile', this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(profileData) {
    try {
      const response = await this.axiosInstance.put('/api/users/profile', profileData, this.getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

export default new MongoService();
