import { PrismaClient } from '@prisma/client'
import databaseConfig from '@/config/database'
import createFallbackClient from './prisma-fallback'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

const prismaClientSingleton = () => {
  try {
    // Determine which log levels to use based on config
    const logLevels = ['error'];
    if (databaseConfig.logging.logQueries) logLevels.push('query');
    if (databaseConfig.logging.logSlowQueries) logLevels.push('info');
    if (process.env.NODE_ENV === 'development') logLevels.push('warn');

    return new PrismaClient({
      log: logLevels,
      // Use standard connection without additional datasource configuration
      // This ensures compatibility with the database URL format
    })
  } catch (error) {
    console.error('Failed to initialize Prisma client with standard configuration:', error);
    console.warn('Falling back to minimal Prisma client configuration');
    
    // Use fallback client if standard initialization fails
    return createFallbackClient();
  }
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Create a new PrismaClient instance or reuse the existing one
let prisma: ReturnType<typeof prismaClientSingleton>;

try {
  prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
  
  // Note: 'beforeExit' hook is not applicable to the library engine since Prisma 5.0.0
  // Instead, we'll handle disconnection through process events
  if (process.env.NODE_ENV !== 'production') {
    process.on('beforeExit', async () => {
      console.log('Disconnecting Prisma Client...')
      await prisma.$disconnect()
    })
  }

  // Log slow queries if enabled
  if (databaseConfig.logging.logSlowQueries) {
    prisma.$on('query', (e) => {
      if (e.duration >= databaseConfig.logging.slowQueryThreshold) {
        console.warn(`Slow query detected (${e.duration}ms): ${e.query}`)
      }
    })
  }

  // Log all errors
  prisma.$on('error', (e) => {
    console.error('Prisma Client error:', e)
  })
} catch (error) {
  console.error('Failed to initialize Prisma client:', error);
  // Last resort fallback - create a new client without any event handlers
  prisma = createFallbackClient();
}

export default prisma

// Only store in global object if initialization was successful
if (process.env.VERCEL_ENV !== 'production' && prisma) {
  try {
    globalThis.prismaGlobal = prisma;
  } catch (error) {
    console.warn('Failed to store Prisma client in global object:', error);
  }
}