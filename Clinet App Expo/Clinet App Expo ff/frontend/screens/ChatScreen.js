import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
  Keyboard
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AIService from '../services/AIIntegrationService';
import AI_CONFIG from '../config/aiConfig';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';

const NVIDIA_API_KEY = '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function sendImageToNvidiaAPI(imageUri) {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const headers = {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    const payload = {
      model: 'meta/llama-4-maverick-17b-128e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `You are an expert home repair and maintenance assistant for the WeFix It app. Look at this image and provide a helpful analysis in a conversational tone. Describe what you see and offer relevant advice or suggestions for home maintenance or repair.` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }
      ],
      max_tokens: 512,
      temperature: 1.0,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stream: false
    };
    const response = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      return 'Sorry, I could not understand the image.';
    }
  } catch (error) {
    console.error('NVIDIA API error:', error);
    return 'Sorry, there was an error processing the image.';
  }
}

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [currentModel, setCurrentModel] = useState('microsoft/Phi-4-reasoning');
  const [refreshKey, setRefreshKey] = useState(0); // For forcing layout refresh
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const scrollViewRef = useRef();

  const availableModels = [...new Set(AI_CONFIG.AVAILABLE_MODELS)]; // Remove duplicates

  // Initialize AI service on component mount
  useEffect(() => {
    const initAIService = async () => {
      try {
        await AIService.initialize();
        // Only add welcome message if no messages exist
        if (messages.length === 0) {
          addMessage(
            "Hello! I'm your WeFix AI assistant. How can I help you with your home services today?",
            false
          );
        }
      } catch (error) {
        console.error('Failed to initialize AI service:', error);
        addMessage(
          'Sorry, I am having trouble connecting to the AI service. Please try again later.',
          false
        );
      }
    };

    initAIService();
  }, []);

  // Handle app resume to force layout refresh
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App resumed, forcing layout refresh');
        setRefreshKey((prev) => prev + 1); // Trigger re-render
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Ensure no extra space remains
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const addMessage = (text, isFromMe, imageUri = null) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      fromMe: isFromMe,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUri
    };
    
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    addMessage(userMessage, true);
    
    setIsLoading(true);
    
    try {
      const response = await AIService.sendMessage(userMessage, currentModel);
      addMessage(response, false);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('Sorry, I encountered an error processing your request.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleNewChat = () => {
    setMessages([]);
    addMessage(
      "Hello! I'm your WeFix AI assistant. How can I help you with your home services today?",
      false
    );
  };

  const changeModel = (model) => {
    setCurrentModel(model);
    setShowModelSelector(false);
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        addMessage(`📷 Image selected`, true, result.assets[0].uri);
        
        // Analyze image with NVIDIA API
        setIsAnalyzingImage(true);
        try {
          const aiAnalysis = await sendImageToNvidiaAPI(result.assets[0].uri);
          addMessage(aiAnalysis, false);
        } catch (error) {
          console.error('Image analysis error:', error);
          addMessage('Sorry, I encountered an error analyzing the image.', false);
        } finally {
          setIsAnalyzingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        addMessage(`📷 Photo captured`, true, result.assets[0].uri);
        
        // Analyze image with NVIDIA API
        setIsAnalyzingImage(true);
        try {
          const aiAnalysis = await sendImageToNvidiaAPI(result.assets[0].uri);
          addMessage(aiAnalysis, false);
        } catch (error) {
          console.error('Image analysis error:', error);
          addMessage('Sorry, I encountered an error analyzing the image.', false);
        } finally {
          setIsAnalyzingImage(false);
        }
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleCameraCapture },
        { text: 'Photo Library', onPress: handleImagePick },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={refreshKey}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>We</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fc8019' }}>Fix</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000' }}>It</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  onPress={handleClearChat} 
                  disabled={messages.length <= 1}
                  style={{ padding: 8, marginLeft: 8 }}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={24} 
                    color={messages.length <= 1 ? '#ccc' : '#333'} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleNewChat}
                  disabled={messages.length === 0}
                  style={[
                    styles.iconButton, 
                    messages.length === 0 && styles.disabledButton,
                    { marginLeft: 8 }
                  ]} 
                >
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={messages.length === 0 ? '#FFFFFF' : '#FFFFFF'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Model Selector Modal */}
          <Modal
            visible={showModelSelector}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowModelSelector(false)}
          >
            <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom', 'left', 'right']}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select AI Model</Text>
                {availableModels.map((model) => (
                  <TouchableOpacity
                    key={model}
                    style={[
                      styles.modelOption,
                      model === currentModel && styles.selectedModel
                    ]}
                    onPress={() => changeModel(model)}
                  >
                    <Text style={styles.modelOptionText}>
                      {model}
                      {model === currentModel && ' (Current)'}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModelSelector(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {messages.map((msg, index) => (
              <View key={msg.id}>
                <View
                  style={[
                    styles.messageBubble,
                    msg.fromMe ? styles.fromMe : styles.fromOther,
                  ]}
                >
                  <View style={styles.messageContent}>
                    {msg.imageUri && (
                      <Image 
                        source={{ uri: msg.imageUri }} 
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={msg.fromMe ? styles.myMessageText : styles.otherMessageText}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.messageTime, { color: '#fc8019' }]}>
                      {msg.time}
                    </Text>
                  </View>
                </View>
                {index < messages.length - 1 && <View style={styles.messageDivider} />}
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.fromOther]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            )}
            {isAnalyzingImage && (
              <View style={[styles.messageBubble, styles.fromOther]}>
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#fc8019" />
                  <Text style={styles.analyzingText}>Analyzing image...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity 
                style={[
                  styles.imageButton,
                  isAnalyzingImage && styles.imageButtonDisabled
                ]}
                onPress={showImageOptions}
                disabled={isAnalyzingImage}
              >
                {isAnalyzingImage ? (
                  <ActivityIndicator size="small" color="#fc8019" />
                ) : (
                  <Ionicons name="image" size={24} color="#fc8019" />
                )}
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                multiline
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  (isLoading || !inputMessage.trim()) && { backgroundColor: '#ccc' }
                ]} 
                onPress={handleSend}
                disabled={isLoading || !inputMessage.trim()}
                activeOpacity={0.7}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialIcons name="send" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.modelSelector}
              onPress={() => setShowModelSelector(true)}
            >
              <Text style={styles.modelSelectorText} numberOfLines={1}>
                {currentModel.split('/').pop() || 'Select Model'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fc8019',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ffad66',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  fromMe: {
    backgroundColor: '#fc8019',
    alignSelf: 'flex-end',
    marginLeft: '15%',
  },
  fromOther: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#fc8019',
    marginRight: '15%',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  myMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  otherMessageText: {
    color: '#000000',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginLeft: 8,
    alignSelf: 'flex-end',
  },
  messageDivider: {
    height: 1,
    backgroundColor: '#ffad66',
    marginVertical: 4,
    opacity: 0.5,
  },
  inputContainer: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    minHeight: 80,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 16,
    color: '#333',
  },
  imageButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  imageButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: '#fc8019',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ffad66',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#000000',
  },
  modelOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedModel: {
    backgroundColor: '#ffad66',
  },
  modelOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  cancelButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fc8019',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    padding: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fc8019',
    marginHorizontal: 2,
  },
  typingDot1: {
    animationKeyframes: [
      {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.3 },
        '100%': { opacity: 1 },
      },
    ],
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  typingDot2: {
    animationKeyframes: [
      {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.3 },
        '100%': { opacity: 1 },
      },
    ],
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationDelay: '0.2s',
  },
  typingDot3: {
    animationKeyframes: [
      {
        '0%': { opacity: 1 },
        '50%': { opacity: 0.3 },
        '100%': { opacity: 1 },
      },
    ],
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationDelay: '0.4s',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modelSelectorText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  analyzingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  analyzingText: {
    marginLeft: 8,
    color: '#000000',
    fontSize: 16,
  },
});