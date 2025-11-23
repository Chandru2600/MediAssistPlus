const axios = require('axios');

async function checkAllPatients() {
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

        console.log(`Found ${patients.length} patients:\n`);

        for (const patient of patients) {
            console.log(`\n=== Patient: ${patient.name} ===`);
            console.log(`ID: ${patient.id}`);

            // Get recordings for this patient
            const recRes = await axios.get(`http://localhost:5000/api/recordings/patient/${patient.id}`, config);
            const recordings = recRes.data;

            console.log(`Recordings: ${recordings.length}`);

            for (const rec of recordings) {
                console.log(`\n  Recording ID: ${rec.id}`);
                console.log(`  Audio URL: ${rec.audioUrl}`);
                console.log(`  Has Transcript: ${rec.transcript ? 'Yes' : 'No'}`);
                console.log(`  Status: ${rec.status}`);

                if (rec.transcript) {
                    console.log(`  Transcript preview: ${rec.transcript.substring(0, 100)}...`);
                }
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

checkAllPatients();
