import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

export const createPatient = async (req: AuthRequest, res: Response) => {
    try {
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
    } catch (error) {
        console.error('Full error details:', error);
        res.status(500).json({ error: 'Error creating patient' });
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
