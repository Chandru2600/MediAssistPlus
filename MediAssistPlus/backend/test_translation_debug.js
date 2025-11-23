const axios = require('axios');

async function testTranslation() {
    try {
        // Login first
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login-doctor', {
            email: 'admin@mediassist.com',
            password: '123'
        });
        const token = loginRes.data.token;
        console.log('Logged in successfully.\n');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // Get patients
        const patientsRes = await axios.get('http://localhost:5000/api/patients', config);
        const patients = patientsRes.data;

        // Find a patient with recordings
        let recordingId = null;
        for (const patient of patients) {
            const recRes = await axios.get(`http://localhost:5000/api/recordings/patient/${patient.id}`, config);
            if (recRes.data.length > 0 && recRes.data[0].transcript) {
                recordingId = recRes.data[0].id;
                console.log('Found recording with transcript:', recordingId);
                console.log('Transcript preview:', recRes.data[0].transcript.substring(0, 100) + '...\n');
                break;
            }
        }

        if (!recordingId) {
            console.log('No recordings with transcripts found.');
            return;
        }

        // Test Hindi translation
        console.log('Testing Hindi translation...');
        const hindiRes = await axios.post(
            `http://localhost:5000/api/recordings/${recordingId}/translate`,
            { language: 'Hindi' },
            config
        );
        console.log('Hindi translation result:', hindiRes.data.translation.substring(0, 200) + '...\n');

        // Test Kannada translation
        console.log('Testing Kannada translation...');
        const kannadaRes = await axios.post(
            `http://localhost:5000/api/recordings/${recordingId}/translate`,
            { language: 'Kannada' },
            config
        );
        console.log('Kannada translation result:', kannadaRes.data.translation.substring(0, 200) + '...\n');

        console.log('✅ All translations successful!');

    } catch (error) {
        console.error('❌ Translation test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testTranslation();
