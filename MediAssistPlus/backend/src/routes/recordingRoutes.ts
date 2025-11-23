import express from 'express';
import multer from 'multer';
import path from 'path';
import { deleteRecording, generatePatientSummary, getRecordings, translateRecording, uploadRecording } from '../controllers/recordingController';
import { authenticateDoctor } from '../middleware/authMiddleware';

const router = express.Router();

// Configure multer for local disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.use(authenticateDoctor);

router.post('/upload', upload.single('audio'), uploadRecording);
router.get('/patient/:patientId', getRecordings);
router.delete('/:id', deleteRecording);
router.post('/patient/:patientId/summary', generatePatientSummary);
router.post('/:id/translate', translateRecording);

export default router; // Export the router
