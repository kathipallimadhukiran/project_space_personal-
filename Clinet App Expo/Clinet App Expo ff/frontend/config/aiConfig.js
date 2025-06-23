// AI Service Configuration
const AI_CONFIG = {
  // Azure AI Inference Configuration
  ENDPOINT: 'https://models.github.ai/inference',
  DEFAULT_MODEL: 'microsoft/Phi-4-reasoning',
  AVAILABLE_MODELS: [
    'xai/grok-3',
    'deepseek/DeepSeek-R1-0528',
    'microsoft/Phi-4-reasoning',
    'mistral-ai/mistral-medium-2505',
    'xai/grok-3',
    'meta/Llama-4-Scout-17B-16E-Instruct'
  ],
  // This should be set in your environment variables
  GITHUB_TOKEN: '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',
  
  // Request Configuration
  MAX_TOKENS: 2000,
  TIMEOUT: 30000, // 30 seconds
  DEFAULT_TEMPERATURE: 0.7,
  MAX_RETRIES: 3,
  
  // Default Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'WeFixIt-App/1.0.0'
  },
  
  // Feature Flags
  FEATURES: {
    SMART_CHAT: true,
    SERVICE_RECOMMENDATIONS: true,
    REVIEW_ANALYSIS: true,
    PRICE_OPTIMIZATION: true,
    WORKER_MATCHING: true
  },

  // Model Configurations
  MODELS: {
    PHI_REASONING: {
      name: 'microsoft/Phi-4-reasoning',
      description: 'State-of-the-art reasoning model for complex problem solving',
      maxTokens: 2000,
      temperature: 0.7,
      capabilities: ['reasoning', 'analysis', 'chat']
    },
    DEEPSEEK: {
      name: 'deepseek/DeepSeek-R1-0528',
      description: 'Advanced model with improved reasoning and coding support',
      maxTokens: 2500,
      temperature: 0.6,
      capabilities: ['coding', 'reasoning', 'chat']
    },
    MISTRAL: {
      name: 'mistral-ai/mistral-medium-2505',
      description: 'Balanced model with strong general capabilities',
      maxTokens: 2000,
      temperature: 0.7,
      capabilities: ['chat', 'reasoning', 'analysis']
    },
    GROK: {
      name: 'xai/grok-3',
      description: 'Specialized model for complex analysis and technical queries',
      maxTokens: 2000,
      temperature: 0.5,
      capabilities: ['analysis', 'technical', 'reasoning']
    },
    PHI_MINI: {
      name: 'microsoft/Phi-4-mini-reasoning',
      description: 'Lightweight model for faster responses',
      maxTokens: 1500,
      temperature: 0.5,
      capabilities: ['chat', 'quick_answers']
    },
    LLAMA: {
      name: 'meta/Llama-4-Scout-17B-16E-Instruct',
      description: 'Advanced model for multi-document understanding',
      maxTokens: 2500,
      temperature: 0.6,
      capabilities: ['analysis', 'summarization', 'research']
    },
    CODING: {
      name: 'deepseek/DeepSeek-R1-0528',
      description: 'Enhanced reasoning and coding capabilities',
      maxTokens: 2000,
      temperature: 0.3,
      capabilities: ['coding', 'reasoning', 'technical']
    },
    FAST: {
      name: 'openai/gpt-4.1-nano',
      description: 'Quick responses with good accuracy',
      maxTokens: 800,
      temperature: 0.5,
      capabilities: ['chat', 'basic_reasoning']
    },
    MULTIMODAL: {
      name: 'microsoft/Phi-4-multimodal-instruct',
      description: 'Handles text, audio, and image inputs',
      maxTokens: 1500,
      temperature: 0.7,
      capabilities: ['multimodal', 'vision', 'audio']
    }
  },
  
  // AI Personas with model preferences
  PERSONAS: {
    CUSTOMER_SERVICE: {
      name: 'WeFixIt Assistant',
      role: 'A helpful and professional customer service representative',
      tone: 'friendly and professional',
      preferredModels: ['CHAT', 'FAST', 'PRIMARY']
    },
    BOOKING_ASSISTANT: {
      name: 'WeFixIt Booking Helper',
      role: 'An efficient booking assistant',
      tone: 'efficient and clear',
      preferredModels: ['PRIMARY', 'BACKUP', 'FAST']
    },
    TECHNICAL_EXPERT: {
      name: 'WeFixIt Expert',
      role: 'A knowledgeable technical expert',
      tone: 'technical and precise',
      preferredModels: ['CODING', 'ANALYSIS', 'PRIMARY']
    }
  },
  
  // Task-specific model configurations
  TASKS: {
    CHAT: {
      preferredModels: ['CHAT', 'PRIMARY', 'FAST'],
      temperature: 0.7,
      maxTokens: 1000
    },
    ANALYSIS: {
      preferredModels: ['ANALYSIS', 'PRIMARY', 'CODING'],
      temperature: 0.2,
      maxTokens: 1500
    },
    RECOMMENDATIONS: {
      preferredModels: ['PRIMARY', 'ANALYSIS', 'CHAT'],
      temperature: 0.5,
      maxTokens: 1000
    },
    CODE: {
      preferredModels: ['CODING', 'PRIMARY', 'ANALYSIS'],
      temperature: 0.3,
      maxTokens: 2000
    },
    VISION: {
      preferredModels: ['MULTIMODAL', 'PRIMARY'],
      temperature: 0.7,
      maxTokens: 1500
    }
  },
  
  // Prompt Templates with model-specific variations
  PROMPTS: {
    SERVICE_RECOMMENDATION: {
      default: 'Based on the customer\'s requirements: {requirements}, suggest relevant services considering: {context}',
      grok: 'Analyze customer needs ({requirements}) and available services ({context}) to provide optimal recommendations.',
      phi: 'Given requirements: {requirements} and context: {context}, determine the most suitable services.'
    },
    PRICE_OPTIMIZATION: {
      default: 'Analyze the following service data: {serviceData} to suggest optimal pricing based on: {factors}',
      grok: 'Evaluate service metrics ({serviceData}) and market factors ({factors}) for price optimization.',
      phi: 'Calculate optimal pricing for service ({serviceData}) considering factors: {factors}'
    },
    WORKER_MATCHING: {
      default: 'Match the customer request: {request} with workers based on: {criteria}',
      grok: 'Find optimal worker matches for request ({request}) using criteria: {criteria}',
      phi: 'Evaluate worker-customer compatibility for request ({request}) with criteria: {criteria}'
    },
    REVIEW_ANALYSIS: {
      default: 'Analyze the following review: {review} for sentiment and key insights',
      grok: 'Extract sentiment and actionable insights from review: {review}',
      phi: 'Perform comprehensive analysis of review ({review}) for sentiment and patterns'
    }
  },

  // Fallback Configuration
  FALLBACK: {
    maxRetries: 3,
    retryDelay: 1000,
    modelSequence: ['PRIMARY', 'BACKUP', 'FAST'],
    errorThreshold: 0.8
  }
};

export default AI_CONFIG; 