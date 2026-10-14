import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ SQLite Database connected successfully via Prisma');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}
