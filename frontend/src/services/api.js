// src/services/api.js
import authService from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  async sendMessage(chatId, query, tools) {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          query,
          chat_id: chatId,
          tools
        })
      });

      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async createChat(title, tools) {
    try {
      const response = await fetch(`${API_URL}/api/chats/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeader()
        },
        body: JSON.stringify({
          title,
          tools
        })
      });

      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getChats() {
    try {
      const response = await fetch(`${API_URL}/api/chats`, {
        headers: {
          ...authService.getAuthHeader()
        }
      });

      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getChatMessages(chatId) {
    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
        headers: {
          ...authService.getAuthHeader()
        }
      });

      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async deleteChat(chatId) {
    try {
      const response = await fetch(`${API_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          ...authService.getAuthHeader()
        }
      });

      if (response.status === 401) {
        authService.logout();
        window.location.href = '/';
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${API_URL}/`);
      return await response.json();
    } catch (error) {
      console.error('Health Check Failed:', error);
      return { status: 'offline', error: error.message };
    }
  }
}

export default new ApiService();
