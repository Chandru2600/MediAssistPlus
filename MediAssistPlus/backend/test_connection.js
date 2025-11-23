const axios = require('axios');

async function testConnection() {
    try {
        console.log('Testing connection to http://10.236.137.117:5000 ...');
        const response = await axios.get('http://10.236.137.117:5000/api/patients'); // Try a valid endpoint
        console.log('Success! Status:', response.status);
    } catch (error) {
        console.error('Connection failed:', error.message);
    }
}

testConnection();
