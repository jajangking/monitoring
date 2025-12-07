// aiSetup.ts - AI service setup function
// This file provides a way to initialize the AI service
//
// SECURITY WARNING:
// For production applications, API keys should NEVER be stored in client-side code.
// Instead, implement a backend service that handles AI API requests securely.
// This example demonstrates the structure but does not include actual API key handling.

import { aiService } from './aiService';
import { enhancedAIService } from './enhancedAI';

/**
 * Sets up the AI service
 * In production, this would communicate with your backend API
 */
export const setupAI = async (): Promise<void> => {
  // Initialize the AI service with API key for development
  await aiService.initialize();
  console.log('AI service setup complete - ready to communicate with Groq API');
};

/**
 * Checks if the AI service is available
 */
export const isAIReady = (): boolean => {
  // In a real implementation, this would check connectivity to your backend
  return true; // Always return true in this mock implementation
};

/**
 * Sends a message to the AI service
 * @param message - The message to send to the AI
 * @returns Promise resolving to the AI's response
 */
export const sendToAI = async (message: string): Promise<string> => {
  try {
    // Use the enhanced AI service for better responses
    return await enhancedAIService.getEnhancedAIResponse(message);
  } catch (error) {
    console.error('Error in sendToAI:', error);
    // Return a generic response if there's an error
    return 'Maaf, saya sedang mengalami kendala. Bisakah Anda coba lagi?';
  }
};