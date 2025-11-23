import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { summarizeConsultation, summarizePatientHistory, transcribeAudio, translateText } from '../services/ollamaService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}


export const uploadRecording = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.body;
        const doctorId = req.user.id;
        const file = req.file as any;

        if (!file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        let audioUrl: string;

        // Try to upload to S3 if configured
        try {
            const { uploadToS3, isS3Configured } = require('../services/s3.service');

            if (isS3Configured()) {
                console.log('[Upload] Using AWS S3 storage');
                // Upload to S3 and get public URL
                audioUrl = await uploadToS3(file.path, file.filename);
            } else {
                console.log('[Upload] S3 not configured, using local storage');
                // Use local storage
                audioUrl = file.filename;
            }
        } catch (s3Error) {
            console.warn('[Upload] S3 upload failed, falling back to local storage:', s3Error);
            // Fallback to local storage
            audioUrl = file.filename;
        }

        const recording = await prisma.recording.create({
            data: {
                doctorId,
                patientId,
                audioUrl,
                status: 'PENDING'
            }
        });

        res.status(201).json(recording);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading recording' });
    }
};

const processRecording = async (recordingId: string, filePath: string) => {
    try {
        console.log(`Starting processing for recording ${recordingId}`);

        // 1. Transcribe
        const transcript = await transcribeAudio(filePath);
        await prisma.recording.update({
            where: { id: recordingId },
            data: { transcript },
        });

        // 2. Summarize
        const summary = await summarizeConsultation(transcript);
        await prisma.recording.update({
            where: { id: recordingId },
            data: {
                summary,
                status: 'COMPLETED'
            },
        });

        console.log(`Processing completed for recording ${recordingId}`);
    } catch (error) {
        console.error(`Error processing recording ${recordingId}:`, error);
        await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'FAILED' },
        });
    }
};

export const getRecordings = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const recordings = await prisma.recording.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(recordings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching recordings' });
    }
};

export const deleteRecording = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;

        // Verify the recording belongs to this doctor
        const recording = await prisma.recording.findUnique({
            where: { id },
        });

        if (!recording) {
            return res.status(404).json({ error: 'Recording not found' });
        }

        if (recording.doctorId !== doctorId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Try to delete from S3 if it's an S3 URL
        if (recording.audioUrl && recording.audioUrl.includes('s3.amazonaws.com')) {
            try {
                const { deleteFromS3, extractS3Key } = require('../services/s3.service');
                const s3Key = extractS3Key(recording.audioUrl);
                await deleteFromS3(s3Key);
                console.log('[Delete] Deleted from S3:', s3Key);
            } catch (s3Error) {
                console.warn('[Delete] Failed to delete from S3:', s3Error);
                // Continue with database deletion even if S3 delete fails
            }
        }

        // Delete from database
        await prisma.recording.delete({
            where: { id },
        });

        res.json({ message: 'Recording deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting recording' });
    }
};

export const generatePatientSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;

        // Fetch all recordings for the patient
        const recordings = await prisma.recording.findMany({
            where: { patientId },
            orderBy: { createdAt: 'asc' }, // Order by date for timeline
        });
        console.log(`[generatePatientSummary] Found ${recordings.length} recordings for patient ${patientId}`);

        if (recordings.length === 0) {
            return res.status(400).json({ error: 'No recordings found for this patient' });
        }

        // Process any unprocessed recordings
        console.log('[generatePatientSummary] Checking for unprocessed recordings...');
        for (const recording of recordings) {
            if (!recording.transcript) {
                console.log(`[generatePatientSummary] Transcribing recording ${recording.id}...`);
                try {
                    const transcript = await transcribeAudio(recording.audioUrl);
                    await prisma.recording.update({
                        where: { id: recording.id },
                        data: {
                            transcript,
                            status: 'COMPLETED' // Mark as completed once transcribed (for now)
                        },
                    });
                    recording.transcript = transcript; // Update local object for summary
                } catch (err) {
                    console.error(`[generatePatientSummary] Failed to transcribe ${recording.id}`, err);
                }
            }
        }

        const summary = await summarizePatientHistory(recordings);
        res.json(summary);
    } catch (error) {
        console.error('Error generating patient summary:', error);
        res.status(500).json({ error: 'Error generating summary' });
    }
};

export const translateRecording = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { language } = req.body; // 'English', 'Kannada', 'Hindi'

        const recording = await prisma.recording.findUnique({
            where: { id },
        });

        if (!recording || !recording.transcript) {
            return res.status(404).json({ error: 'Recording or transcript not found' });
        }

        if (language === 'English') {
            return res.json({ translation: recording.transcript });
        }

        let translation: string;

        // Try Google Translate first (more accurate for Kannada/Hindi)
        try {
            const { translateWithGoogle, isGoogleTranslateConfigured } = require('../services/google-translate.service');

            if (isGoogleTranslateConfigured()) {
                console.log(`[Translation] Using Google Cloud Translation for ${language}`);
                translation = await translateWithGoogle(recording.transcript, language);
            } else {
                console.log('[Translation] Google Cloud API key not configured, using Ollama');
                translation = await translateText(recording.transcript, language);
            }
        } catch (googleError) {
            // Fallback to Ollama if Google Translate fails
            console.log(`[Translation] Google Translate failed, falling back to Ollama:`, googleError);
            translation = await translateText(recording.transcript, language);
        }

        res.json({ translation });
    } catch (error) {
        console.error('Error translating recording:', error);
        res.status(500).json({ error: 'Error translating recording' });
    }
};
