import dotenv from 'dotenv';

// Load .env
dotenv.config();

console.log('=== AWS Credentials Check ===\n');

const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;

console.log('AWS_REGION:', region || '❌ NOT SET');
console.log('S3_BUCKET_NAME:', bucket || '❌ NOT SET');
console.log('AWS_ACCESS_KEY_ID:', accessKey ? `✅ Set (${accessKey.length} chars, starts with "${accessKey.substring(0, 4)}")` : '❌ NOT SET OR EMPTY');
console.log('AWS_SECRET_ACCESS_KEY:', secretKey ? `✅ Set (${secretKey.length} chars)` : '❌ NOT SET OR EMPTY');

console.log('\n=== Diagnosis ===');

if (!accessKey || accessKey.trim() === '' || accessKey === 'your_access_key_id') {
    console.log('❌ PROBLEM: AWS_ACCESS_KEY_ID is not properly set!');
    console.log('\nYou need to:');
    console.log('1. Go to AWS Console → IAM → Users');
    console.log('2. Create a user with S3 access');
    console.log('3. Generate access keys');
    console.log('4. Copy the Access Key ID (starts with AKIA)');
    console.log('5. Update backend/.env file with the real key');
    console.log('\nExample:');
    console.log('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');
    console.log('(Replace with your actual key from AWS)');
} else if (!secretKey || secretKey.trim() === '' || secretKey === 'your_secret_access_key') {
    console.log('❌ PROBLEM: AWS_SECRET_ACCESS_KEY is not properly set!');
    console.log('\nUpdate backend/.env with your actual secret key from AWS');
} else {
    console.log('✅ Credentials appear to be set correctly');
    console.log('If upload still fails, the credentials might be invalid or expired');
}
