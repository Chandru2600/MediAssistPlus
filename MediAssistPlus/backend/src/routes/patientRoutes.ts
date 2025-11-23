import express from 'express';
import { createPatient, deletePatient, getPatientById, getPatients } from '../controllers/patientController';
import { authenticateDoctor } from '../middleware/authMiddleware';

const router = express.Router(); // Router for patient operations

router.use(authenticateDoctor);

router.post('/create', createPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.delete('/:id', deletePatient);

export default router;
