import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAudioUrl() {
    try {
        const recording = await prisma.recording.findFirst({
            where: {
                patient: {
                    name: "Test Patient for Translation"
                }
            }
        });

        if (recording) {
            const newUrl = "https://shaky-points-begin.loca.lt/uploads/CAR0001.mp3";
            console.log(`Updating URL from ${recording.audioUrl} to ${newUrl}`);

            await prisma.recording.update({
                where: { id: recording.id },
                data: { audioUrl: newUrl }
            });

            console.log('Update successful!');
        } else {
            console.log('Test patient recording not found.');
        }

    } catch (error) {
        console.error('Error updating audio URL:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAudioUrl();
