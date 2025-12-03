import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your local IP or ngrok URL
const API_URL = process.env.API_URL || 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Add JWT token to headers
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle 401 Unauthorized
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear auth
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_user');
            // Navigation will redirect to login automatically
        }
        return Promise.reject(error);
    }
);

export default apiClient;
