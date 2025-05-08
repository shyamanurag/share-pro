import prisma from './prisma';
import { checkDatabaseConnection } from './db-connection';

/**
 * Database health monitor
 * This class provides methods to monitor database health and report issues
 */
class DbHealthMonitor {
  private static instance: DbHealthMonitor;
  private isHealthy: boolean = true;
  private lastCheckTime: number = 0;
  private checkInterval: NodeJS.Timeout | null = null;
  private healthCheckIntervalMs: number = 5 * 60 * 1000; // 5 minutes
  private healthListeners: Array<(isHealthy: boolean) => void> = [];
  private consecutiveFailures: number = 0;
  private maxConsecutiveFailures: number = 3;

  private constructor() {
    // Initialize health check
    this.startHealthCheck();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DbHealthMonitor {
    if (!DbHealthMonitor.instance) {
      DbHealthMonitor.instance = new DbHealthMonitor();
    }
    return DbHealthMonitor.instance;
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Perform initial health check
    this.checkHealth();

    // Set up interval for periodic health checks
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, this.healthCheckIntervalMs);
  }

  /**
   * Check database health
   */
  private async checkHealth(): Promise<void> {
    try {
      const isConnected = await checkDatabaseConnection();
      
      // Update health status
      const previousHealth = this.isHealthy;
      
      if (isConnected) {
        this.isHealthy = true;
        this.consecutiveFailures = 0;
      } else {
        this.consecutiveFailures++;
        
        // Only mark as unhealthy after multiple consecutive failures
        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          this.isHealthy = false;
        }
      }
      
      // Update last check time
      this.lastCheckTime = Date.now();
      
      // Notify listeners if health status changed
      if (previousHealth !== this.isHealthy) {
        this.notifyHealthListeners();
        
        // Log health status change
        if (this.isHealthy) {
          console.log('Database health restored');
          this.logHealthEvent('RESTORED', 'Database connection restored after previous failures');
        } else {
          console.error('Database health check failed');
          this.logHealthEvent('FAILED', `Database connection failed after ${this.consecutiveFailures} consecutive attempts`);
        }
      }
    } catch (error) {
      console.error('Error during database health check:', error);
      
      // Increment consecutive failures
      this.consecutiveFailures++;
      
      // Mark as unhealthy after multiple consecutive failures
      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        const previousHealth = this.isHealthy;
        this.isHealthy = false;
        
        // Notify listeners if health status changed
        if (previousHealth !== this.isHealthy) {
          this.notifyHealthListeners();
          this.logHealthEvent('ERROR', `Database health check error: ${error.message}`);
        }
      }
      
      // Update last check time
      this.lastCheckTime = Date.now();
    }
  }

  /**
   * Log a health event to the database
   */
  private async logHealthEvent(status: string, details: string): Promise<void> {
    try {
      // Only log to database if we can connect
      if (status === 'RESTORED' || this.consecutiveFailures < this.maxConsecutiveFailures) {
        await prisma.systemLog.create({
          data: {
            id: crypto.randomUUID(),
            level: status === 'RESTORED' ? 'INFO' : 'ERROR',
            source: 'DB_HEALTH_MONITOR',
            message: `Database health status: ${status}`,
            details,
            timestamp: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Failed to log health event to database:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Notify all health listeners
   */
  private notifyHealthListeners(): void {
    for (const listener of this.healthListeners) {
      try {
        listener(this.isHealthy);
      } catch (error) {
        console.error('Error in health listener:', error);
      }
    }
  }

  /**
   * Check if the database is healthy
   */
  public isDatabaseHealthy(): boolean {
    // If the last check was more than 10 minutes ago, consider the status unknown
    const tenMinutesInMs = 10 * 60 * 1000;
    if (Date.now() - this.lastCheckTime > tenMinutesInMs) {
      // Trigger a health check
      this.checkHealth();
      return false; // Be conservative and return false until we know for sure
    }
    
    return this.isHealthy;
  }

  /**
   * Register a health listener
   * @param listener Function to call when health status changes
   * @returns Function to unregister the listener
   */
  public registerHealthListener(listener: (isHealthy: boolean) => void): () => void {
    this.healthListeners.push(listener);
    
    // Return function to unregister
    return () => {
      this.healthListeners = this.healthListeners.filter(l => l !== listener);
    };
  }

  /**
   * Force a health check
   * @returns Promise that resolves to the health status
   */
  public async forceHealthCheck(): Promise<boolean> {
    await this.checkHealth();
    return this.isHealthy;
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.healthListeners = [];
  }
}

// Export the singleton instance
export default DbHealthMonitor.getInstance();