import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    specialization?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const checkAuth = async () => {
            console.log('Starting auth check...');
            try {
                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Auth check timed out')), 5000)
                );

                // Race between storage check and timeout
                const checkPromise = async () => {
                    const token = await SecureStore.getItemAsync('token');
                    const userData = await SecureStore.getItemAsync('user');
                    console.log('Storage check complete:', { hasToken: !!token, hasUser: !!userData });
                    if (token && userData) {
                        setUser(JSON.parse(userData));
                    }
                };

                await Promise.race([checkPromise(), timeoutPromise]);
            } catch (error) {
                console.error('Auth check failed or timed out:', error);
            } finally {
                console.log('Setting isLoading to false');
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        console.log('AuthContext Effect:', { isLoading, user: user?.email, segments });
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';
        const inDoctorGroup = segments[0] === '(doctor)';

        if (!user && !inAuthGroup) {
            console.log('Redirecting to login');
            router.replace('/auth/login');
        } else if (user && !inDoctorGroup) {
            console.log('Redirecting to doctor home');
            router.replace('/(doctor)');
        }
    }, [user, segments, isLoading]);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login-doctor', { email, password });
            const { token, doctor } = response.data;
            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('user', JSON.stringify(doctor));
            setUser(doctor);
            router.replace('/(doctor)');
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const signup = async (data: any) => {
        try {
            const response = await api.post('/auth/signup-doctor', data);
            const { token, doctor } = response.data;
            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('user', JSON.stringify(doctor));
            setUser(doctor);
            router.replace('/(doctor)');
        } catch (error) {
            console.error('Signup failed', error);
            throw error;
        }
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        setUser(null);
        router.replace('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
