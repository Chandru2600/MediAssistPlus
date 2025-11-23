import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function quickCheck() {
    const loginRes = await axios.post(`${API_URL}/auth/login-doctor`, {
        email: 'test@example.com',
        password: 'password123'
    }).catch(async () => {
        await axios.post(`${API_URL}/auth/signup-doctor`, {
            name: 'Test',
            email: 'test@example.com',
            password: 'password123'
        });
        return axios.post(`${API_URL}/auth/login-doctor`, {
            email: 'test@example.com',
            password: 'password123'
        });
    });

    const token = loginRes.data.token;
    const patients = await axios.get(`${API_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    console.log(`Found ${patients.data.length} patients\n`);

    for (const patient of patients.data.slice(0, 3)) {
        const recordings = await axios.get(`${API_URL}/recordings/patient/${patient.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`Patient: ${patient.name}`);
        console.log(`Recordings: ${recordings.data.length}`);

        if (recordings.data.length > 0) {
            const latest = recordings.data[0];
            console.log(`  Status: ${latest.status}`);
            console.log(`  Has Transcript: ${!!latest.transcript}`);
            console.log(`  Has Summary: ${!!latest.summary}`);

            if (latest.summary) {
                console.log(`  Summary Preview:`);
                console.log(`    - ${latest.summary.chiefComplaint || 'N/A'}`);
                console.log(`    - ${latest.summary.diagnosis || 'N/A'}`);
            }
        }
        console.log('');
    }
}

quickCheck();
