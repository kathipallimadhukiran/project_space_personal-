import { Platform } from 'react-native';
import AI_CONFIG from '../config/aiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ModelClient, AzureKeyCredential, isUnexpected } from '@azure/openai';

class AIIntegrationService {
  constructor() {
    this.conversationHistory = [];
    this.isInitialized = false;
    this.apiKey = null;
    this.currentModel = 'deepseek/DeepSeek-R1-0528';
    this.lastRequestTime = 0;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.rateLimitDelay = 2000; // 2 seconds
  }

  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('Initializing AI service...');

      // Set the API key from config
      this.apiKey = AI_CONFIG.API_KEY;

      if (!this.apiKey) {
        console.error('No API key found in configuration');
        throw new Error('API key is not configured');
      }

      console.log('Using Azure OpenAI with model:', this.currentModel);
      console.log('Endpoint:', AI_CONFIG.ENDPOINT);

      // Initialize conversation history
      this.conversationHistory = [
        {
          role: 'system',
          content: `You are a helpful AI assistant for WeFix, a home services app. 
          Your role is to help users with home repair, maintenance, and services.
          Be friendly, professional, and provide accurate information.`
        }
      ];

      // Load previous conversation if available
      try {
        const savedHistory = await AsyncStorage.getItem('ai_conversation_history');
        if (savedHistory) {
          this.conversationHistory = [
            ...this.conversationHistory,
            ...JSON.parse(savedHistory)
          ];
        }
      } catch (storageError) {
        console.warn('Failed to load conversation history:', storageError);
      }

      this.isInitialized = true;
      console.log('AI Service Initialized with model:', this.currentModel);
      return true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    const { message, model, resolve, reject } = this.requestQueue[0];

    try {
      // Calculate time since last request
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // If we need to wait before the next request
      if (timeSinceLastRequest < this.retryDelay) {
        const waitTime = this.retryDelay - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Process the request
      this.lastRequestTime = Date.now();
      const result = await this._sendMessageInternal(message, model);
      resolve(result);
    } catch (error) {
      console.error('Error in processQueue:', error);
      reject(error);
    } finally {
      // Remove the processed request
      this.requestQueue.shift();
      this.isProcessingQueue = false;

      // Process next in queue if any
      if (this.requestQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  async sendMessage(message, model = null) {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.requestQueue.push({ message, model, resolve, reject });
      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  async _sendMessageInternal(message, model = null) {
    // Use xai/grok-3 for all enhance notes requests, otherwise use the provided model or default
    const isEnhanceRequest = message.includes('enhance the following service request notes');
    const modelToUse = isEnhanceRequest ? 'xai/grok-3' : (model || this.currentModel);

    // Update the current model if a new one is provided
    if (model && !isEnhanceRequest) {
      this.currentModel = model;
    }

    console.log('Sending message to model:', modelToUse);

    if (!this.isInitialized) {
      await this.initialize();
    }

    let attempt = 0;
    let lastError;

    while (attempt < this.maxRetries) {
      try {
        // Add user message to conversation history
        this.conversationHistory.push({
          role: 'user',
          content: message
        });

        // Create Azure AI client
        const client = ModelClient(
          AI_CONFIG.ENDPOINT,
          new AzureKeyCredential(this.apiKey)
        );

        // Truncate conversation history based on model limits
        const maxHistoryTokens = 3000; // Leave room for response
        const truncatedHistory = this._truncateConversationHistory(this.conversationHistory, maxHistoryTokens);

        console.log(`Using model: ${modelToUse} with ${truncatedHistory.length} messages from history`);

        // Prepare the request body
        const requestBody = {
          messages: truncatedHistory,
          max_tokens: 1000,
          model: modelToUse,
          temperature: 0.7,
        };

        console.log('Sending request to:', AI_CONFIG.ENDPOINT);

        // Make the API call
        const response = await client.path("/chat/completions").post({
          body: requestBody
        });

        console.log('Response status:', response.status);

        // Handle unexpected responses
        if (isUnexpected(response)) {
          const errorMessage = response.body?.error?.message || 'Unknown error from AI service';
          console.error('Azure AI Error:', errorMessage);

          // Check for rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after') || this.rateLimitDelay;
            console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            throw new Error('RATE_LIMIT');
          }

          throw new Error(`AI request failed: ${errorMessage}`);
        }

        // Extract the AI response
        const aiResponse = response.body.choices[0]?.message?.content;

        if (!aiResponse) {
          throw new Error('No response content from AI service');
        }

        // Add AI response to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: aiResponse
        });

        return aiResponse;
      } catch (error) {
        lastError = error;

        body: requestBody
      });
      
      console.log('Response status:', response.status);
      
      // Handle unexpected responses
      if (isUnexpected(response)) {
        const errorMessage = response.body?.error?.message || 'Unknown error from AI service';
        console.error('Azure AI Error:', errorMessage);
        throw new Error(`AI request failed: ${errorMessage}`);
      }
      
      } catch (error) {
        lastError = error;
        
        // If it's a rate limit error and we have retries left, try again
        if (error.message === 'RATE_LIMIT' && attempt < maxRetries - 1) {
          console.log(`Retry attempt ${attempt + 1} after rate limit`);
          attempt++;
          continue;
        }
        
        // For other errors, rethrow them
        throw error;
      }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError || new Error('Unknown error after multiple retry attempts');
  },
  
