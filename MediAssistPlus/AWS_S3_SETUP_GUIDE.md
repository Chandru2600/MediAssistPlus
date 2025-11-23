# AWS S3 Setup Guide for MediAssist+

## Step 1: Create an AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up for a free account (includes 5GB free S3 storage for 12 months)

## Step 2: Create an S3 Bucket
1. Log into AWS Console
2. Search for "S3" in the services
3. Click "Create bucket"
4. **Bucket name**: `mediassist-uploads-2025` (or any unique name)
5. **Region**: Choose `ap-south-1` (Mumbai) or your preferred region
6. **Block Public Access settings**: 
   - ✅ Keep "Block all public access" CHECKED (for security)
   - We'll use signed URLs instead of public access
7. Click "Create bucket"

## Step 3: Create IAM User with S3 Access
1. Go to IAM service in AWS Console
2. Click "Users" → "Add users"
3. **User name**: `mediassist-s3-user`
4. Click "Next"
5. **Permissions**: Select "Attach policies directly"
6. Search and select: `AmazonS3FullAccess`
7. Click "Next" → "Create user"

## Step 4: Generate Access Keys
1. Click on the newly created user
2. Go to "Security credentials" tab
3. Scroll to "Access keys" section
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next" → "Create access key"
7. **IMPORTANT**: Copy both:
   - Access key ID (starts with `AKIA...`)
   - Secret access key (long random string)
   - Save these securely - you won't see the secret again!

## Step 5: Update Your .env File
Open `backend/.env` and update these lines:

```env
# AWS S3 Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA... (paste your access key here)
AWS_SECRET_ACCESS_KEY=... (paste your secret key here)
S3_BUCKET_NAME=mediassist-uploads-2025
```

**IMPORTANT**: 
- No quotes around the values
- No spaces before or after the `=`
- No trailing spaces

## Step 6: Test the Connection
Run this command from the `backend` folder:
```bash
npx ts-node test_s3_upload.ts
```

You should see:
```
✅ Upload Successful!
✅ Delete Successful!
```

## Troubleshooting

### Error: "The bucket does not allow ACLs"
Your bucket has "Bucket owner enforced" setting. This is already fixed in the code.

### Error: "Access Denied"
- Check that your IAM user has `AmazonS3FullAccess` policy
- Verify the bucket name matches exactly

### Error: "Invalid Access Key"
- Copy the keys again carefully
- Make sure there are no extra spaces in `.env`
- The Access Key should be exactly 20 characters
- The Secret Key should be exactly 40 characters

## Cost Information
- **Free Tier**: 5GB storage, 20,000 GET requests, 2,000 PUT requests per month for 12 months
- **After Free Tier**: ~$0.023 per GB per month
- **Typical Usage**: For a small clinic with 100 recordings/month (~500MB), cost is less than $1/month

## Security Best Practices
1. Never commit `.env` file to Git (it's already in `.gitignore`)
2. Rotate access keys every 90 days
3. Use bucket policies to restrict access if needed
4. Enable bucket versioning for backup

## Fallback Behavior
If S3 upload fails for any reason, your app automatically saves recordings to the local server (`backend/uploads` folder). Your app will continue to work normally.
