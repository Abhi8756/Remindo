/**
 * Job Types and Constants
 */

export const JobPriority = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

export const JobStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  WAITING_FOR_DEPENDENCIES: 'WAITING_FOR_DEPENDENCIES',
  RETRYING: 'RETRYING'
};

export const RetryPolicy = {
  NONE: 'NONE',
  FIXED: 'FIXED',
  EXPONENTIAL: 'EXPONENTIAL'
};

/**
 * Job Definition Structure
 */
export class Job {
  constructor({
    id,
    name,
    description = '',
    schedule,
    command,
    priority = JobPriority.MEDIUM,
    dependencies = [],
    retryPolicy = {
      type: RetryPolicy.FIXED,
      maxRetries: 3,
      delayMs: 1000
    },
    enabled = true,
    metadata = {}
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.schedule = schedule; // Cron-like schedule
    this.command = command; // Command/method to execute
    this.priority = priority;
    this.dependencies = dependencies; // Array of job IDs
    this.retryPolicy = retryPolicy;
    this.enabled = enabled;
    this.metadata = metadata;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

/**
 * Job Execution Instance
 */
export class JobExecution {
  constructor(jobId, jobName, scheduledTime) {
    this.id = `${jobId}_${Date.now()}`;
    this.jobId = jobId;
    this.jobName = jobName;
    this.status = JobStatus.PENDING;
    this.scheduledTime = scheduledTime;
    this.startTime = null;
    this.endTime = null;
    this.retryCount = 0;
    this.assignedWorker = null;
    this.result = null;
    this.error = null;
    this.logs = [];
  }

  start(workerId) {
    this.status = JobStatus.RUNNING;
    this.startTime = new Date();
    this.assignedWorker = workerId;
    this.addLog(`Job started on worker ${workerId}`);
  }

  complete(result) {
    this.status = JobStatus.COMPLETED;
    this.endTime = new Date();
    this.result = result;
    this.addLog(`Job completed successfully`);
  }

  fail(error) {
    this.status = JobStatus.FAILED;
    this.endTime = new Date();
    this.error = error;
    this.addLog(`Job failed: ${error}`);
  }

  retry() {
    this.status = JobStatus.RETRYING;
    this.retryCount++;
    this.startTime = null;
    this.endTime = null;
    this.assignedWorker = null;
    this.addLog(`Job retry #${this.retryCount}`);
  }

  addLog(message) {
    this.logs.push({
      timestamp: new Date(),
      message
    });
  }

  getDuration() {
    if (this.startTime && this.endTime) {
      return this.endTime - this.startTime;
    }
    return null;
  }
}

/**
 * Worker Node
 */
export class WorkerNode {
  constructor(id, host, port, capacity = 10) {
    this.id = id;
    this.host = host;
    this.port = port;
    this.capacity = capacity;
    this.currentLoad = 0;
    this.status = 'HEALTHY';
    this.lastHeartbeat = new Date();
    this.runningJobs = new Set();
  }

  isAvailable() {
    return this.status === 'HEALTHY' && this.currentLoad < this.capacity;
  }

  assignJob(executionId) {
    if (this.isAvailable()) {
      this.runningJobs.add(executionId);
      this.currentLoad++;
      return true;
    }
    return false;
  }

  releaseJob(executionId) {
    this.runningJobs.delete(executionId);
    this.currentLoad = Math.max(0, this.currentLoad - 1);
  }

  updateHeartbeat() {
    this.lastHeartbeat = new Date();
  }
}
