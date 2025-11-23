import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAudioUrl() {
    try {
        const recording = await prisma.recording.findFirst({
            where: {
                patient: {
                    name: "Test Patient for Translation"
                }
            },
            include: { patient: true }
        });

        if (recording) {
            console.log(`Patient: ${recording.patient.name}`);
            console.log(`Recording ID: ${recording.id}`);
            console.log(`Audio URL: ${recording.audioUrl}`);
        } else {
            console.log('Test patient recording not found.');
        }

    } catch (error) {
        console.error('Error checking audio URL:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAudioUrl();
