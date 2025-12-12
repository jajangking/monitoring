import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import ChatBotBubble from './components/ChatBotBubble';
import { setupAI } from './utils/aiSetup';

// Wrap the main component with AuthProvider
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Main app content that handles auth state
const AppContent = () => {
  const [aiInitialized, setAiInitialized] = useState(false);

  useEffect(() => {
    // Initialize AI service when app starts
    if (!aiInitialized) {
      setupAI();
      setAiInitialized(true);
    }
  }, [aiInitialized]);

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <Dashboard />
        <ChatBotBubble />
        <StatusBar style="auto" />
      </View>
    </ProtectedRoute>
  );
};

export default AppWithAuth;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
