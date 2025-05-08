import prisma from './prisma';
import { checkDatabaseConnection } from './db-connection';
import databaseConfig from '@/config/database';

/**
 * Connection manager to handle database connections
 * This class provides methods to manage database connections
 * and implements connection pooling and retry logic
 */
class ConnectionManager {
  private isConnected: boolean = false;
  private lastCheckTime: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000; // 5 seconds
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start health check if enabled
    if (databaseConfig.healthCheck.enabled) {
      this.startHealthCheck();
    }
  }

  /**
   * Initialize the connection manager
   * This method should be called at application startup
   */
  async initialize(): Promise<void> {
    try {
      // Check database connection
      this.isConnected = await checkDatabaseConnection();
      this.lastCheckTime = Date.now();
      
      if (this.isConnected) {
        console.log('Database connection initialized successfully');
      } else {
        console.error('Failed to initialize database connection');
      }
    } catch (error) {
      console.error('Error initializing database connection:', error);
      this.isConnected = false;
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const isConnected = await checkDatabaseConnection();
        
        if (isConnected !== this.isConnected) {
          if (isConnected) {
            console.log('Database connection restored');
            this.reconnectAttempts = 0;
          } else {
            console.error('Database connection lost');
            this.attemptReconnect();
          }
        }
        
        this.isConnected = isConnected;
        this.lastCheckTime = Date.now();
      } catch (error) {
        console.error('Error during database health check:', error);
        this.isConnected = false;
        this.attemptReconnect();
      }
    }, databaseConfig.healthCheck.interval);
  }

  /**
   * Attempt to reconnect to the database
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }

    this.reconnectAttempts++;
    
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    console.log(`Attempting to reconnect to database in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        // Disconnect first to clear any existing connections
        await prisma.$disconnect();
        
        // Check connection
        this.isConnected = await checkDatabaseConnection();
        
        if (this.isConnected) {
          console.log('Successfully reconnected to database');
          this.reconnectAttempts = 0;
        } else {
          console.error('Failed to reconnect to database');
          this.attemptReconnect();
        }
      } catch (error) {
        console.error('Error reconnecting to database:', error);
        this.attemptReconnect();
      }
    }, delay);
  }

  /**
   * Check if the database is connected
   */
  isConnectedToDatabase(): boolean {
    // If the last check was more than 5 minutes ago, consider the connection status unknown
    const fiveMinutesInMs = 5 * 60 * 1000;
    if (Date.now() - this.lastCheckTime > fiveMinutesInMs) {
      return false;
    }
    
    return this.isConnected;
  }

  /**
   * Clean up resources when shutting down
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
}

// Create a singleton instance
const connectionManager = new ConnectionManager();

// Initialize the connection manager
connectionManager.initialize().catch(error => {
  console.error('Failed to initialize connection manager:', error);
});

export default connectionManager;