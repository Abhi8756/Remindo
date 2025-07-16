import { WorkerNode } from '../types/JobTypes.js';
import { JobStatus } from '../types/JobTypes.js';

/**
 * Worker Pool Manager
 */
export class WorkerPool {
  constructor() {
    this.workers = new Map();
    this.initializeWorkers();
  }

  /**
   * Initialize placeholder worker machines
   */
  initializeWorkers() {
    // Placeholder worker machines (simulating distributed workers)
    const workerConfigs = [
      { id: 'worker-1', host: 'worker-node-1.local', port: 8080, capacity: 5 },
      { id: 'worker-2', host: 'worker-node-2.local', port: 8080, capacity: 8 },
      { id: 'worker-3', host: 'worker-node-3.local', port: 8080, capacity: 10 },
      { id: 'worker-4', host: 'worker-node-4.local', port: 8080, capacity: 6 }
    ];

    for (const config of workerConfigs) {
      const worker = new WorkerNode(config.id, config.host, config.port, config.capacity);
      // Initialize worker as healthy and available
      worker.status = 'HEALTHY';
      worker.lastHeartbeat = new Date();
      this.workers.set(worker.id, worker);
    }

    console.log(`Initialized ${this.workers.size} workers:`, Array.from(this.workers.keys()));
  }

  /**
   * Get all workers
   */
  getAllWorkers() {
    return Array.from(this.workers.values());
  }

  /**
   * Get available workers
   */
  getAvailableWorkers() {
    return Array.from(this.workers.values()).filter(worker => worker.isAvailable());
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId) {
    return this.workers.get(workerId);
  }

  /**
   * Select best worker for a job based on priority and current load
   */
  selectWorker(jobPriority) {
    const availableWorkers = this.getAvailableWorkers();
    
    if (availableWorkers.length === 0) {
      console.warn('No available workers found');
      return null;
    }

    // Sort by current load (ascending) and capacity (descending)
    // Higher priority jobs get preference to workers with more capacity
    availableWorkers.sort((a, b) => {
      const loadDiff = a.currentLoad - b.currentLoad;
      if (loadDiff !== 0) return loadDiff;
      
      // For high priority jobs, prefer workers with more capacity
      if (jobPriority === 'HIGH') {
        return b.capacity - a.capacity;
      }
      
      return a.capacity - b.capacity; // For normal jobs, prefer less loaded workers
    });

    const selectedWorker = availableWorkers[0];
    console.log(`Selected worker ${selectedWorker.id} for job with priority ${jobPriority}`);
    return selectedWorker;
  }

  /**
   * Assign job to worker
   */
  assignJob(workerId, executionId) {
    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }

    const success = worker.assignJob(executionId);
    if (!success) {
      throw new Error(`Worker ${workerId} is not available`);
    }

    return true;
  }

  /**
   * Release job from worker
   */
  releaseJob(workerId, executionId) {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.releaseJob(executionId);
    }
  }

  /**
   * Update worker heartbeat
   */
  updateHeartbeat(workerId) {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.updateHeartbeat();
    }
  }

  /**
   * Check worker health and mark unhealthy workers
   */
  checkWorkerHealth() {
    const now = new Date();
    const healthTimeout = 30000; // 30 seconds

    for (const worker of this.workers.values()) {
      const timeSinceHeartbeat = now - worker.lastHeartbeat;
      if (timeSinceHeartbeat > healthTimeout) {
        worker.status = 'UNHEALTHY';
        console.warn(`Worker ${worker.id} marked as unhealthy`);
      }
    }
  }

  /**
   * Get worker statistics
   */
  getWorkerStats() {
    const workers = Array.from(this.workers.values());
    const totalCapacity = workers.reduce((sum, w) => sum + w.capacity, 0);
    const totalLoad = workers.reduce((sum, w) => sum + w.currentLoad, 0);
    const healthyWorkers = workers.filter(w => w.status === 'HEALTHY');

    return {
      totalWorkers: workers.length,
      healthyWorkers: healthyWorkers.length,
      totalCapacity,
      totalLoad,
      utilizationRate: totalCapacity > 0 ? (totalLoad / totalCapacity) * 100 : 0,
      workerDetails: workers.map(w => ({
        id: w.id,
        host: w.host,
        status: w.status,
        capacity: w.capacity,
        currentLoad: w.currentLoad,
        utilizationRate: w.capacity > 0 ? (w.currentLoad / w.capacity) * 100 : 0,
        runningJobs: w.runningJobs.size,
        lastHeartbeat: w.lastHeartbeat
      }))
    };
  }
}

/**
 * Job Execution Engine
 */
export class JobExecutor {
  constructor(workerPool) {
    this.workerPool = workerPool;
    this.commandRegistry = new Map();
    this.initializeCommands();
  }

