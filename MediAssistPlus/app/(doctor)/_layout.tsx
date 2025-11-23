import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function DoctorLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.primary,
                },
                headerTintColor: colors.white,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen name="index" options={{ title: 'MediAssist+', headerShown: false }} />
            <Stack.Screen name="add-patient" options={{ title: 'Add Patient' }} />
            <Stack.Screen name="patient/[id]" options={{ title: 'Patient Details' }} />
            <Stack.Screen name="patients" options={{ title: 'All Patients', headerShown: false }} />
        </Stack>
    );
}
