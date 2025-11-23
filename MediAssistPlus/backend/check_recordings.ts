import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function checkRecordings() {
    try {
        // Login with a test account
        const email = 'test@example.com';
        const password = 'password123';

        // Try to login (if account doesn't exist, create it)
        let token = '';
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login-doctor`, {
                email,
                password
            });
            token = loginRes.data.token;
        } catch {
            // Create account if login fails
            await axios.post(`${API_URL}/auth/signup-doctor`, {
                name: 'Test Doctor',
                email,
                password,
                specialization: 'General'
            });
            const loginRes = await axios.post(`${API_URL}/auth/login-doctor`, {
                email,
                password
            });
            token = loginRes.data.token;
        }

        // Get all patients
        const patientsRes = await axios.get(`${API_URL}/patients`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('\n📋 All Patients:');
        for (const patient of patientsRes.data) {
            console.log(`\n  Patient: ${patient.name} (${patient.id})`);

            // Get recordings for this patient
            const recordingsRes = await axios.get(`${API_URL}/recordings/patient/${patient.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (recordingsRes.data.length === 0) {
                console.log('    No recordings');
            } else {
                recordingsRes.data.forEach((rec: any, idx: number) => {
                    console.log(`\n    Recording ${idx + 1}:`);
                    console.log(`      ID: ${rec.id}`);
                    console.log(`      Status: ${rec.status}`);
                    console.log(`      Created: ${new Date(rec.createdAt).toLocaleString()}`);

                    if (rec.transcript) {
                        console.log(`      Transcript: ${rec.transcript.substring(0, 100)}...`);
                    }

                    if (rec.summary) {
                        console.log(`      Summary:`);
                        console.log(`        Chief Complaint: ${rec.summary.chiefComplaint || 'N/A'}`);
                        console.log(`        Diagnosis: ${rec.summary.diagnosis || 'N/A'}`);
                        console.log(`        Medication: ${rec.summary.medication || 'N/A'}`);
                        console.log(`        Follow-up: ${rec.summary.followUp || 'N/A'}`);
                    }
                });
            }
        }

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

checkRecordings();
