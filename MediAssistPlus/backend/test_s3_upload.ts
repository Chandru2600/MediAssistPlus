
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { deleteFromS3, isS3Configured, uploadToS3 } from './src/services/s3.service';

// Load env vars
dotenv.config();

const testS3 = async () => {
    console.log('--- Testing AWS S3 Upload (No ACL) ---');

    if (!isS3Configured()) {
        console.error('❌ S3 is NOT configured.');
        return;
    }

    // Create a dummy file
    const testFileName = `test_upload_${Date.now()}.txt`;
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, 'This is a test file for S3 upload.');

    try {
        console.log(`\nAttempting to upload ${testFileName}...`);
        const url = await uploadToS3(testFilePath, testFileName);
        console.log('✅ Upload Successful!');
        console.log('URL:', url);

        // Verify we can delete it
        console.log(`\nAttempting to delete ${testFileName}...`);
        await deleteFromS3(testFileName);
        console.log('✅ Delete Successful!');

    } catch (error: any) {
        console.error('❌ Operation Failed:', error.message);
    } finally {
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
};

testS3();
