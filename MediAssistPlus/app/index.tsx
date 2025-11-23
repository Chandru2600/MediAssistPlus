import { ActivityIndicator, View } from 'react-native';
import { colors } from '../src/theme/colors';

export default function Index() {
    console.log('Rendering Index Screen');
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
            <ActivityIndicator size="large" color={colors.white} />
        </View>
    );
}
