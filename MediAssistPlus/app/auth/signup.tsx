import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function SignupScreen() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        qualification: '',
        specialization: '',
        college: '',
        experienceYears: '',
    });
    const { signup, isLoading } = useAuth();
    const router = useRouter();

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignup = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }
        try {
            await signup(formData);
        } catch (error: any) {
            const message = error.response?.data?.error || 'Could not create account';
            Alert.alert('Signup Failed', message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Doctor Registration</Text>
                <Text style={styles.subtitle}>Join MediAssist+</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name *"
                    value={formData.name}
                    onChangeText={(text) => handleChange('name', text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email *"
                    value={formData.email}
                    onChangeText={(text) => handleChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password *"
                    value={formData.password}
                    onChangeText={(text) => handleChange('password', text)}
                    secureTextEntry
                />
                <TextInput
                    style={styles.input}
                    placeholder="Qualification (e.g. MBBS)"
                    value={formData.qualification}
                    onChangeText={(text) => handleChange('qualification', text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Specialization (e.g. Cardiology)"
                    value={formData.specialization}
                    onChangeText={(text) => handleChange('specialization', text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="College / University"
                    value={formData.college}
                    onChangeText={(text) => handleChange('college', text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Years of Experience"
                    value={formData.experienceYears}
                    onChangeText={(text) => handleChange('experienceYears', text)}
                    keyboardType="numeric"
                />

                <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={isLoading}>
                    <Text style={styles.buttonText}>{isLoading ? 'Registering...' : 'Sign Up'}</Text>
                </TouchableOpacity>

                <Link href="/auth/login" asChild>
                    <TouchableOpacity style={styles.linkButton}>
                        <Text style={styles.linkText}>Already have an account? Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: colors.background,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.primary,
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray,
        marginTop: 5,
    },
    form: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 10,
        elevation: 5,
    },
    input: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: colors.primary,
        fontSize: 16,
    },
});
