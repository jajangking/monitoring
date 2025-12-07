import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions
} from 'react-native';
import { sendToAI } from '../utils/aiSetup';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBotBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Halo! Saya adalah asisten virtual. Bagaimana saya bisa membantu Anda hari ini?', sender: 'bot', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsBotTyping(true);

    try {
      // Send message to AI service
      const botResponseText = await sendToAI(inputText);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Fallback message if AI service fails
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, saya mengalami sedikit kendala. Bisakah Anda ulangi pertanyaan Anda?',
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      // Only send if not already sending
      if (!isBotTyping) {
        handleSend();
      }
    }
  };

  return (
    <View style={getDynamicStyles(keyboardVisible, keyboardHeight).container}>
      {/* Chat bubble button */}
      <TouchableOpacity
        style={baseStyles.chatButton}
        onPress={toggleChat}
        accessibilityLabel="Open chat"
      >
        <Text style={baseStyles.chatButtonText}>💬</Text>
      </TouchableOpacity>

      {/* Chat window */}
      {isOpen && (
        <View style={[
          baseStyles.chatWindow,
          {
            height: Math.min(
              400,
              Dimensions.get('window').height - 100 - (keyboardVisible ? keyboardHeight + 80 : 120)
            ) // Calculate max height based on available space, accounting for status bar (approx. 50-100px)
          }
        ]}>
          <View style={baseStyles.chatHeader}>
            <Text style={baseStyles.chatHeaderTitle}>Asisten Virtual</Text>
            <TouchableOpacity onPress={toggleChat} style={baseStyles.closeButton}>
              <Text style={baseStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={baseStyles.messagesContainer}
            onContentSizeChange={() => {
              // Auto-scroll to bottom
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  baseStyles.messageBubble,
                  message.sender === 'user' ? baseStyles.userMessage : baseStyles.botMessage
                ]}
              >
                <Text style={[
                  baseStyles.messageText,
                  message.sender === 'user' ? baseStyles.userMessageText : baseStyles.botMessageText
                ]}>
                  {message.text}
                </Text>
                <Text style={baseStyles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}
            {isBotTyping && (
              <View style={[baseStyles.messageBubble, baseStyles.botMessage]}>
                <View style={baseStyles.typingIndicator}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={baseStyles.botMessageText}> Mengetik...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={baseStyles.inputContainer}
          >
            <TextInput
              style={baseStyles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda..."
              multiline
            />
            <TouchableOpacity
              style={baseStyles.sendButton}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Text style={[
                baseStyles.sendButtonText,
                !inputText.trim() && baseStyles.sendButtonDisabled
              ]}>Kirim</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  chatButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatButtonText: {
    fontSize: 24,
  },
  chatWindow: {
    width: 300,
    height: 400,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatHeader: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  messageBubble: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: '80%',
    position: 'relative',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botMessage: {
    backgroundColor: '#e5e5ea',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    color: '#000',
    fontSize: 14,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

// Function to get dynamic styles based on keyboard visibility
const getDynamicStyles = (keyboardVisible: boolean, keyboardHeight: number) => {
  // Calculate safe position: at least 50px above the keyboard, or default 60px when keyboard is hidden
  const bottomPosition = keyboardVisible ? (keyboardHeight + 20) : 60; // Reduced margin when keyboard is open
  return {
    container: {
      position: 'absolute',
      bottom: bottomPosition,
      right: 20,
      zIndex: 999999, // Z-index yang sangat tinggi untuk memastikan di atas semua elemen
      elevation: 9999, // Untuk Android, menambahkan elevation ekstra
    }
  };
};

export default ChatBotBubble;