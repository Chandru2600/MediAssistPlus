import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

export const createPatient = async (req: AuthRequest, res: Response) => {
    try {
        console.log('[createPatient] Request body:', req.body);
        const { name, age, gender, notes } = req.body;
        const doctorId = req.user.id;

        const patient = await prisma.patient.create({
            data: {
                name,
                age: age ? parseInt(age) : undefined,
                gender,
                notes,
                doctorId,
            },
        });

        res.status(201).json(patient);
    } catch (error: any) {
        console.error('Full error details:', error);
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../../server_errors.log');
        const logMessage = `[${new Date().toISOString()}] Error creating patient: ${error.message}\nStack: ${error.stack}\n\n`;
        fs.appendFileSync(logPath, logMessage);

        res.status(500).json({ error: 'Error creating patient', details: error.message });
    }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, age, gender, notes } = req.body;
        const doctorId = req.user.id;

        // Verify patient belongs to doctor
        const existingPatient = await prisma.patient.findUnique({
            where: { id },
        });

        if (!existingPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        if (existingPatient.doctorId !== doctorId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updatedPatient = await prisma.patient.update({
            where: { id },
            data: {
                name,
                age: age ? parseInt(age) : undefined,
                gender,
                notes,
            },
        });

        res.json(updatedPatient);
    } catch (error: any) {
        console.error('Error updating patient:', error);
        res.status(500).json({ error: 'Error updating patient', details: error.message });
    }
};

export const getPatients = async (req: AuthRequest, res: Response) => {
    try {
        const doctorId = req.user.id;
        const patients = await prisma.patient.findMany({
            where: { doctorId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(patients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching patients' });
    }
};

export const getPatientById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;

        const patient = await prisma.patient.findFirst({
            where: { id, doctorId },
            include: { recordings: { orderBy: { createdAt: 'desc' } } },
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching patient' });
    }
};

export const deletePatient = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const doctorId = req.user.id;

        // Verify patient belongs to doctor
        const patient = await prisma.patient.findUnique({
            where: { id },
        });

        if (!patient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        if (patient.doctorId !== doctorId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Delete all recordings for this patient first
        await prisma.recording.deleteMany({
            where: { patientId: id },
        });

        // Delete the patient
        await prisma.patient.delete({
            where: { id },
        });

        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ error: 'Error deleting patient' });
    }
};
