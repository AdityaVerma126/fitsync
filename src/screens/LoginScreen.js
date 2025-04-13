import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthContext } from '../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      // Show validation error
      setError('Email and password are required');
      return;
    }
    
    try {
      setIsLoading(true); // Make sure this state variable is defined in your component
      setError('');
      
      // Create a proper credentials object
      const credentials = {
        email: email.trim().toLowerCase(),
        password: password
      };
      
      console.log('Submitting login with email:', credentials.email);
      
      // Call the login function with the credentials object
      const response = await mongoService.login(credentials);
      
      // If we get here, login was successful
      console.log('Login successful, navigating to main app');
      
      // Make sure to set loading to false before navigating
      setIsLoading(false);
      
      // Your navigation logic here
    } catch (error) {
      // Always set loading to false in case of error
      setIsLoading(false);
      
      // Display the error message from the server if available
      if (error.message) {
        setError(error.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
      console.error('Login error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="fitness-center" size={60} color="white" />
          </View>
          <Text style={styles.appName}>FitSync</Text>
          <Text style={styles.tagline}>Your Fitness & Schedule Companion</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, styles.activeTab]}
          >
            <Text style={styles.activeTabText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tab}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.tabText}>Register</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialIcons name="account-circle" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialIcons name="apple" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialIcons name="facebook" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4285F4',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2667D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 16,
    color: '#888888',
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#4285F4',
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#4285F4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888888',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  footerText: {
    color: '#FFFFFF',
  },
  registerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
