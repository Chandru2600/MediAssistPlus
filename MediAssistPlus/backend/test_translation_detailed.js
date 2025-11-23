const axios = require('axios');

async function testTranslationDetailed() {
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
                console.log('Found recording:', recordingId);
                console.log('Transcript:', recRes.data[0].transcript);
                break;
            }
        }

        if (!recordingId) {
            console.log('No recordings with transcripts found.');
            return;
        }

        // Test Hindi translation with detailed logging
        console.log('\n=== Testing Hindi Translation ===');
        try {
            const hindiRes = await axios.post(
                `http://localhost:5000/api/recordings/${recordingId}/translate`,
                { language: 'Hindi' },
                config
            );
            console.log('✅ Hindi translation successful!');
            console.log('Result:', hindiRes.data.translation);
        } catch (error) {
            console.error('❌ Hindi translation failed');
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testTranslationDetailed();
