import express from 'express';
import { createPatient, deletePatient, getPatientById, getPatients, updatePatient } from '../controllers/patientController';
import { authenticateDoctor } from '../middleware/authMiddleware';

const router = express.Router(); // Router for patient operations

router.use(authenticateDoctor);

router.post('/create', createPatient);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
