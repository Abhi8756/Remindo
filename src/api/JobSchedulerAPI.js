import { JobScheduler } from '../core/JobScheduler.js';
import { JobPriority, RetryPolicy } from '../types/JobTypes.js';

/**
 * Job Scheduler API
 * Provides RESTful API interface for the job scheduler
 */
export class JobSchedulerAPI {
  constructor() {
    this.scheduler = new JobScheduler();
  }

  /**
   * Start the scheduler
   */
  async start() {
    try {
      this.scheduler.start();
      return { success: true, message: 'Scheduler started successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop the scheduler
   */
  async stop() {
    try {
      this.scheduler.stop();
      return { success: true, message: 'Scheduler stopped successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new job
   */
  async createJob(jobData) {
    try {
      // Validate required fields
      if (!jobData.id || !jobData.name || !jobData.schedule || !jobData.command) {
        throw new Error('Missing required fields: id, name, schedule, command');
      }

      // Set defaults
      const jobWithDefaults = {
        priority: JobPriority.MEDIUM,
        dependencies: [],
        retryPolicy: {
          type: RetryPolicy.FIXED,
          maxRetries: 3,
          delayMs: 1000
        },
        enabled: true,
        metadata: {},
        ...jobData
      };

      const job = this.scheduler.createJob(jobWithDefaults);
      return { success: true, data: job };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId, updates) {
    try {
      const job = this.scheduler.updateJob(jobId, updates);
      return { success: true, data: job };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId) {
    try {
      const result = this.scheduler.deleteJob(jobId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a specific job
   */
  async getJob(jobId) {
    try {
      const job = this.scheduler.getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }
      return { success: true, data: job };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all jobs
   */
  async getAllJobs() {
    try {
      const jobs = this.scheduler.getAllJobs();
      return { success: true, data: jobs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    try {
      const status = this.scheduler.getJobStatus(jobId);
      if (!status) {
        throw new Error(`Job ${jobId} not found`);
      }
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job executions
   */
  async getJobExecutions(jobId) {
    try {
      const executions = this.scheduler.getJobExecutions(jobId);
      return { success: true, data: executions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recent executions
   */
  async getRecentExecutions(limit = 50) {
    try {
      const executions = this.scheduler.getRecentExecutions(limit);
      return { success: true, data: executions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get execution details
   */
  async getExecution(executionId) {
    try {
      const execution = this.scheduler.getExecution(executionId);
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }
      return { success: true, data: execution };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute job immediately
   */
  async executeJobNow(jobId) {
    try {
      const execution = await this.scheduler.executeJobNow(jobId);
      return { success: true, data: execution };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    try {
      const status = this.scheduler.getSystemStatus();
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate dependencies
   */
  async validateDependencies() {
    try {
      const errors = this.scheduler.validateDependencies();
      return { success: true, data: { errors, isValid: errors.length === 0 } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available commands
   */
  async getAvailableCommands() {
    try {
      const commands = this.scheduler.getAvailableCommands();
      return { success: true, data: commands };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Register a new command
   */
  async registerCommand(name, commandFunction) {
    try {
      this.scheduler.registerCommand(name, commandFunction);
      return { success: true, message: `Command ${name} registered successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable/disable a job
   */
  async toggleJob(jobId, enabled) {
    try {
      const job = this.scheduler.updateJob(jobId, { enabled });
      return { success: true, data: job };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job statistics
   */
  async getJobStatistics() {
    try {
      const stats = this.scheduler.getSystemStatus();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Sample Job Definitions
 */
export const sampleJobs = [
  {
    id: 'backup-database',
    name: 'Database Backup',
    description: 'Daily backup of the main database',
    schedule: 'daily at 2 AM',
    command: 'backup',
    priority: JobPriority.HIGH,
    dependencies: [],
    retryPolicy: {
      type: RetryPolicy.EXPONENTIAL,
      maxRetries: 3,
      delayMs: 5000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        source: '/var/lib/postgresql/data',
        destination: '/backup/postgresql'
      }
    }
  },
  {
    id: 'process-logs',
    name: 'Log Processing',
    description: 'Process and analyze system logs',
    schedule: 'every 15 minutes',
    command: 'data_processing',
    priority: JobPriority.MEDIUM,
    dependencies: [],
    retryPolicy: {
      type: RetryPolicy.FIXED,
      maxRetries: 2,
      delayMs: 2000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        dataset: 'system-logs',
        operation: 'analyze'
      }
    }
  },
  {
    id: 'sync-data',
    name: 'Data Synchronization',
    description: 'Sync data with external systems',
    schedule: 'every 30 minutes',
    command: 'api_call',
    priority: JobPriority.MEDIUM,
    dependencies: [],
    retryPolicy: {
      type: RetryPolicy.EXPONENTIAL,
      maxRetries: 5,
      delayMs: 1000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        endpoint: 'https://api.external.com/sync',
        method: 'POST'
      }
    }
  },
  {
    id: 'cleanup-temp',
    name: 'Cleanup Temporary Files',
    description: 'Remove temporary files older than 24 hours',
    schedule: 'daily at 1 AM',
    command: 'cleanup',
    priority: JobPriority.LOW,
    dependencies: [],
    retryPolicy: {
      type: RetryPolicy.FIXED,
      maxRetries: 1,
      delayMs: 1000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        path: '/tmp',
        maxAge: '24h'
      }
    }
  },
  {
    id: 'health-check',
    name: 'System Health Check',
    description: 'Check system health every 10 minutes',
    schedule: 'every 10 minutes',
    command: 'health_check',
    priority: JobPriority.HIGH,
    dependencies: [],
    retryPolicy: {
      type: RetryPolicy.FIXED,
      maxRetries: 2,
      delayMs: 500
    },
    enabled: true,
    metadata: {
      commandArgs: {
        service: 'main-application'
      }
    }
  },
  {
    id: 'database-maintenance',
    name: 'Database Maintenance',
    description: 'Weekly database optimization',
    schedule: 'weekly on sunday',
    command: 'database_maintenance',
    priority: JobPriority.MEDIUM,
    dependencies: ['backup-database'],
    retryPolicy: {
      type: RetryPolicy.EXPONENTIAL,
      maxRetries: 3,
      delayMs: 2000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        operation: 'optimize',
        database: 'production'
      }
    }
  },
  {
    id: 'generate-report',
    name: 'Generate Daily Report',
    description: 'Generate daily analytics report',
    schedule: 'daily at 6 AM',
    command: 'data_processing',
    priority: JobPriority.HIGH,
    dependencies: ['process-logs', 'sync-data'],
    retryPolicy: {
      type: RetryPolicy.FIXED,
      maxRetries: 3,
      delayMs: 3000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        dataset: 'analytics',
        operation: 'generate-report'
      }
    }
  }
];

/**
 * Initialize sample jobs
 */
export async function initializeSampleJobs(api) {
  console.log('Initializing sample jobs...');
  
  for (const jobData of sampleJobs) {
    const result = await api.createJob(jobData);
    if (result.success) {
      console.log(`Created job: ${jobData.name}`);
    } else {
      console.error(`Failed to create job ${jobData.name}:`, result.error);
    }
  }
  
  console.log('Sample jobs initialized');
}
