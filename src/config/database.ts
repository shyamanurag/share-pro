/**
 * Database configuration settings
 * This file contains all database-related configuration settings
 */

export const databaseConfig = {
  // Connection pool settings
  connectionPool: {
    // Maximum number of connections in the pool
    // Default is 5, but we're increasing it to handle more concurrent requests
    maxConnections: 10,
    
    // Connection timeout in milliseconds
    // Default is 10000 (10 seconds), but we're increasing it to 30 seconds
    connectionTimeout: 30000,
    
    // Maximum number of clients that can be waiting for a connection
    maxWaitingClients: 50,
    
    // Idle timeout in milliseconds
    // How long a connection can remain idle before being closed
    idleTimeout: 60000,
  },
  
  // Retry settings for database operations
  retry: {
    // Maximum number of retry attempts for database operations
    maxRetries: 3,
    
    // Base delay between retry attempts in milliseconds
    // This will be multiplied by the attempt number for exponential backoff
    retryDelay: 1000,
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
    
    // Interval between health checks in milliseconds (5 minutes)
    interval: 300000,
  }
};

export default databaseConfig;