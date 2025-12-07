import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ChatBotBubble from './components/ChatBotBubble';
import { setupAI } from './utils/aiSetup';

export default function App() {
  useEffect(() => {
    // Initialize AI service when app starts
    setupAI();
  }, []);

  return (
    <View style={styles.container}>
      <Dashboard />
      <ChatBotBubble />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
