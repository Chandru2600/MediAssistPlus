import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

async function testRecordingFlow() {
    try {
        // Step 1: Register and Login
        console.log('1. Setting up test doctor and patient...');
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';

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
        const token = loginRes.data.token;
        console.log('✅ Doctor authenticated');

        // Step 2: Create a patient
        const patientRes = await axios.post(`${API_URL}/patients/create`, {
            name: 'John Doe',
            age: 30,
            gender: 'Male',
            notes: 'Test patient for recording'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const patientId = patientRes.data.id;
        console.log('✅ Patient created:', patientId);

        // Step 3: Create a dummy audio file (WAV format)
        console.log('\n2. Creating test audio file...');
        const audioDir = path.join(__dirname, 'test_audio');
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir);
        }

        // Create a minimal WAV file (just header, no actual audio data for testing)
        const wavHeader = Buffer.from([
            0x52, 0x49, 0x46, 0x46, // "RIFF"
            0x24, 0x00, 0x00, 0x00, // File size - 8
            0x57, 0x41, 0x56, 0x45, // "WAVE"
            0x66, 0x6D, 0x74, 0x20, // "fmt "
            0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16 for PCM)
            0x01, 0x00,             // AudioFormat (1 for PCM)
            0x01, 0x00,             // NumChannels (1 = mono)
            0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
            0x88, 0x58, 0x01, 0x00, // ByteRate
            0x02, 0x00,             // BlockAlign
            0x10, 0x00,             // BitsPerSample (16)
            0x64, 0x61, 0x74, 0x61, // "data"
            0x00, 0x00, 0x00, 0x00  // Subchunk2Size (0 for empty)
        ]);

        const audioPath = path.join(audioDir, 'test_recording.wav');
        fs.writeFileSync(audioPath, wavHeader);
        console.log('✅ Test audio file created');

        // Step 4: Upload recording
        console.log('\n3. Uploading recording...');
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioPath));
        formData.append('patientId', patientId);

        try {
            const uploadRes = await axios.post(`${API_URL}/recordings/upload`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('✅ Recording uploaded:', uploadRes.data.id);
            console.log('   Status:', uploadRes.data.status);

            // Step 5: Check if Ollama is accessible
            console.log('\n4. Checking Ollama connection...');
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
            try {
                const ollamaRes = await axios.get(`${ollamaUrl}/api/tags`);
                console.log('✅ Ollama is accessible');
                console.log('   Available models:', ollamaRes.data.models?.map((m: any) => m.name).join(', ') || 'None');
            } catch (ollamaError: any) {
                console.log('⚠️  Ollama not accessible:', ollamaError.message);
                console.log('   Recording will remain in PROCESSING status until Ollama is available');
            }

            // Step 6: Wait and check recording status
            console.log('\n5. Waiting for processing (5 seconds)...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            const recordingsRes = await axios.get(`${API_URL}/recordings/patient/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('\n📊 Final Recording Status:');
            recordingsRes.data.forEach((rec: any) => {
                console.log(`   ID: ${rec.id}`);
                console.log(`   Status: ${rec.status}`);
                console.log(`   Transcript: ${rec.transcript || 'N/A'}`);
                console.log(`   Summary: ${rec.summary ? JSON.stringify(rec.summary, null, 2) : 'N/A'}`);
            });

        } catch (uploadError: any) {
            console.error('❌ Upload failed:', uploadError.response?.data || uploadError.message);
        }

        console.log('\n🎉 Recording flow test completed!');

    } catch (error: any) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testRecordingFlow();
