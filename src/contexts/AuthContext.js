import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import mongoService from '../services/mongoService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await mongoService.login(email, password);
      setUserToken(response.token);
      setUserInfo(response.user);
      await SecureStore.setItemAsync('userToken', response.token);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(response.user));
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const response = await mongoService.register(name, email, password);
      setUserToken(response.token);
      setUserInfo(response.user);
      await SecureStore.setItemAsync('userToken', response.token);
      await SecureStore.setItemAsync('userInfo', JSON.stringify(response.user));
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
