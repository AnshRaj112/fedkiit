"use client";

/**
 * @fileoverview Chatbot Service for FED Frontend
 * @module services/chatbot/chatbotService
 * @description API client for chatbot backend communication
 */

import { api } from '../index';

/**
 * Chatbot API Service
 * Communicates with FED Backend chatbot endpoints
 */
const chatbotService = {
    /**
     * Send a message to the chatbot and get AI response
     * @param {string} message - User's message
     * @param {Array} conversationHistory - Optional conversation history for context
     * @returns {Promise<Object>} Response object
     */
    sendMessage: async (message, conversationHistory = []) => {
        try {
            const response = await api.post('/api/chatbot/message', {
                message,
                conversationHistory
            }, {
                withCredentials: true // Send cookies for optional auth
            });

            return response.data;
        } catch (error) {
            console.error('[Chatbot Service] Error:', error);

            // Handle auth required response
            if (error.response?.data?.requiresAuth) {
                return {
                    success: false,
                    requiresAuth: true,
                    message: error.response.data.message
                };
            }

            return {
                success: false,
                response: 'Sorry, I encountered an error connecting to the server. Please try again.',
                error: error.message
            };
        }
    },

    /**
     * Check chatbot service health
     * @returns {Promise<Object>} Health status
     */
    checkHealth: async () => {
        try {
            const response = await api.get('/api/chatbot/health');
            return response.data;
        } catch (error) {
            console.error('[Chatbot Service] Health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    },

    /**
     * Send email through chatbot to FED
     * @param {string} content - Email content
     * @param {string} senderName - Optional sender name
     * @param {string} senderEmail - Optional sender email
     * @returns {Promise<Object>} Response object
     */
    sendEmail: async (content, senderName = null, senderEmail = null) => {
        try {
            const response = await api.post('/api/chatbot/send-email', {
                content,
                senderName,
                senderEmail
            }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('[Chatbot Service] Email error:', error);
            return {
                success: false,
                message: 'Failed to send email. Please try again.'
            };
        }
    }
};

export default chatbotService;
