/**
 * Database configuration settings
 * This file contains all database-related configuration settings
 */

export const databaseConfig = {
  // Connection pool settings
  connectionPool: {
    // Maximum number of connections in the pool
    // Keep at default 5 to avoid overwhelming the database
    maxConnections: 5,
    
    // Connection timeout in milliseconds
    // Increased to 60 seconds to handle slow connections
    connectionTimeout: 60000,
    
    // Maximum number of clients that can be waiting for a connection
    // Reduced to avoid too many waiting clients
    maxWaitingClients: 20,
    
    // Idle timeout in milliseconds
    // How long a connection can remain idle before being closed
    // Increased to 2 minutes to reduce connection churn
    idleTimeout: 120000,
  },
  
  // Retry settings for database operations
  retry: {
    // Maximum number of retry attempts for database operations
    // Increased to 5 for more resilience
    maxRetries: 5,
    
    // Base delay between retry attempts in milliseconds
    // This will be multiplied by 2^attempt for exponential backoff
    retryDelay: 500,
  },
  
  // Logging settings
  logging: {
    // Whether to log database queries
    logQueries: process.env.NODE_ENV === 'development',
    
    // Whether to log database errors
    logErrors: true,
    
    // Whether to log slow queries (queries that take longer than slowQueryThreshold)
    logSlowQueries: true,
    
    // Threshold for slow queries in milliseconds
    slowQueryThreshold: 1000,
  },
  
  // Health check settings
  healthCheck: {
    // Whether to enable periodic health checks
    enabled: true,
    
    // Interval between health checks in milliseconds (10 minutes)
    // Increased to reduce database load from health checks
    interval: 600000,
    
    // Timeout for health check queries in milliseconds
    timeout: 5000,
  }
};

export default databaseConfig;