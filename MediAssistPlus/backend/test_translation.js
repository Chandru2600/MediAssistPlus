const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testTranslation() {
    try {
        // 0. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login-doctor`, {
            email: 'admin@mediassist.com',
            password: '123'
        });
        const token = loginRes.data.token;
        console.log('Logged in. Token received.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 1. Get a patient (to get a recording)
        console.log('Fetching patients...');
        const patientsRes = await axios.get(`${API_URL}/patients`, config);
        const patients = patientsRes.data;

        if (patients.length === 0) {
            console.log('No patients found. Cannot test.');
            return;
        }

        let patientId = null;
        let recording = null;

        // Find a patient with recordings
        for (const p of patients) {
            console.log(`Checking patient: ${p.id}`);
            const recRes = await axios.get(`${API_URL}/recordings/patient/${p.id}`, config);
            if (recRes.data.length > 0) {
                patientId = p.id;
                recording = recRes.data[0];
                console.log(`Found patient with recordings: ${patientId}`);
                break;
            }
        }

        if (!patientId || !recording) {
            console.log('No recordings found for ANY patient. Cannot test.');
            return;
        }

        console.log(`Using recording: ${recording.id}`);
        console.log(`Original Transcript: ${recording.transcript}`);

        if (!recording.transcript) {
            console.log('Recording has no transcript. Cannot test translation.');
            return;
        }

        // 3. Test Translation
        console.log('Testing translation to Kannada...');
        const translateRes = await axios.post(`${API_URL}/recordings/${recording.id}/translate`, {
            language: 'Kannada'
        }, config);

        console.log('Translation Result:', translateRes.data);

    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
        }
    }
}

testTranslation();
