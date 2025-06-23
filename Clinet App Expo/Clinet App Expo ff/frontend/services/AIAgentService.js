// AI Agent Service for handling chat interactions and doubt classification

import AIIntegrationService from './AIIntegrationService';

// Message categories for classifying user messages
const MESSAGE_CATEGORIES = {
  GREETING: 'greeting',
  BOOKING: 'booking',
  PAYMENT: 'payment',
  SERVICE: 'service',
  COMPLAINT: 'complaint',
  FEEDBACK: 'feedback',
  GENERAL: 'general',
  PRICE_INQUIRY: 'price_inquiry',
  AVAILABILITY: 'availability',
  TECHNICAL: 'technical',
  EMERGENCY: 'emergency'
};

// Enhanced keywords for better message classification
const KEYWORDS = {
  [MESSAGE_CATEGORIES.GREETING]: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
  [MESSAGE_CATEGORIES.BOOKING]: ['book', 'schedule', 'appointment', 'reserve', 'availability', 'when', 'slot', 'time'],
  [MESSAGE_CATEGORIES.PAYMENT]: ['payment', 'pay', 'bill', 'invoice', 'refund', 'charge', 'cost', 'price', 'fee'],
  [MESSAGE_CATEGORIES.SERVICE]: ['service', 'repair', 'fix', 'install', 'maintenance', 'work', 'job', 'task'],
  [MESSAGE_CATEGORIES.COMPLAINT]: ['problem', 'issue', 'not working', 'broken', 'complain', 'dissatisfied', 'unhappy', 'poor'],
  [MESSAGE_CATEGORIES.FEEDBACK]: ['feedback', 'review', 'suggestion', 'rate', 'experience', 'opinion', 'think'],
  [MESSAGE_CATEGORIES.PRICE_INQUIRY]: ['how much', 'cost', 'price', 'charge', 'fee', 'estimate', 'quote'],
  [MESSAGE_CATEGORIES.AVAILABILITY]: ['available', 'when', 'schedule', 'time', 'date', 'slot', 'free'],
  [MESSAGE_CATEGORIES.TECHNICAL]: ['how to', 'technical', 'specification', 'details', 'explain'],
  [MESSAGE_CATEGORIES.EMERGENCY]: ['emergency', 'urgent', 'immediately', 'asap', 'critical', 'serious']
};

class AIAgentService {
  constructor() {
    this.aiService = AIIntegrationService;
    this.context = {};
  }

  // Analyze message intent and context
  async analyzeMessage(message, userData = {}) {
    const category = this._classifyMessage(message);
    const sentiment = await this._analyzeSentiment(message);
    const urgency = this._determineUrgency(message, category);
    
    this.context = {
      ...this.context,
      category,
      sentiment,
      urgency,
      userData
    };

    return {
      category,
      sentiment,
      urgency,
      timestamp: new Date().toISOString()
    };
  }

  // Generate appropriate response based on analysis
  async generateResponse(message, userData = {}) {
    try {
      const analysis = await this.analyzeMessage(message, userData);
      
      // Select appropriate AI persona based on message category
      const persona = this._selectPersona(analysis.category);
      
      // Get AI response with context
      const response = await this.aiService.chatWithAI(message, {
        persona,
        context: {
          ...this.context,
          analysis
        }
      });

      // If it's a service inquiry, get recommendations
      if (analysis.category === MESSAGE_CATEGORIES.SERVICE) {
        const recommendations = await this.aiService.getServiceRecommendations(
          { message, userData },
          this.context
        );
        
        if (recommendations.success) {
          response.recommendations = recommendations.recommendations;
        }
      }

      // If it's a price inquiry, get price optimization
      if (analysis.category === MESSAGE_CATEGORIES.PRICE_INQUIRY) {
        const priceInfo = await this.aiService.optimizePrice(
          { message, userData },
          this.context
        );
        
        if (priceInfo.success) {
          response.priceInfo = priceInfo.optimization;
        }
      }

      return {
        ...response,
        analysis
      };
    } catch (error) {
      console.error('Error generating response:', error);
      return {
        text: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
        error: true,
        errorDetails: error.message
      };
    }
  }

  // Private helper methods
  _classifyMessage(message) {
    if (!message || typeof message !== 'string') {
      return MESSAGE_CATEGORIES.GENERAL;
    }
    
    const lowerMessage = message.toLowerCase();
    
    // Check for emergency first
    if (this._matchesCategory(lowerMessage, MESSAGE_CATEGORIES.EMERGENCY)) {
      return MESSAGE_CATEGORIES.EMERGENCY;
    }
    
    // Check for greetings
    if (this._matchesCategory(lowerMessage, MESSAGE_CATEGORIES.GREETING)) {
      return MESSAGE_CATEGORIES.GREETING;
    }
    
    // Check other categories
    for (const [category, keywords] of Object.entries(KEYWORDS)) {
      if (category === MESSAGE_CATEGORIES.GREETING || 
          category === MESSAGE_CATEGORIES.EMERGENCY) {
        continue;
      }
      
      if (this._matchesCategory(lowerMessage, category)) {
        return category;
      }
    }
    
    return MESSAGE_CATEGORIES.GENERAL;
  }

  _matchesCategory(message, category) {
    return KEYWORDS[category].some(keyword => 
      message.includes(keyword) || 
      this._fuzzyMatch(message, keyword)
    );
  }

  _fuzzyMatch(message, keyword) {
    // Simple fuzzy matching for common typos and variations
    const maxDistance = Math.floor(keyword.length / 4); // Allow 25% difference
    const words = message.split(' ');
    
    return words.some(word => {
      if (Math.abs(word.length - keyword.length) > maxDistance) {
        return false;
      }
      
      let differences = 0;
      for (let i = 0; i < Math.min(word.length, keyword.length); i++) {
        if (word[i] !== keyword[i]) {
          differences++;
        }
        if (differences > maxDistance) {
          return false;
        }
      }
      
      return true;
    });
  }

  async _analyzeSentiment(message) {
    try {
      const analysis = await this.aiService.analyzeReview(message);
      return analysis.success ? analysis.analysis : 'neutral';
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 'neutral';
    }
  }

  _determineUrgency(message, category) {
    if (category === MESSAGE_CATEGORIES.EMERGENCY) {
      return 'high';
    }
    
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'critical'];
    const mediumUrgencyWords = ['soon', 'today', 'tomorrow', 'quick'];
    
    const lowerMessage = message.toLowerCase();
    
    if (urgentWords.some(word => lowerMessage.includes(word))) {
      return 'high';
    }
    
    if (mediumUrgencyWords.some(word => lowerMessage.includes(word))) {
      return 'medium';
    }
    
    return 'low';
  }

  _selectPersona(category) {
    switch (category) {
      case MESSAGE_CATEGORIES.TECHNICAL:
        return 'TECHNICAL_EXPERT';
      case MESSAGE_CATEGORIES.BOOKING:
      case MESSAGE_CATEGORIES.AVAILABILITY:
        return 'BOOKING_ASSISTANT';
      default:
        return 'CUSTOMER_SERVICE';
    }
  }
}

export default new AIAgentService();
