import api from '@/utils/api';

interface ChatResponse {
  response?: any;
  error?: string;
}

class ChatbotService {
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await api.post<ChatResponse>('/chatbot', { message });
      return response.data;
    } catch (error: any) {
      console.error('Error sending message to chatbot:', error);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      return {
        error: 'An unexpected error occurred. Please try again later.',
      };
    }
  }
}

export const chatbotService = new ChatbotService();
