import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { colors } from '../../src/theme/colors';

export default function DoctorHomeScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [patients, setPatients] = useState([]);
    const [ollamaStatus, setOllamaStatus] = useState(false);

    useEffect(() => {
        fetchPatients();
        checkOllama();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients');
            setPatients(response.data);
        } catch (error) {
            console.error('Error fetching patients', error);
        }
    };

    const checkOllama = async () => {
        // In a real app, ping backend to check Ollama
        setOllamaStatus(true); // Mocking for now
    };

    const renderPatientItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.patientCard}
            onPress={() => router.push(`/patient/${item.id}`)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {item.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </Text>
            </View>
            <Text style={styles.patientName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.lastVisit}>Last: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.profileInfo}>
                        <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={24} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.welcomeText}>Welcome, Dr. {user?.name} 👋</Text>
                            <Text style={styles.specialization}>{user?.specialization || 'General Practitioner'}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={logout}>
                        <Ionicons name="log-out-outline" size={24} color={colors.white} />
                    </TouchableOpacity>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: ollamaStatus ? colors.accentGreen : colors.error }]} />
                    <Text style={styles.statusText}>AI System: {ollamaStatus ? 'Online' : 'Offline'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Quick Patient Strip */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Patients</Text>
                    {patients.length > 0 ? (
                        <FlatList
                            horizontal
                            data={patients}
                            renderItem={renderPatientItem}
                            keyExtractor={(item) => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.patientList}
                        />
                    ) : (
                        <Text style={styles.emptyText}>No patients yet.</Text>
                    )}
                </View>

                {/* Main Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(doctor)/add-patient')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.softBlue }]}>
                                <Ionicons name="person-add" size={32} color={colors.white} />
                            </View>
                            <Text style={styles.actionText}>Add Patient</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(doctor)/patients')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: colors.accentGreen }]}>
                                <Ionicons name="people" size={32} color={colors.white} />
                            </View>
                            <Text style={styles.actionText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    welcomeText: {
        color: colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    specialization: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        color: colors.white,
        fontSize: 12,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 15,
    },
    patientList: {
        paddingRight: 20,
    },
    patientCard: {
        backgroundColor: colors.white,
        padding: 15,
        borderRadius: 12,
        marginRight: 15,
        width: 120,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    avatarText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    patientName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    lastVisit: {
        fontSize: 10,
        color: colors.gray,
    },
    emptyText: {
        color: colors.gray,
        fontStyle: 'italic',
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionCard: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 12,
        width: '48%',
        alignItems: 'center',
        elevation: 2,
    },
    actionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
});
