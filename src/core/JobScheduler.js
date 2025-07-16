import { JobStorage, DependencyManager } from '../storage/JobStorage.js';
import { WorkerPool, JobExecutor, RetryManager } from '../execution/JobExecutor.js';
import { ScheduleManager } from '../utils/ScheduleUtils.js';
import { JobStatus } from '../types/JobTypes.js';

/**
 * Main Job Scheduler System
 */
export class JobScheduler {
  constructor() {
    this.storage = new JobStorage();
    this.dependencyManager = new DependencyManager(this.storage);
    this.workerPool = new WorkerPool();
    this.executor = new JobExecutor(this.workerPool);
    this.retryManager = new RetryManager();
    this.scheduleManager = new ScheduleManager();
    
    this.isRunning = false;
    this.schedulerInterval = null;
    this.heartbeatInterval = null;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting job scheduler...');

    // Schedule jobs every 10 seconds
    this.schedulerInterval = setInterval(() => {
      this.processScheduledJobs();
    }, 10000);

    // Worker health check every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.workerPool.checkWorkerHealth();
    }, 30000);

    // Process retries every 5 seconds
    this.retryInterval = setInterval(() => {
      this.processRetries();
    }, 5000);

    console.log('Job scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.warn('Scheduler is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }

    console.log('Job scheduler stopped');
  }

  /**
   * Process scheduled jobs
   */
  async processScheduledJobs() {
    try {
      const currentTime = new Date();
      const jobsToExecute = this.scheduleManager.getJobsToExecute(currentTime);

      for (const jobId of jobsToExecute) {
        const job = this.storage.getJob(jobId);
        if (!job || !job.enabled) continue;

        // Check dependencies
        if (!this.dependencyManager.canExecuteJob(jobId)) {
          console.log(`Job ${jobId} waiting for dependencies`);
          const execution = this.storage.createExecution(jobId, currentTime);
          execution.status = JobStatus.WAITING_FOR_DEPENDENCIES;
          execution.addLog('Waiting for dependencies to complete');
          continue;
        }

        // Create execution
        const execution = this.storage.createExecution(jobId, currentTime);
        
        // Execute job
        this.executeJobAsync(execution, job);
      }
    } catch (error) {
      console.error('Error processing scheduled jobs:', error);
    }
  }

  /**
   * Execute job asynchronously
   */
  async executeJobAsync(execution, job) {
    try {
      await this.executor.executeJob(execution, job);
      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error.message);
      
      // Try to schedule retry
      const retryScheduled = this.retryManager.scheduleRetry(execution, job);
      if (retryScheduled) {
        console.log(`Job ${job.id} scheduled for retry (attempt ${execution.retryCount + 1})`);
      } else {
        console.log(`Job ${job.id} failed permanently after ${execution.retryCount} retries`);
      }
    }
  }

  /**
   * Process retries
   */
  async processRetries() {
    try {
      const readyRetries = this.retryManager.getReadyRetries();
      
      for (const { execution, job } of readyRetries) {
        console.log(`Retrying job ${job.id} (attempt ${execution.retryCount + 1})`);
        this.executeJobAsync(execution, job);
      }
    } catch (error) {
      console.error('Error processing retries:', error);
    }
  }

  /**
   * API Methods
   */

  // Job Management
  createJob(jobData) {
    try {
      const job = this.storage.createJob(jobData);
      
      // Add to schedule manager
      this.scheduleManager.addSchedule(job.id, job.schedule);
      
      // Validate dependencies
      const dependencyErrors = this.dependencyManager.validateDependencies();
      if (dependencyErrors.length > 0) {
        console.warn('Dependency validation warnings:', dependencyErrors);
      }
      
      return job;
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  updateJob(jobId, updates) {
    try {
      const job = this.storage.updateJob(jobId, updates);
      
      // Update schedule if changed
      if (updates.schedule) {
        this.scheduleManager.addSchedule(job.id, job.schedule);
      }
      
      return job;
    } catch (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  deleteJob(jobId) {
    try {
      const result = this.storage.deleteJob(jobId);
      
      // Remove from schedule manager
      this.scheduleManager.removeSchedule(jobId);
      
      return result;
    } catch (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  getJob(jobId) {
    return this.storage.getJob(jobId);
  }

  getAllJobs() {
    return this.storage.getAllJobs();
  }

  // Execution Management
  getJobExecutions(jobId) {
    return this.storage.getExecutionsByJob(jobId);
  }

  getRecentExecutions(limit = 50) {
    return this.storage.getRecentExecutions(limit);
  }

  getExecution(executionId) {
    return this.storage.getExecution(executionId);
  }

  // Status and Monitoring
  getSystemStatus() {
    return {
      scheduler: {
        isRunning: this.isRunning,
        uptime: this.isRunning ? Date.now() - this.startTime : 0
      },
      jobs: this.storage.getJobStats(),
      workers: this.workerPool.getWorkerStats(),
      dependencies: {
        errors: this.dependencyManager.validateDependencies()
      },
      nextExecutions: this.scheduleManager.getAllNextExecutions().slice(0, 10)
    };
  }

  getJobStatus(jobId) {
    const job = this.storage.getJob(jobId);
    if (!job) return null;

    const recentExecutions = this.storage.getExecutionsByJob(jobId)
      .sort((a, b) => b.scheduledTime - a.scheduledTime)
      .slice(0, 5);

    const nextExecution = this.scheduleManager.getNextExecutionTime(jobId);
    const canExecute = this.dependencyManager.canExecuteJob(jobId);

    return {
      job,
      nextExecution,
      canExecute,
      recentExecutions,
      dependencies: {
        required: job.dependencies,
        satisfied: canExecute
      }
    };
  }

  // Manual Execution
  async executeJobNow(jobId) {
    const job = this.storage.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (!job.enabled) {
      throw new Error(`Job ${jobId} is disabled`);
    }

    // Check dependencies
    if (!this.dependencyManager.canExecuteJob(jobId)) {
      throw new Error(`Job ${jobId} dependencies not satisfied`);
    }

    // Create execution
    const execution = this.storage.createExecution(jobId, new Date());
    
    // Execute job
    try {
      await this.executor.executeJob(execution, job);
      return execution;
    } catch (error) {
      throw new Error(`Job execution failed: ${error.message}`);
    }
  }

  // Utility Methods
  validateDependencies() {
    return this.dependencyManager.validateDependencies();
  }

  getAvailableCommands() {
    return this.executor.getAvailableCommands();
  }

  registerCommand(name, commandFunction) {
    this.executor.registerCommand(name, commandFunction);
  }
}
