const axios = require('axios');

async function testTunnel() {
    try {
        console.log('Testing tunnel URL: https://funny-melons-prove.loca.lt/api/patients');
        const response = await axios.get('https://funny-melons-prove.loca.lt/api/patients', {
            headers: { "Bypass-Tunnel-Reminder": "true" }
        });
        console.log('Success! Status:', response.status);
    } catch (error) {
        console.error('Tunnel test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testTunnel();
