const axios = require('axios');

async function testTunnelTranslation() {
    try {
        // Test 1: Login through tunnel
        console.log('=== Test 1: Login through tunnel ===');
        const loginRes = await axios.post('https://forty-toys-give.loca.lt/api/auth/login-doctor', {
            email: 'admin@mediassist.com',
            password: '123'
        }, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' },
            timeout: 10000
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful!');
        console.log('');

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Bypass-Tunnel-Reminder': 'true'
            },
            timeout: 60000 // 60 second timeout for translation
        };

        // Test 2: Get a recording with transcript
        console.log('=== Test 2: Finding recording with transcript ===');
        const patientsRes = await axios.get('https://forty-toys-give.loca.lt/api/patients', config);
        const patients = patientsRes.data;

        let recordingId = null;
        for (const patient of patients) {
            const recRes = await axios.get(`https://forty-toys-give.loca.lt/api/recordings/patient/${patient.id}`, config);
            if (recRes.data.length > 0 && recRes.data[0].transcript) {
                recordingId = recRes.data[0].id;
                console.log(`✅ Found recording: ${recordingId}`);
                console.log(`   Transcript: ${recRes.data[0].transcript.substring(0, 100)}...`);
                break;
            }
        }

        if (!recordingId) {
            console.log('❌ No recordings with transcripts found');
            return;
        }
        console.log('');

        // Test 3: Test Hindi translation
        console.log('=== Test 3: Testing Hindi translation (this may take 30-60 seconds) ===');
        const hindiRes = await axios.post(
            `https://forty-toys-give.loca.lt/api/recordings/${recordingId}/translate`,
            { language: 'Hindi' },
            config
        );
        console.log('✅ Hindi translation successful!');
        console.log('   Result:', hindiRes.data.translation.substring(0, 150) + '...');
        console.log('');

        // Test 4: Test Kannada translation
        console.log('=== Test 4: Testing Kannada translation (this may take 30-60 seconds) ===');
        const kannadaRes = await axios.post(
            `https://forty-toys-give.loca.lt/api/recordings/${recordingId}/translate`,
            { language: 'Kannada' },
            config
        );
        console.log('✅ Kannada translation successful!');
        console.log('   Result:', kannadaRes.data.translation.substring(0, 150) + '...');
        console.log('');

        console.log('🎉 All tests passed! Translation is working through the tunnel.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        if (error.code) {
            console.error('   Error code:', error.code);
        }
    }
}

testTunnelTranslation();