  // Extract response from successful API call
  async _extractResponse(response) {
    // Extract the AI response
    const aiResponse = response.body.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response content from AI service');
    }
      
      // Process the response
      let responseText = aiResponse;
      
      // Clean up the response text
      responseText = responseText
        // Remove <think> tags and their content (case insensitive)
        .replace(/<think[^>]*>[\s\S]*?<\/think>/gi, '')
        // Remove any remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove 'think' if it appears at the start of the response
        .replace(/^\s*think\b\s*/i, '')
        // Clean up any double spaces or newlines
        .replace(/\s+/g, ' ')
        // Remove any leading/trailing punctuation
        .replace(/^[\s\W_]+|[\s\W_]+$/g, '')
        .trim();
      
      // Add AI response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseText
      });
      
      // Save updated conversation history
      try {
        await AsyncStorage.setItem(
          'ai_conversation_history',
          JSON.stringify(this.conversationHistory.filter(m => m.role !== 'system'))
        );
      } catch (storageError) {
        console.error('Failed to save conversation history:', storageError);
      }
      
      return aiResponse;
      
      // This block is no longer needed as it's been replaced by the Azure AI client implementation
      
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  async _initializeModelStatus() {
    // Initialize status for all models
    for (const [key, model] of Object.entries(AI_CONFIG.MODELS)) {
      this.modelStatus.set(key, {
        name: model.name,
        isAvailable: true,
        errorCount: 0,
        lastError: null,
        lastSuccess: Date.now()
      });
    }
  }

  async testConnection() {
    try {
      const response = await fetch(`${AI_CONFIG.ENDPOINT}/models`, {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API test failed with status ${response.status}`);
      }
      
      console.log('AI service connection test successful');
      return true;
    } catch (error) {
      console.error('AI service connection test failed:', error);
      throw error;
    }
  }

  // Get the best available model for a task
  _selectModel(task, persona) {
    let preferredModels = [];
    
    // Get task-specific models
    if (task && AI_CONFIG.TASKS[task]) {
      preferredModels.push(...AI_CONFIG.TASKS[task].preferredModels);
    }
    
    // Add persona-specific models
    if (persona && AI_CONFIG.PERSONAS[persona]) {
      preferredModels.push(...AI_CONFIG.PERSONAS[persona].preferredModels);
    }
    
    // Add fallback models
    preferredModels.push(...AI_CONFIG.FALLBACK.modelSequence);
    
    // Remove duplicates
    preferredModels = [...new Set(preferredModels)];
    
    // Find the first available model
    for (const modelKey of preferredModels) {
      const status = this.modelStatus.get(modelKey);
      if (status && status.isAvailable) {
        return AI_CONFIG.MODELS[modelKey];
      }
    }
    
    // If no preferred model is available, use the backup model
    return AI_CONFIG.MODELS.BACKUP;
  }

  // Enhanced chat function with model selection and fallback
  async chatWithAI(userMessage, options = {}) {
    const {
      persona = 'CUSTOMER_SERVICE',
      context = {},
      task = 'CHAT',
      temperature = AI_CONFIG.DEFAULT_TEMPERATURE
    } = options;

    try {
      await this.ensureInitialized();
      
      // Select the best model for this interaction
      const selectedModel = this._selectModel(task, persona);
      console.log(`Using model: ${selectedModel.name} for task: ${task}`);
      
      // Get the appropriate prompt template
      const promptTemplate = this._getPromptTemplate(task, selectedModel.name);
      
      // Prepare messages array with system message
      const messages = [
        {
          role: "system",
          content: this._getPersonaPrompt(persona, selectedModel.name)
        },
        ...this._getRelevantHistory(),
        { role: 'user', content: this._formatPrompt(promptTemplate, userMessage, context) }
      ];

      // Add context if available
      if (Object.keys(context).length > 0) {
        messages.unshift({
          role: "system",
          content: `Context: ${JSON.stringify(context)}`
        });
      }

      const requestBody = {
        messages,
        temperature: temperature,
        model: selectedModel.name,
        max_tokens: selectedModel.maxTokens,
        stream: false
      };
      
      const response = await this._makeRequestWithRetry('/chat/completions', requestBody, selectedModel);
      
      if (!response.choices?.[0]?.message) {
        throw new Error('Invalid response format from AI service');
      }

      const aiResponse = response.choices[0].message.content;
      
      // Update conversation history
      await this._updateConversationHistory(userMessage, aiResponse);
      
      // Update model status
      this._updateModelStatus(selectedModel.name, true);
      
      return {
        role: 'assistant',
        content: aiResponse,
        model: selectedModel.name,
        isError: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chat error:', error);
      return this._handleError(error);
    }
  }

  // Make request with retry and fallback logic
  async _makeRequestWithRetry(path, body, selectedModel, retryCount = 0) {
    try {
      const response = await this._makeRequest(path, body);
      return response;
    } catch (error) {
      // Update model status on error
      this._updateModelStatus(selectedModel.name, false, error);
      
      // Check if we should retry
      if (retryCount < AI_CONFIG.FALLBACK.maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, AI_CONFIG.FALLBACK.retryDelay));
        
        // Select next model
        const nextModel = this._selectModel(body.task, body.persona);
        if (nextModel.name !== selectedModel.name) {
          console.log(`Retrying with model: ${nextModel.name}`);
          body.model = nextModel.name;
          return this._makeRequestWithRetry(path, body, nextModel, retryCount + 1);
        }
      }
      
      throw error;
    }
  }

  // Update model status based on success/failure
  _updateModelStatus(modelName, success, error = null) {
    for (const [key, model] of Object.entries(AI_CONFIG.MODELS)) {
      if (model.name === modelName) {
        const status = this.modelStatus.get(key);
        if (success) {
          status.errorCount = 0;
          status.lastSuccess = Date.now();
          status.lastError = null;
          status.isAvailable = true;
        } else {
          status.errorCount++;
          status.lastError = error;
          status.isAvailable = status.errorCount < AI_CONFIG.FALLBACK.maxRetries;
        }
        this.modelStatus.set(key, status);
        break;
      }
    }
  }

  // Get appropriate prompt template based on model
  _getPromptTemplate(task, modelName) {
    const templates = AI_CONFIG.PROMPTS[task];
    if (!templates) return null;
    
    if (modelName.includes('grok')) {
      return templates.grok || templates.default;
    } else if (modelName.includes('phi')) {
      return templates.phi || templates.default;
    }
    
    return templates.default;
  }

  // Format prompt with template
  _formatPrompt(template, message, context) {
    if (!template) return message;
    
    let prompt = template;
    for (const [key, value] of Object.entries(context)) {
      prompt = prompt.replace(`{${key}}`, JSON.stringify(value));
    }
    
    return prompt.replace('{message}', message);
  }

  // Get persona prompt with model-specific adjustments
  _getPersonaPrompt(persona, modelName) {
    const personaConfig = AI_CONFIG.PERSONAS[persona];
    if (!personaConfig) {
      console.warn(`Persona ${persona} not found, using default`);
      return AI_CONFIG.PERSONAS.CUSTOMER_SERVICE.role;
    }
    
    let prompt = `You are ${personaConfig.name}, ${personaConfig.role}. Maintain a ${personaConfig.tone} tone.`;
    
    // Add model-specific instructions
    if (modelName.includes('grok')) {
      prompt += ' Provide concise, accurate responses with clear reasoning.';
    } else if (modelName.includes('phi')) {
      prompt += ' Focus on precise, step-by-step explanations.';
    }
    
    return prompt;
  }

  // Service recommendation feature
  async getServiceRecommendations(requirements, context = {}) {
    try {
      await this.ensureInitialized();
      
      if (!this.features.SERVICE_RECOMMENDATIONS) {
        throw new Error('Service recommendations feature is disabled');
      }

      const prompt = AI_CONFIG.PROMPTS.SERVICE_RECOMMENDATION
        .replace('{requirements}', JSON.stringify(requirements))
        .replace('{context}', JSON.stringify(context));

      const response = await this.chatWithAI(prompt, {
        persona: 'TECHNICAL_EXPERT',
        temperature: AI_CONFIG.MODELS.RECOMMENDATIONS.temperature
      });

      return {
        success: true,
        recommendations: response.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Service recommendations error:', error);
      return this._handleError(error);
    }
  }

  // Review analysis feature
  async analyzeReview(review) {
    try {
      await this.ensureInitialized();
      
      if (!this.features.REVIEW_ANALYSIS) {
        throw new Error('Review analysis feature is disabled');
      }

      const prompt = AI_CONFIG.PROMPTS.REVIEW_ANALYSIS
        .replace('{review}', review);

      const response = await this.chatWithAI(prompt, {
        persona: 'TECHNICAL_EXPERT',
        temperature: AI_CONFIG.MODELS.ANALYSIS.temperature
      });

      return {
        success: true,
        analysis: response.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Review analysis error:', error);
      return this._handleError(error);
    }
  }

  // Worker matching feature
  async matchWorker(request, criteria = {}) {
    try {
      await this.ensureInitialized();
      
      if (!this.features.WORKER_MATCHING) {
        throw new Error('Worker matching feature is disabled');
      }

      const prompt = AI_CONFIG.PROMPTS.WORKER_MATCHING
        .replace('{request}', JSON.stringify(request))
        .replace('{criteria}', JSON.stringify(criteria));

      const response = await this.chatWithAI(prompt, {
        persona: 'BOOKING_ASSISTANT',
        temperature: AI_CONFIG.MODELS.RECOMMENDATIONS.temperature
      });

      return {
        success: true,
        matches: response.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Worker matching error:', error);
      return this._handleError(error);
    }
  }

  // Price optimization feature
  async optimizePrice(serviceData, factors = {}) {
    try {
      await this.ensureInitialized();
      
      if (!this.features.PRICE_OPTIMIZATION) {
        throw new Error('Price optimization feature is disabled');
      }

      const prompt = AI_CONFIG.PROMPTS.PRICE_OPTIMIZATION
        .replace('{serviceData}', JSON.stringify(serviceData))
        .replace('{factors}', JSON.stringify(factors));

      const response = await this.chatWithAI(prompt, {
        persona: 'TECHNICAL_EXPERT',
        temperature: AI_CONFIG.MODELS.ANALYSIS.temperature
      });

      return {
        success: true,
        optimization: response.content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Price optimization error:', error);
      return this._handleError(error);
    }
  }

  // Private helper methods
  _getRelevantHistory() {
    // Get last 5 messages for context
    return this.conversationHistory.slice(-5);
  }

  async _updateConversationHistory(userMessage, aiResponse) {
    this.conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: aiResponse }
    );
    
    // Keep only last 20 messages
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
    
    // Save to storage
    try {
      await AsyncStorage.setItem(
        'ai_conversation_history',
        JSON.stringify(this.conversationHistory)
      );
    } catch (error) {
      console.warn('Failed to save conversation history:', error);
    }
  }

  async _makeRequest(path, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, AI_CONFIG.TIMEOUT);

    try {
      const response = await fetch(`${AI_CONFIG.ENDPOINT}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.API_KEY}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  _handleError(error) {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message.includes('401')) {
      errorMessage = 'Authentication failed. Please check your API key.';
    } else if (error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. Please try again.';
    }
    
    return {
      role: 'assistant',
      content: errorMessage,
      isError: true,
      timestamp: new Date().toISOString(),
      errorDetails: error.message
    };
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!this.isInitialized) {
      throw new Error('AI service failed to initialize');
    }
  }

  /**
   * Clears the current conversation history while keeping the system prompt
   */
  async clearConversation() {
    try {
      // Keep only the system message
      this.conversationHistory = this.conversationHistory.filter(
        msg => msg.role === 'system'
      );
      
      // Save the cleared history
      await this.saveConversationHistory();
      console.log('Conversation history cleared');
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }

  /**
   * Clears the current conversation history while keeping the system prompt
   */
  async clearConversation() {
    try {
      // Keep only the system message
      this.conversationHistory = this.conversationHistory.filter(
        msg => msg.role === 'system'
      );
      
      // Save the cleared history
      await this.saveConversationHistory();
      console.log('Conversation history cleared');
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }
}

// Export the class directly
export default new AIIntegrationService();
