const axios = require('axios');

async function checkAbcPatient() {
    try {
        // Login
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

        // Get all patients
        const patientsRes = await axios.get('http://localhost:5000/api/patients', config);
        const patients = patientsRes.data;

        // Find abc patient
        const abcPatient = patients.find(p => p.name.toLowerCase().includes('abc'));

        if (!abcPatient) {
            console.log('❌ ABC patient not found');
            return;
        }

        console.log(`✅ Found patient: ${abcPatient.name}`);
        console.log(`   ID: ${abcPatient.id}\n`);

        // Get recordings
        const recRes = await axios.get(`http://localhost:5000/api/recordings/patient/${abcPatient.id}`, config);
        const recordings = recRes.data;

        console.log(`📼 Recordings: ${recordings.length}\n`);

        if (recordings.length === 0) {
            console.log('⚠️  No recordings found. Please record audio in the app first.');
            return;
        }

        for (const rec of recordings) {
            console.log(`Recording ID: ${rec.id}`);
            console.log(`Audio URL: ${rec.audioUrl}`);
            console.log(`Has Transcript: ${rec.transcript ? '✅ Yes' : '❌ No'}`);
            console.log(`Status: ${rec.status}`);

            if (rec.transcript) {
                console.log(`Transcript: ${rec.transcript.substring(0, 150)}...\n`);
            } else {
                console.log('⚠️  No transcript yet. Click "Summarize All" in the app to generate it.\n');
            }
        }

    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

checkAbcPatient();
