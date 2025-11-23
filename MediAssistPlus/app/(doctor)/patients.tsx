import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../src/services/api';
import { colors } from '../../src/theme/colors';

export default function PatientsScreen() {
    const router = useRouter();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPatients, setFilteredPatients] = useState([]);

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = patients.filter((p: any) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredPatients(filtered);
        } else {
            setFilteredPatients(patients);
        }
    }, [searchQuery, patients]);

    const fetchPatients = async () => {
        try {
            const response = await api.get('/patients');
            setPatients(response.data);
            setFilteredPatients(response.data);
        } catch (error) {
            console.error('Error fetching patients', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (patientId: string) => {
        Alert.alert(
            'Delete Patient',
            'Are you sure you want to delete this patient? All their recordings will also be deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/patients/${patientId}`);
                            setPatients(prev => prev.filter((p: any) => p.id !== patientId));
                            setFilteredPatients(prev => prev.filter((p: any) => p.id !== patientId));
                        } catch (error) {
                            console.error('Error deleting patient:', error);
                            Alert.alert('Error', 'Failed to delete patient');
                        }
                    }
                }
            ]
        );
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
            <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientDetails}>Age: {item.age} • {item.gender}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Patients</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.gray} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={colors.gray}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredPatients}
                    renderItem={renderPatientItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No patients found</Text>
                        </View>
                    }
                />
            )}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: colors.white,
        fontSize: 20,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        margin: 20,
        paddingHorizontal: 15,
        borderRadius: 12,
        height: 50,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    patientCard: {
        backgroundColor: colors.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    deleteButton: {
        padding: 10,
        marginRight: 5,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    patientDetails: {
        fontSize: 14,
        color: colors.gray,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: colors.gray,
        fontSize: 16,
    },
});
