import { Job, JobExecution, JobStatus, JobPriority } from '../types/JobTypes.js';
import { ScheduleManager } from '../utils/ScheduleUtils.js';

/**
 * In-memory Job Storage
 */
export class JobStorage {
  constructor() {
    this.jobs = new Map();
    this.executions = new Map();
  }

  // Job CRUD operations
  createJob(jobData) {
    const job = new Job(jobData);
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    Object.assign(job, updates);
    job.updatedAt = new Date();
    return job;
  }

  deleteJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    this.jobs.delete(jobId);
    return true;
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  getJobsByPriority(priority) {
    return Array.from(this.jobs.values()).filter(job => job.priority === priority);
  }

  getEnabledJobs() {
    return Array.from(this.jobs.values()).filter(job => job.enabled);
  }

  // Execution CRUD operations
  createExecution(jobId, scheduledTime) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    
    const execution = new JobExecution(jobId, job.name, scheduledTime);
    this.executions.set(execution.id, execution);
    return execution;
  }

  getExecution(executionId) {
    return this.executions.get(executionId);
  }

  updateExecution(executionId, updates) {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error(`Execution ${executionId} not found`);
    
    Object.assign(execution, updates);
    return execution;
  }

  getAllExecutions() {
    return Array.from(this.executions.values());
  }

  getExecutionsByJob(jobId) {
    return Array.from(this.executions.values()).filter(exec => exec.jobId === jobId);
  }

  getExecutionsByStatus(status) {
    return Array.from(this.executions.values()).filter(exec => exec.status === status);
  }

  getRecentExecutions(limit = 100) {
    return Array.from(this.executions.values())
      .sort((a, b) => b.scheduledTime - a.scheduledTime)
      .slice(0, limit);
  }

  // Dependency management
  getJobDependencies(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.dependencies : [];
  }

  getJobDependents(jobId) {
    return Array.from(this.jobs.values())
      .filter(job => job.dependencies.includes(jobId))
      .map(job => job.id);
  }

  // Statistics
  getJobStats() {
    const jobs = Array.from(this.jobs.values());
    const executions = Array.from(this.executions.values());
    
    return {
      totalJobs: jobs.length,
      enabledJobs: jobs.filter(j => j.enabled).length,
      jobsByPriority: {
        [JobPriority.HIGH]: jobs.filter(j => j.priority === JobPriority.HIGH).length,
        [JobPriority.MEDIUM]: jobs.filter(j => j.priority === JobPriority.MEDIUM).length,
        [JobPriority.LOW]: jobs.filter(j => j.priority === JobPriority.LOW).length
      },
      totalExecutions: executions.length,
      executionsByStatus: {
        [JobStatus.PENDING]: executions.filter(e => e.status === JobStatus.PENDING).length,
        [JobStatus.RUNNING]: executions.filter(e => e.status === JobStatus.RUNNING).length,
        [JobStatus.COMPLETED]: executions.filter(e => e.status === JobStatus.COMPLETED).length,
        [JobStatus.FAILED]: executions.filter(e => e.status === JobStatus.FAILED).length,
        [JobStatus.WAITING_FOR_DEPENDENCIES]: executions.filter(e => e.status === JobStatus.WAITING_FOR_DEPENDENCIES).length,
        [JobStatus.RETRYING]: executions.filter(e => e.status === JobStatus.RETRYING).length
      }
    };
  }
}

/**
 * Dependency Graph Manager
 */
export class DependencyManager {
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Check if a job can be executed based on its dependencies
   */
  canExecuteJob(jobId) {
    const job = this.storage.getJob(jobId);
    if (!job || !job.enabled) return false;

    const dependencies = job.dependencies;
    if (!dependencies || dependencies.length === 0) return true;

    // Check if all dependencies have completed successfully in recent executions
    for (const depJobId of dependencies) {
      const depJob = this.storage.getJob(depJobId);
      if (!depJob) {
        console.warn(`Dependency job ${depJobId} not found`);
        return false;
      }

      const recentExecution = this.getLastSuccessfulExecution(depJobId);
      if (!recentExecution) {
        return false;
      }

      // Check if dependency was executed recently (within last 24 hours)
      const timeSinceExecution = Date.now() - recentExecution.endTime.getTime();
      if (timeSinceExecution > 24 * 60 * 60 * 1000) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the last successful execution of a job
   */
  getLastSuccessfulExecution(jobId) {
    const executions = this.storage.getExecutionsByJob(jobId);
    return executions
      .filter(exec => exec.status === JobStatus.COMPLETED)
      .sort((a, b) => b.endTime - a.endTime)[0];
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(jobId, visited = new Set()) {
    if (visited.has(jobId)) return true;
    
    const job = this.storage.getJob(jobId);
    if (!job) return false;

    visited.add(jobId);
    
    for (const depId of job.dependencies) {
      if (this.hasCircularDependency(depId, visited)) {
        return true;
      }
    }
    
    visited.delete(jobId);
    return false;
  }

  /**
   * Validate dependency graph
   */
  validateDependencies() {
    const errors = [];
    const jobs = this.storage.getAllJobs();

    for (const job of jobs) {
      // Check for circular dependencies
      if (this.hasCircularDependency(job.id)) {
        errors.push(`Circular dependency detected for job ${job.id}`);
      }

      // Check if all dependencies exist
      for (const depId of job.dependencies) {
        if (!this.storage.getJob(depId)) {
          errors.push(`Job ${job.id} depends on non-existent job ${depId}`);
        }
      }
    }

    return errors;
  }

  /**
   * Get jobs that are ready to execute (dependencies satisfied)
   */
  getReadyJobs() {
    const jobs = this.storage.getEnabledJobs();
    return jobs.filter(job => this.canExecuteJob(job.id));
  }

  /**
   * Get dependency chain for a job
   */
  getDependencyChain(jobId, chain = []) {
    if (chain.includes(jobId)) return chain; // Avoid cycles
    
    const job = this.storage.getJob(jobId);
    if (!job) return chain;

    chain.push(jobId);
    
    for (const depId of job.dependencies) {
      this.getDependencyChain(depId, chain);
    }
    
    return chain;
  }
}
