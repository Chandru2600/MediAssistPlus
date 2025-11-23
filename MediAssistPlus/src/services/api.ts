import axios from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Get API URL from environment or use default
// For physical devices, use your computer's IP address
// For Android emulator, use 10.0.2.2:5000
// For iOS simulator, use localhost:5000
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.236.137.43:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
    },
    timeout: 60000, // 60 second timeout for translation
});

console.log('API configured with baseURL:', API_URL);

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
