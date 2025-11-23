const axios = require('axios');

async function testLocal() {
    try {
        console.log('Testing local backend: http://localhost:5000/api/patients');
        const response = await axios.get('http://localhost:5000/api/patients');
        console.log('Success! Status:', response.status);
    } catch (error) {
        console.error('Local test failed:', error.message);
    }
}

testLocal();
