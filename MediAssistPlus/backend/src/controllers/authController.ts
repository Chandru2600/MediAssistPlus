import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const signupDoctor = async (req: Request, res: Response) => {
    try {
        const { name, email, password, qualification, specialization, college, experienceYears } = req.body;

        console.log('Signup attempt:', { email, name });
        const existingDoctor = await prisma.doctor.findUnique({ where: { email } });
        if (existingDoctor) {
            console.log('Email already in use:', email);
            return res.status(400).json({ error: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const doctor = await prisma.doctor.create({
            data: {
                name,
                email,
                passwordHash,
                qualification,
                specialization,
                college,
                experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
            },
        });

        const token = jwt.sign({ id: doctor.id, email: doctor.email }, process.env.JWT_SECRET as string, {
            expiresIn: '7d',
        });

        res.status(201).json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during signup' });
    }
};

export const loginDoctor = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const doctor = await prisma.doctor.findUnique({ where: { email } });
        if (!doctor) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, doctor.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: doctor.id, email: doctor.email }, process.env.JWT_SECRET as string, {
            expiresIn: '7d',
        });

        res.json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
};
