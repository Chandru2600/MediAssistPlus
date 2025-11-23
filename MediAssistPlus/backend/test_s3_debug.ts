
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load from backend/.env
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
}

console.log('--- S3 Debug Info ---');
console.log('Env Path:', envPath);
console.log('AWS_REGION:', process.env.AWS_REGION ? `"${process.env.AWS_REGION}"` : 'UNDEFINED');
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME ? `"${process.env.S3_BUCKET_NAME}"` : 'UNDEFINED');

const keyId = process.env.AWS_ACCESS_KEY_ID;
console.log('AWS_ACCESS_KEY_ID:', keyId ? `Length: ${keyId.length}, Starts: ${keyId.substring(0, 4)}..., Ends: ...${keyId.substring(keyId.length - 4)}` : 'UNDEFINED');

const secret = process.env.AWS_SECRET_ACCESS_KEY;
console.log('AWS_SECRET_ACCESS_KEY:', secret ? `Length: ${secret.length}, Starts: ${secret.substring(0, 4)}..., Ends: ...${secret.substring(secret.length - 4)}` : 'UNDEFINED');

// Check for common issues
if (keyId && keyId.includes(' ')) console.warn('WARNING: AWS_ACCESS_KEY_ID contains spaces!');
if (secret && secret.includes(' ')) console.warn('WARNING: AWS_SECRET_ACCESS_KEY contains spaces!');
if (keyId === 'your_access_key_id') console.warn('WARNING: Using default placeholder for Access Key!');
