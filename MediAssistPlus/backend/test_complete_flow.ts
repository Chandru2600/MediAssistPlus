import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

async function testCompleteFlow() {
    try {
        console.log('🚀 Testing Complete Recording Flow with Llama3\n');

        // Step 1: Create doctor account
        console.log('1️⃣  Creating doctor account...');
        const email = `doctor${Date.now()}@test.com`;
        const password = 'password123';

        await axios.post(`${API_URL}/auth/signup-doctor`, {
            name: 'Dr. Test',
            email,
            password,
            specialization: 'General Medicine'
        });

        const loginRes = await axios.post(`${API_URL}/auth/login-doctor`, {
            email,
            password
        });
        const token = loginRes.data.token;
        console.log('   ✅ Doctor authenticated\n');

        // Step 2: Create patient
        console.log('2️⃣  Creating patient...');
        const patientRes = await axios.post(`${API_URL}/patients/create`, {
            name: 'John Doe',
            age: 45,
            gender: 'Male',
            notes: 'Patient with headache complaints'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const patientId = patientRes.data.id;
        console.log(`   ✅ Patient created: ${patientRes.data.name}\n`);

        // Step 3: Create test audio file
        console.log('3️⃣  Creating test audio file...');
        const audioDir = path.join(__dirname, 'test_audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir);
        }

        const wavHeader = Buffer.from([
            0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
            0x57, 0x41, 0x56, 0x45, 0x66, 0x6D, 0x74, 0x20,
            0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
            0x44, 0xAC, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00,
            0x02, 0x00, 0x10, 0x00, 0x64, 0x61, 0x74, 0x61,
            0x00, 0x00, 0x00, 0x00
        ]);

        const audioPath = path.join(audioDir, 'consultation.wav');
        fs.writeFileSync(audioPath, wavHeader);
        console.log('   ✅ Audio file ready\n');

        // Step 4: Upload recording
        console.log('4️⃣  Uploading recording...');
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioPath));
        formData.append('patientId', patientId);

        const uploadRes = await axios.post(`${API_URL}/recordings/upload`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`   ✅ Recording uploaded: ${uploadRes.data.id}`);
        console.log(`   📊 Initial status: ${uploadRes.data.status}\n`);

        // Step 5: Wait for AI processing
        console.log('5️⃣  Waiting for AI processing (10 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Step 6: Check final status
        console.log('\n6️⃣  Fetching processed recording...');
        const recordingsRes = await axios.get(`${API_URL}/recordings/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const recording = recordingsRes.data[0];
        console.log('\n' + '='.repeat(80));
        console.log('📄 RECORDING RESULTS');
        console.log('='.repeat(80));
        console.log(`\nStatus: ${recording.status}`);
        console.log(`\n📝 Transcript:\n${recording.transcript || 'N/A'}`);
        console.log(`\n🏥 AI Summary:`);

        if (recording.summary) {
            console.log(`   Chief Complaint: ${recording.summary.chiefComplaint}`);
            console.log(`   History: ${recording.summary.history}`);
            console.log(`   Diagnosis: ${recording.summary.diagnosis}`);
            console.log(`   Medication: ${recording.summary.medication}`);
            console.log(`   Follow-up: ${recording.summary.followUp}`);
        } else {
            console.log('   No summary generated yet');
        }

        console.log('\n' + '='.repeat(80));
        console.log('\n✅ Test completed successfully!');

    } catch (error: any) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testCompleteFlow();
