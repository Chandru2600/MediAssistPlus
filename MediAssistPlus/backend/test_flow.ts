
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testBackend() {
    try {
        console.log('1. Testing Doctor Registration...');
        const email = `test${Date.now()}@example.com`;
        const password = 'password123';

        try {
            await axios.post(`${API_URL}/auth/signup-doctor`, {
                name: 'Test Doctor',
                email,
                password,
                specialization: 'General'
            });
            console.log('✅ Registration Successful');
        } catch (e: any) {
            console.log('Full error object:', e);
            console.error('❌ Registration Failed:', e.response?.data || e.message);
            return;
        }

        console.log('\n2. Testing Doctor Login...');
        let token = '';
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login-doctor`, {
                email,
                password
            });
            token = loginRes.data.token;
            console.log('✅ Login Successful, Token received');
        } catch (e: any) {
            console.error('❌ Login Failed:', e.response?.data || e.message);
            return;
        }

        console.log('\n3. Testing Patient Creation...');
        try {
            const patientRes = await axios.post(`${API_URL}/patients/create`, {
                name: 'John Doe',
                age: 30,
                gender: 'Male',
                notes: 'Test patient'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Patient Creation Successful:', patientRes.data.id);
        } catch (e: any) {
            console.error('❌ Patient Creation Failed:', e.response?.data || e.message);
            return;
        }

        console.log('\n🎉 Backend Basic Flow Verified!');

    } catch (error) {
        console.error('Unexpected Error:', error);
    }
}

testBackend();
