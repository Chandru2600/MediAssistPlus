import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminDoctor() {
    try {
        // Check if admin already exists
        const existingAdmin = await prisma.doctor.findUnique({
            where: { email: 'admin@mediassist.com' }
        });

        if (existingAdmin) {
            console.log('✅ Admin account already exists');
            console.log('   Email: admin@mediassist.com');
            console.log('   Password: 123');
            return;
        }

        // Create admin account
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123', salt);

        const admin = await prisma.doctor.create({
            data: {
                name: 'Admin',
                email: 'admin@mediassist.com',
                passwordHash,
                specialization: 'Administrator',
                qualification: 'Admin',
            }
        });

        console.log('✅ Admin account created successfully!');
        console.log('   Email: admin@mediassist.com');
        console.log('   Password: 123');
        console.log('   ID:', admin.id);

    } catch (error) {
        console.error('❌ Error creating admin account:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminDoctor();
