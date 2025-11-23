import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import api from '../../../src/services/api';
import { colors } from '../../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function PatientDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [patient, setPatient] = useState<any>(null);
    const [recordings, setRecordings] = useState([]);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const timerRef = useRef<any>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [isCancelled, setIsCancelled] = useState(false);
    const [summary, setSummary] = useState<{ concise: string; detailed: string } | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    // Transcript & Translation State
    const [showTranscript, setShowTranscript] = useState(false);
    const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [transcriptText, setTranscriptText] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        fetchPatientDetails();
        fetchRecordings();
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync();
            }
        };
    }, [id]);

    const fetchPatientDetails = async () => {
        try {
            const response = await api.get(`/patients/${id}`);
            setPatient(response.data);
        } catch (error) {
            console.error('Error fetching patient', error);
        }
    };

    const fetchRecordings = async () => {
        try {
            const response = await api.get(`/recordings/patient/${id}`);
            setRecordings(response.data);
        } catch (error) {
            console.error('Error fetching recordings', error);
        }
    };

    const startRecording = async () => {
        try {
            // Clean up any existing recording first
            if (recording) {
                try {
                    await recording.stopAndUnloadAsync();
                } catch (e) {
                    // Ignore cleanup errors
                }
                setRecording(null);
            }

            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permission denied', 'Microphone permission is required');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            // Only set state if recording was created successfully
            setRecording(newRecording);
            setIsRecording(true);
            setIsCancelled(false);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording', err);
            Alert.alert('Error', 'Failed to start recording. Please try again.');
            // Reset state on error
            setIsRecording(false);
            setRecording(null);
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);

        if (!recording) {
            console.log('No recording to stop');
            return;
        }

        try {
            // Get URI before stopping
            const uri = recording.getURI();

            // Stop and unload
            await recording.stopAndUnloadAsync();

            // Clear recording state
            setRecording(null);

            // Upload if not cancelled
            if (!isCancelled && uri) {
                uploadRecording(uri);
            } else {
                console.log('Recording cancelled');
            }
        } catch (error: any) {
            console.error('Failed to stop recording', error);
            // Clear recording state even on error
            setRecording(null);

            // Only show alert if it's not a "recorder does not exist" error
            if (!error?.message?.includes('does not exist')) {
                Alert.alert('Error', 'Failed to save recording');
            }
        }
    };

    const uploadRecording = async (uri: string) => {
        setIsUploading(true);
        try {
            console.log('Starting upload for URI:', uri);
            const formData = new FormData();
            formData.append('patientId', id as string);
            // @ts-ignore
            formData.append('audio', {
                uri,
                type: 'audio/m4a',
                name: 'recording.m4a',
            });

            console.log('Uploading to:', api.defaults.baseURL + '/recordings/upload');
            const response = await api.post('/recordings/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000, // 60 second timeout
            });

            console.log('Upload successful:', response.data);
            Alert.alert('Success', 'Recording uploaded successfully');
            fetchRecordings();
        } catch (error: any) {
            console.error('Upload failed', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
            });
            Alert.alert('Error', `Failed to upload recording: ${error.message || 'Network error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const generateSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const response = await api.post(`/recordings/patient/${id}/summary`);
            setSummary(response.data);
            setShowSummary(true);
        } catch (error) {
            console.error('Failed to generate summary', error);
            Alert.alert('Error', 'Failed to generate summary. Please try again.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const playRecording = async (audioUrl: string, id: string) => {
        try {
            if (sound) {
                await sound.unloadAsync();
                setSound(null);
                setPlayingId(null);
                if (playingId === id) return; // Toggle off
            }

            // Set audio mode for playback with proper speaker output
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false, // Use speaker, not earpiece
            });

            // Construct full URL for local storage
            let fullUrl = audioUrl;
            if (!audioUrl.startsWith('http')) {
                // For local storage, audioUrl is just the filename
                const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';
                fullUrl = `${baseUrl}/uploads/${audioUrl}`;
            }

            console.log('Playing audio from:', fullUrl);

            const { sound: newSound } = await Audio.Sound.createAsync(
                {
                    uri: fullUrl,
                    headers: { "Bypass-Tunnel-Reminder": "true" }
                },
                {
                    shouldPlay: true,
                    volume: 1.0, // Set volume to maximum
                    isMuted: false,
                }
            );

            setSound(newSound);
            setPlayingId(id);

            newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                    setPlayingId(null);
                    newSound.unloadAsync();
                    setSound(null);
                }
            });
        } catch (error) {
            console.error('Failed to play audio', error);
            Alert.alert('Error', 'Could not play recording');
        }
    };

    const deleteRecording = async (recordingId: string) => {
        Alert.alert(
            'Delete Recording',
            'Are you sure you want to delete this recording? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/recordings/${recordingId}`);
                            Alert.alert('Success', 'Recording deleted successfully');
                            fetchRecordings();
                        } catch (error) {
                            console.error('Failed to delete recording', error);
                            Alert.alert('Error', 'Failed to delete recording');
                        }
                    }
                }
            ]
        );
    };

    const handleGestureEvent = Animated.event(
        [{ nativeEvent: { translationX: slideAnim } }],
        { useNativeDriver: false }
    );

    const onHandlerStateChange = (event: any) => {
        if (event.nativeEvent.state === State.BEGAN) {
            startRecording();
        } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED || event.nativeEvent.state === State.FAILED) {
            // Only try to stop if we're actually recording
            if (isRecording && recording) {
                if (event.nativeEvent.translationX < -100) {
                    setIsCancelled(true);
                }
                stopRecording();
            } else {
                // Reset state if recording didn't start
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
            }
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false }).start();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const openTranscript = async (recordingId: string, initialTranscript: string) => {
        setSelectedRecordingId(recordingId);
        setTranscriptText(initialTranscript || 'No transcript available.');
        setSelectedLanguage('English');
        setShowTranscript(true);
    };

    const handleLanguageChange = async (language: string) => {
        if (language === selectedLanguage) return;

        setSelectedLanguage(language);
        setIsTranslating(true);

        try {
            const response = await api.post(`/recordings/${selectedRecordingId}/translate`, {
                language
            });
            setTranscriptText(response.data.translation);
        } catch (error) {
            console.error('Translation failed', error);
            Alert.alert('Error', 'Failed to translate transcript');
        } finally {
            setIsTranslating(false);
        }
    };

    if (!patient) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* Audio Recorder - Moved to Top */}
                <View style={styles.recorderContainerTop}>
                    {isRecording ? (
                        <View style={styles.recordingUI}>
                            <Text style={styles.timer}>{formatTime(duration)}</Text>
                            <Animated.View style={[styles.slideTextContainer, { transform: [{ translateX: slideAnim }] }]}>
                                <Text style={styles.slideText}>Slide left to cancel</Text>
                            </Animated.View>
                        </View>
                    ) : (
                        <Text style={styles.hintText}>Hold mic to record new consultation</Text>
                    )}

                    <View style={styles.recordingButtons}>
                        <PanGestureHandler
                            onGestureEvent={handleGestureEvent}
                            onHandlerStateChange={onHandlerStateChange}
                        >
                            <Animated.View style={[styles.micButton, { transform: [{ scale: isRecording ? 1.2 : 1 }] }]}>
                                <Ionicons name="mic" size={32} color={colors.white} />
                            </Animated.View>
                        </PanGestureHandler>

                        {isRecording && (
                            <TouchableOpacity
                                style={styles.stopButton}
                                onPress={() => {
                                    setIsCancelled(false);
                                    stopRecording();
                                }}
                            >
                                <Ionicons name="stop-circle" size={60} color={colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Patient Info Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {patient.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.patientName}>{patient.name}</Text>
                                <Text style={styles.patientDetails}>{patient.age} yrs • {patient.gender}</Text>
                            </View>
                        </View>
                        <Text style={styles.notesLabel}>Notes:</Text>
                        <Text style={styles.notes}>{patient.notes || 'No notes available.'}</Text>
                        <View style={styles.statsRow}>
                            <Text style={styles.stat}>Total Recordings: {recordings.length}</Text>
                            <Text style={styles.stat}>Last: {new Date(patient.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <Text style={styles.sectionTitle}>Consultation History</Text>
                        <Text
                            style={styles.summarizeBtn}
                            onPress={generateSummary}
                        >
                            {isGeneratingSummary ? 'Generating...' : 'Summarize All'}
                        </Text>
                    </View>

                    {/* Recordings List */}
                    {recordings.map((rec: any) => (
                        <View key={rec.id} style={styles.recordingCard}>
                            <View style={styles.recordingHeader}>
                                <View>
                                    <Text style={styles.recordingDate}>{new Date(rec.createdAt).toLocaleString()}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: rec.status === 'COMPLETED' ? colors.accentGreen : '#FFA000' }]}>
                                        <Text style={styles.statusText}>{rec.status}</Text>
                                    </View>
                                </View>
                                <View style={styles.recordingActions}>
                                    <TouchableOpacity onPress={() => openTranscript(rec.id, rec.transcript)} style={styles.actionButton}>
                                        <Ionicons name="document-text-outline" size={28} color={colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => playRecording(rec.audioUrl, rec.id)} style={styles.actionButton}>
                                        <Ionicons
                                            name={playingId === rec.id ? "stop-circle" : "play-circle"}
                                            size={40}
                                            color={colors.primary}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => deleteRecording(rec.id)} style={styles.actionButton}>
                                        <Ionicons
                                            name="trash-outline"
                                            size={28}
                                            color={colors.error}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {rec.summary && (
                                <View style={styles.summaryContainer}>
                                    <Text style={styles.summaryTitle}>Summary:</Text>
                                    <Text style={styles.summaryText}>Chief Complaint: {rec.summary.chiefComplaint}</Text>
                                    <Text style={styles.summaryText}>Diagnosis: {rec.summary.diagnosis}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>

                {isUploading && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color={colors.white} />
                        <Text style={styles.uploadingText}>Uploading & Processing...</Text>
                    </View>
                )}

                {/* Summary Modal */}
                {showSummary && summary && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Patient Summary</Text>
                            <ScrollView style={styles.modalScroll}>
                                <Text style={styles.modalSectionTitle}>Concise Overview</Text>
                                <Text style={styles.modalText}>{summary.concise}</Text>

                                <Text style={styles.modalSectionTitle}>Detailed History</Text>
                                <Text style={styles.modalText}>{summary.detailed}</Text>
                            </ScrollView>
                            <Text style={styles.closeBtn} onPress={() => setShowSummary(false)}>Close</Text>
                        </View>
                    </View>
                )}

                {/* Transcript Modal */}
                {showTranscript && selectedRecordingId && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Transcript</Text>
                                <TouchableOpacity onPress={() => setShowTranscript(false)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.languageTabs}>
                                {['English', 'Kannada', 'Hindi'].map((lang) => (
                                    <TouchableOpacity
                                        key={lang}
                                        style={[styles.tab, selectedLanguage === lang && styles.activeTab]}
                                        onPress={() => handleLanguageChange(lang)}
                                    >
                                        <Text style={[styles.tabText, selectedLanguage === lang && styles.activeTabText]}>
                                            {lang}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <ScrollView style={styles.modalScroll}>
                                {isTranslating ? (
                                    <ActivityIndicator size="large" color={colors.primary} />
                                ) : (
                                    <Text style={styles.modalText}>{transcriptText || 'No transcript available.'}</Text>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: colors.white,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: colors.primary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    patientName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    patientDetails: {
        fontSize: 14,
        color: colors.gray,
    },
    notesLabel: {
        fontWeight: '600',
        marginTop: 10,
        color: colors.text,
    },
    notes: {
        color: colors.text,
        marginBottom: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10,
    },
    stat: {
        fontSize: 12,
        color: colors.gray,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: colors.text,
    },
    recordingCard: {
        backgroundColor: colors.white,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 1,
    },
    recordingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    recordingDate: {
        fontSize: 14,
        color: colors.gray,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    summaryContainer: {
        marginTop: 5,
        padding: 10,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
    },
    summaryTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryText: {
        fontSize: 12,
        color: colors.text,
    },
    recorderContainerTop: {
        backgroundColor: colors.white,
        padding: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    micButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    recordingButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    stopButton: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingUI: {
        flex: 1,
        marginRight: 20,
    },
    timer: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.error,
    },
    slideTextContainer: {
        marginTop: 5,
    },
    slideText: {
        color: colors.gray,
    },
    hintText: {
        color: colors.gray,
        flex: 1,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    uploadingText: {
        color: colors.white,
        marginTop: 10,
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    summarizeBtn: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        zIndex: 2000,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    modalScroll: {
        marginBottom: 15,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        color: colors.text,
    },
    modalText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
        marginBottom: 10,
    },
    recordingActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionButton: {
        padding: 5,
    },
    closeBtn: {
        textAlign: 'center',
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        padding: 10,
    },
    languageTabs: {
        flexDirection: 'row',
        marginBottom: 15,
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: colors.white,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        color: colors.gray,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.primary,
    },
});
