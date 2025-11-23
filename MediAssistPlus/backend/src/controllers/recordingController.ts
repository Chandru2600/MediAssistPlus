import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { summarizeConsultation, summarizePatientHistory, transcribeAudio, translateText } from '../services/ollamaService';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}


export const uploadRecording = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId, language } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
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

        // Start processing in background
        // Default to 'en-US' if no language provided
        const languageCode = language || 'en-US';
        processRecording(recording.id, file.path, languageCode).catch(err =>
            console.error(`Background processing failed for ${recording.id}:`, err)
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading recording' });
    }
};

const processRecording = async (recordingId: string, filePath: string, languageCode: string = 'en-US') => {
    try {
        console.log(`Starting processing for recording ${recordingId} in language ${languageCode}`);

        // 1. Transcribe
        const transcript = await transcribeAudio(filePath, languageCode);
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
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
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

const getPatientSummaryInternal = async (patientId: string) => {
    // Fetch all recordings for the patient
    const recordings = await prisma.recording.findMany({
        where: { patientId },
        orderBy: { createdAt: 'asc' }, // Order by date for timeline
    });
    console.log(`[getPatientSummary] Found ${recordings.length} recordings for patient ${patientId}`);

    if (recordings.length === 0) {
        throw new Error('No recordings found for this patient');
    }

    // Process any unprocessed recordings
    console.log('[getPatientSummary] Checking for unprocessed recordings...');
    for (const recording of recordings) {
        if (!recording.transcript) {
            console.log(`[getPatientSummary] Transcribing recording ${recording.id}...`);
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
                console.error(`[getPatientSummary] Failed to transcribe ${recording.id}`, err);
            }
        }
    }

    return await summarizePatientHistory(recordings);
};

export const generatePatientSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { patientId } = req.params;
        const summary = await getPatientSummaryInternal(patientId);
        res.json(summary);
    } catch (error: any) {
        console.error('Error generating patient summary:', error);
        res.status(500).json({ error: error.message || 'Error generating summary' });
    }
};

export const translatePatientSummary = async (req: AuthRequest, res: Response) => {
    console.log(`[Summary Translation] START request for patient ${req.params.patientId} to ${req.body.language}`);
    try {
        const { patientId } = req.params;
        const { language } = req.body;

        // 1. Get the English summary first
        console.log(`[Summary Translation] Fetching English summary...`);
        const summary = await getPatientSummaryInternal(patientId);
        console.log(`[Summary Translation] English summary retrieved.`);

        if (language === 'English') {
            console.log(`[Summary Translation] Language is English, returning original.`);
            return res.json(summary);
        }

        // 2. Translate fields
        let translatedConcise = summary.concise;
        let translatedDetailed = summary.detailed;

        try {
            console.log(`[Summary Translation] Translating concise section...`);
            translatedConcise = await translateText(summary.concise, language);
            console.log(`[Summary Translation] Concise translated.`);

            console.log(`[Summary Translation] Translating detailed section...`);
            translatedDetailed = await translateText(summary.detailed, language);
            console.log(`[Summary Translation] Detailed translated.`);

        } catch (error: any) {
            console.error('[Summary Translation] Translation step failed:', error.message);
            if (error.code === 'ECONNABORTED') {
                console.error('[Summary Translation] Request timed out');
            }
            return res.status(500).json({ error: 'Translation failed' });
        }

        console.log(`[Summary Translation] sending response.`);
        res.json({
            concise: translatedConcise,
            detailed: translatedDetailed
        });

    } catch (error: any) {
        console.error('[Summary Translation] CRITICAL ERROR:', error);
        res.status(500).json({ error: error.message || 'Error translating summary' });
    }
};

export const translateRecording = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { language } = req.body; // 'English', 'Kannada', 'Hindi'

        console.log(`[Translation] Request for recording ${id} to ${language}`);

        const recording = await prisma.recording.findUnique({
            where: { id },
        });

        // If transcript is missing OR (English and force=true), we need to transcribe
        if (!recording.transcript || (language === 'English' && req.body.force)) {
            console.log(`[Translation] Transcript missing or forced re-transcription for recording ${id}`);
            try {
                // Resolve file path
                let filePath = recording.audioUrl;
                if (!filePath.startsWith('http')) {
                    const path = require('path');
                    filePath = path.join(__dirname, '../../uploads', recording.audioUrl);
                }

                // Use the requested language for transcription if it's a new transcription
                // If we are just re-transcribing, we might want to use the original language?
                // But here we assume the user might be correcting the language.
                // However, transcribeAudio takes 'languageCode'.
                // If the user selected 'Kannada' for translation, they probably spoke Kannada?
                // Or they spoke English and want Kannada translation?
                // Usually 'translate' implies source is one thing, target is another.
                // But if transcript is missing, we need to generate it first.
                // Let's assume the recording language matches the target language if we are generating it now?
                // No, that's risky. Let's default to 'en-US' for transcription unless we know otherwise.
                // But wait, we don't store the recording language in DB yet (we just added it to upload).
                // If we have it in DB (we don't), we'd use it.
                // For now, let's use 'en-US' for transcription, then translate.

                const newTranscript = await transcribeAudio(filePath, 'en-US');

                // Update DB
                await prisma.recording.update({
                    where: { id },
                    data: { transcript: newTranscript }
                });

                // If the target was English, return the new transcript
                if (language === 'English') {
                    return res.json({ translation: newTranscript });
                }

                // If target is not English, we continue to translation logic below
                recording.transcript = newTranscript;

            } catch (error) {
                console.error('[Translation] Transcription failed:', error);
                return res.status(500).json({ error: 'Failed to generate transcript' });
            }
        } else if (language === 'English' && !req.body.force) {
            return res.json({ translation: recording.transcript });
        }

        let translation: string;

        // Try Google Translate first (more accurate for Kannada/Hindi)
        try {
            const { translateWithGoogle, isGoogleTranslateConfigured } = require('../services/google-translate.service');

            if (isGoogleTranslateConfigured()) {
                console.log(`[Translation] Using Google Cloud Translation for ${language}`);
                translation = await translateWithGoogle(recording.transcript, language);
                console.log(`[Translation] Google Translation successful`);
            } else {
                console.log('[Translation] Google Cloud API key not configured, using Ollama');
                translation = await translateText(recording.transcript, language);
            }
        } catch (googleError: any) {
            // Fallback to Ollama if Google Translate fails
            console.error(`[Translation] Google Translate failed:`, googleError.message || googleError);
            console.log(`[Translation] Falling back to Ollama`);
            try {
                translation = await translateText(recording.transcript, language);
                console.log(`[Translation] Ollama translation successful`);
            } catch (ollamaError: any) {
                console.error(`[Translation] Ollama also failed:`, ollamaError.message || ollamaError);
                throw new Error(`Both Google and Ollama translation failed`);
            }
        }

        res.json({ translation });
    } catch (error: any) {
        console.error('[Translation] Final error:', error.message || error);
        res.status(500).json({ error: 'Error translating recording', details: error.message });
    }
};
