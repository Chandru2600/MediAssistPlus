import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTranscript() {
    try {
        // Update all recordings
        const updated = await prisma.recording.updateMany({
            data: {
                transcript: "Patient complains of severe headache and nausea since yesterday. BP is 140/90. Recommended rest and hydration."
            }
        });

        console.log(`Updated ${updated.count} recordings with transcript.`);

    } catch (error) {
        console.error('Error seeding transcript:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTranscript();