  /**
   * Initialize sample commands/methods
   */
  initializeCommands() {
    // Sample commands for demonstration
    this.commandRegistry.set('echo', async (args) => {
      const message = args ? args.message : 'Hello World';
      return `Echo: ${message}`;
    });

    this.commandRegistry.set('sleep', async (args) => {
      const duration = args ? args.duration : 1000;
      await new Promise(resolve => setTimeout(resolve, duration));
      return `Slept for ${duration}ms`;
    });

    this.commandRegistry.set('calculate', async (args) => {
      const { a = 1, b = 2, operation = 'add' } = args || {};
      switch (operation) {
        case 'add': return a + b;
        case 'subtract': return a - b;
        case 'multiply': return a * b;
        case 'divide': return a / b;
        default: throw new Error(`Unknown operation: ${operation}`);
      }
    });

    this.commandRegistry.set('api_call', async (args) => {
      const { endpoint = 'https://api.example.com/data', method = 'GET' } = args || {};
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return `API call to ${endpoint} with method ${method} completed`;
    });

    this.commandRegistry.set('data_processing', async (args) => {
      const { dataset = 'default', operation = 'process' } = args || {};
      // Simulate data processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `Data processing completed for ${dataset} with operation ${operation}`;
    });

    this.commandRegistry.set('backup', async (args) => {
      const { source = '/data', destination = '/backup' } = args || {};
      // Simulate backup operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      return `Backup completed from ${source} to ${destination}`;
    });

    this.commandRegistry.set('cleanup', async (args) => {
      const { path = '/tmp', maxAge = '24h' } = args || {};
      // Simulate cleanup operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      return `Cleanup completed for ${path} (files older than ${maxAge})`;
    });

    this.commandRegistry.set('health_check', async (args) => {
      const { service = 'default' } = args || {};
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 500));
      const isHealthy = Math.random() > 0.1; // 90% success rate
      if (!isHealthy) {
        throw new Error(`Health check failed for service ${service}`);
      }
      return `Health check passed for service ${service}`;
    });

    this.commandRegistry.set('database_maintenance', async (args) => {
      const { operation = 'optimize', database = 'main' } = args || {};
      // Simulate database maintenance
      await new Promise(resolve => setTimeout(resolve, 4000));
      return `Database maintenance completed: ${operation} on ${database}`;
    });

    this.commandRegistry.set('report_generation', async (args) => {
      const { type = 'daily', format = 'pdf' } = args || {};
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2500));
      return `Report generated: ${type} report in ${format} format`;
    });

    this.commandRegistry.set('data_sync', async (args) => {
      const { source = 'local', destination = 'remote' } = args || {};
      // Simulate data synchronization
      await new Promise(resolve => setTimeout(resolve, 3000));
      return `Data synchronized from ${source} to ${destination}`;
    });

    this.commandRegistry.set('email_notification', async (args) => {
      const { recipient = 'admin@example.com', subject = 'Job Notification' } = args || {};
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `Email sent to ${recipient} with subject "${subject}"`;
    });
  }

  /**
   * Register a new command
   */
  registerCommand(name, commandFunction) {
    this.commandRegistry.set(name, commandFunction);
  }

  /**
   * Execute a job
   */
  async executeJob(execution, job) {
    const worker = this.workerPool.selectWorker(job.priority);
    
    if (!worker) {
      throw new Error('No available workers');
    }

    // Assign job to worker
    this.workerPool.assignJob(worker.id, execution.id);
    execution.start(worker.id);

    try {
      // Parse command
      const commandParts = job.command.split(' ');
      const commandName = commandParts[0];
      const commandArgs = job.metadata.commandArgs || {};

      // Execute command
      const commandFunction = this.commandRegistry.get(commandName);
      if (!commandFunction) {
        throw new Error(`Unknown command: ${commandName}`);
      }

      const result = await commandFunction(commandArgs);
      
      // Complete execution
      execution.complete(result);
      
      return execution;
    } catch (error) {
      execution.fail(error.message);
      throw error;
    } finally {
      // Release worker
      this.workerPool.releaseJob(worker.id, execution.id);
    }
  }

  /**
   * Get available commands
   */
  getAvailableCommands() {
    return Array.from(this.commandRegistry.keys());
  }
}

/**
 * Retry Manager
 */
export class RetryManager {
  constructor() {
    this.retryQueue = [];
  }

  /**
   * Check if execution should be retried
   */
  shouldRetry(execution, job) {
    if (execution.status !== JobStatus.FAILED) return false;
    if (execution.retryCount >= job.retryPolicy.maxRetries) return false;
    
    return true;
  }

  /**
   * Calculate retry delay
   */
  calculateRetryDelay(execution, retryPolicy) {
    const { type, delayMs, maxDelayMs = 300000 } = retryPolicy; // max 5 minutes
    
    switch (type) {
      case 'EXPONENTIAL':
        return Math.min(delayMs * Math.pow(2, execution.retryCount), maxDelayMs);
      case 'FIXED':
      default:
        return delayMs;
    }
  }

  /**
   * Schedule retry
   */
  scheduleRetry(execution, job) {
    if (!this.shouldRetry(execution, job)) return false;

    const delay = this.calculateRetryDelay(execution, job.retryPolicy);
    const retryTime = new Date(Date.now() + delay);

    this.retryQueue.push({
      execution,
      job,
      retryTime
    });

    execution.retry();
    return true;
  }

  /**
   * Get executions ready for retry
   */
  getReadyRetries() {
    const now = new Date();
    const readyRetries = this.retryQueue.filter(item => item.retryTime <= now);
    
    // Remove processed retries from queue
    this.retryQueue = this.retryQueue.filter(item => item.retryTime > now);
    
    return readyRetries;
  }

  /**
   * Clear retry queue
   */
  clearRetryQueue() {
    this.retryQueue = [];
  }
}
