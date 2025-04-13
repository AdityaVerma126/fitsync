import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import mongoService from '../services/mongoService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await mongoService.login(credentials);
      
      if (response && response.token && response.user) {
        setUserToken(response.token);
        setUserInfo(response.user);
        // Any other state updates needed
      } else {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      console.log('Login error in context:', error);
      throw error; // Re-throw to let the component handle UI feedback
    } finally {
      setIsLoading(false); // Always set loading to false
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      // Create a proper user data object if separate parameters are passed
      let formattedUserData = userData;
      
      // If separate parameters are passed (name, email, password)
      if (arguments.length === 3) {
        formattedUserData = {
          name: arguments[0],
          email: arguments[1],
          password: arguments[2]
        };
      }
      
      const response = await mongoService.register(formattedUserData);
      
      if (response && response.token && response.user) {
        setUserToken(response.token);
        setUserInfo(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      console.log('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await mongoService.logout();
      setUserToken(null);
      setUserInfo(null);
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userInfo');
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userToken = await SecureStore.getItemAsync('userToken');
      let userInfo = await SecureStore.getItemAsync('userInfo');
      
      if (userInfo) {
        userInfo = JSON.parse(userInfo);
      }
      
      if (userToken) {
        setUserToken(userToken);
        setUserInfo(userInfo);
      }
    } catch (error) {
      console.log('isLoggedIn error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        register,
        logout,
        isLoading,
        userToken,
        userInfo,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
