import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';
import { Prisma } from '@prisma/client';

/**
 * Middleware to handle Prisma errors consistently across API routes
 * This middleware catches Prisma-specific errors and returns appropriate HTTP responses
 */
export function prismaErrorHandler() {
  return async (req: NextApiRequest, res: NextApiResponse, next: NextHandler) => {
    try {
      // Continue to the next middleware or route handler
      await next();
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma error codes
        switch (error.code) {
          case 'P2002': // Unique constraint violation
            return res.status(409).json({
              error: 'Conflict',
              message: 'A record with this data already exists',
              details: error.meta?.target ? `Duplicate field: ${error.meta.target}` : undefined
            });
          
          case 'P2025': // Record not found
            return res.status(404).json({
              error: 'Not Found',
              message: 'The requested resource was not found',
              details: error.meta?.cause || error.message
            });
            
          case 'P2003': // Foreign key constraint failed
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid relationship reference',
              details: error.meta?.field_name ? `Invalid reference: ${error.meta.field_name}` : undefined
            });
            
          case 'P2014': // The change you are trying to make would violate the required relation
            return res.status(400).json({
              error: 'Bad Request',
              message: 'Invalid relationship',
              details: error.message
            });
            
          case 'P2024': // Connection pool timeout
          case 'P2028': // Transaction API error
            return res.status(503).json({
              error: 'Service Unavailable',
              message: 'Database connection issue',
              details: 'Please try again later'
            });
            
          default:
            return res.status(500).json({
              error: 'Internal Server Error',
              message: 'Database error',
              code: error.code
            });
        }
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Validation errors (e.g., missing required fields)
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Validation error',
          details: error.message.split('\n').pop()
        });
      } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        // Rust panic (internal Prisma error)
        console.error('CRITICAL: Prisma Client Rust panic error', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'A critical database error occurred',
          details: 'Please contact support'
        });
      } else if (error instanceof Prisma.PrismaClientInitializationError) {
        // Initialization errors
        console.error('CRITICAL: Prisma Client initialization error', error);
        return res.status(503).json({
          error: 'Service Unavailable',
          message: 'Database connection failed',
          details: 'The system is currently unable to connect to the database'
        });
      } else if (error instanceof Error) {
        // Generic error handling
        return res.status(500).json({
          error: 'Internal Server Error',
          message: error.message || 'An unexpected error occurred'
        });
      } else {
        // Unknown error type
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred'
        });
      }
    }
  };
}

export default prismaErrorHandler;