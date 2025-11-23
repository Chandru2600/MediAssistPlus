import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';

// Initialize S3 client
const s3Client = new S3Client({
    region: (process.env.AWS_REGION || 'eu-north-1').trim(),
    credentials: {
        accessKeyId: (process.env.AWS_ACCESS_KEY_ID || '').trim(),
        secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mediassist-uploads-2025';

/**
 * Upload a file to S3
 * @param filePath - Local file path
 * @param key - S3 object key (filename in bucket)
 * @returns S3 URL of uploaded file
 */
export const uploadToS3 = async (filePath: string, key: string): Promise<string> => {
    try {
        console.log(`[S3] Uploading ${key} to S3...`);

        // Read file
        const fileContent = fs.readFileSync(filePath);

        // Upload to S3
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: key,
                Body: fileContent,
                ContentType: 'audio/m4a',
                // ACL: 'public-read', // Removed to avoid issues with Bucket Owner Enforced settings
            },
        });

        await upload.done();

        // Construct S3 URL
        const s3Url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${key}`;

        console.log(`[S3] Upload successful: ${s3Url}`);

        // Delete local file after successful upload
        try {
            fs.unlinkSync(filePath);
            console.log(`[S3] Deleted local file: ${filePath}`);
        } catch (err) {
            console.warn(`[S3] Could not delete local file: ${filePath}`);
        }

        return s3Url;

    } catch (error: any) {
        console.error('[S3] Upload error:', error.message);
        throw new Error(`S3 upload failed: ${error.message}`);
    }
};

/**
 * Delete a file from S3
 * @param key - S3 object key (filename in bucket)
 */
export const deleteFromS3 = async (key: string): Promise<void> => {
    try {
        console.log(`[S3] Deleting ${key} from S3...`);

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
        console.log(`[S3] Delete successful: ${key}`);

    } catch (error: any) {
        console.error('[S3] Delete error:', error.message);
        throw new Error(`S3 delete failed: ${error.message}`);
    }
};

/**
 * Extract S3 key from URL
 * @param url - S3 URL
 * @returns S3 key
 */
export const extractS3Key = (url: string): string => {
    const parts = url.split('/');
    return parts[parts.length - 1];
};

/**
 * Check if S3 is configured
 * @returns true if AWS credentials are set
 */
export const isS3Configured = (): boolean => {
    return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.S3_BUCKET_NAME
    );
};
