const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAllUrls() {
    try {
        const newBaseUrl = "http://10.236.137.43:5000/uploads";

        // Get all recordings
        const recordings = await prisma.recording.findMany();

        console.log(`Found ${recordings.length} recordings to update\n`);

        for (const rec of recordings) {
            if (rec.audioUrl) {
                // Extract filename from current URL
                const filename = rec.audioUrl.split('/').pop();
                const newUrl = `${newBaseUrl}/${filename}`;

                await prisma.recording.update({
                    where: { id: rec.id },
                    data: { audioUrl: newUrl }
                });

                console.log(`✅ Updated ${rec.id}: ${newUrl}`);
            }
        }

        console.log('\n✅ All URLs updated successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateAllUrls();
