import { PrismaClient } from '@prisma/client'
import databaseConfig from '@/config/database'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: 
// https://pris.ly/d/help/next-js-best-practices

const prismaClientSingleton = () => {
  // Determine which log levels to use based on config
  const logLevels = ['error'];
  if (databaseConfig.logging.logQueries) logLevels.push('query');
  if (databaseConfig.logging.logSlowQueries) logLevels.push('info');
  if (process.env.NODE_ENV === 'development') logLevels.push('warn');

  return new PrismaClient({
    log: logLevels,
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Configure connection pool settings with higher timeouts
    connectionLimit: {
      default: {
        connectionTimeout: 60000, // 60 seconds timeout
        maxConnectionPoolSize: 5, // Keep default to avoid overwhelming the database
        maxWaitingClients: 20,
        idleTimeout: 120000, // 2 minutes idle timeout
      }
    }
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Create a new PrismaClient instance or reuse the existing one
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Add connection management and logging
prisma.$on('beforeExit', async () => {
  console.log('Disconnecting Prisma Client...')
})

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

export default prisma

if (process.env.VERCEL_ENV !== 'production') globalThis.prismaGlobal = prisma