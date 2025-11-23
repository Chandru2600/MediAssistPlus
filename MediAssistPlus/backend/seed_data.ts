import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
    try {
        // 1. Find Admin Doctor
        const doctor = await prisma.doctor.findUnique({
            where: { email: 'admin@mediassist.com' }
        });

        if (!doctor) {
            console.log('Admin doctor not found. Run create_admin.ts first.');
            return;
        }

        console.log(`Found Doctor: ${doctor.id}`);

        // 2. Create a Patient
        const patient = await prisma.patient.create({
            data: {
                name: "Test Patient for Translation",
                age: 30,
                gender: "Male",
                notes: "Created for testing translation",
                doctorId: doctor.id
            }
        });

        console.log(`Created Patient: ${patient.id}`);

        // 3. Create a Recording
        const recording = await prisma.recording.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                audioUrl: "http://localhost:5000/uploads/CAR0001.mp3",
                transcript: "Patient complains of severe headache and nausea since yesterday. BP is 140/90. Recommended rest and hydration."
            }
        });

        console.log(`Created Recording: ${recording.id}`);

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedData();
