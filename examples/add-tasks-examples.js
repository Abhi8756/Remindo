/**
 * Examples of Adding Tasks to the Job Scheduler
 * This file shows different ways to add tasks programmatically
 */

import { JobSchedulerAPI } from './src/api/JobSchedulerAPI.js';
import { JobPriority, RetryPolicy } from './src/types/JobTypes.js';

// Create API instance
const api = new JobSchedulerAPI();

// Example 1: Simple task with minimal configuration
export async function addSimpleTask() {
  const simpleTask = {
    id: 'simple-task',
    name: 'Simple Task',
    schedule: 'every 5 minutes',
    command: 'echo',
    metadata: {
      commandArgs: {
        message: 'Hello from simple task!'
      }
    }
  };

  const result = await api.createJob(simpleTask);
  console.log('Simple task created:', result);
  return result;
}

// Example 2: Complex task with all options
export async function addComplexTask() {
  const complexTask = {
    id: 'complex-task',
    name: 'Complex Data Processing Task',
    description: 'A complex task that processes data with dependencies',
    schedule: 'daily at 4 AM',
    command: 'data_processing',
    priority: JobPriority.HIGH,
    dependencies: ['backup-database', 'sync-data'],
    retryPolicy: {
      type: RetryPolicy.EXPONENTIAL,
      maxRetries: 5,
      delayMs: 2000
    },
    enabled: true,
    metadata: {
      commandArgs: {
        dataset: 'customer-data',
        operation: 'analyze-trends',
        outputFormat: 'json'
      }
    }
  };

  const result = await api.createJob(complexTask);
  console.log('Complex task created:', result);
  return result;
}

// Example 3: Batch task creation
export async function addBatchTasks() {
  const batchTasks = [
    {
      id: 'email-notifications',
      name: 'Email Notifications',
      schedule: 'every 30 minutes',
      command: 'email_notification',
      priority: JobPriority.MEDIUM,
      metadata: {
        commandArgs: {
          recipient: 'admin@company.com',
          subject: 'System Status Update'
        }
      }
    },
    {
      id: 'system-monitoring',
      name: 'System Monitoring',
      schedule: 'every 2 minutes',
      command: 'health_check',
      priority: JobPriority.HIGH,
      retryPolicy: {
        type: RetryPolicy.FIXED,
        maxRetries: 3,
        delayMs: 500
      },
      metadata: {
        commandArgs: {
          service: 'web-server'
        }
      }
    },
    {
      id: 'weekly-reports',
      name: 'Weekly Reports',
      schedule: 'weekly on monday',
      command: 'report_generation',
      priority: JobPriority.LOW,
      dependencies: ['data-processing'],
      metadata: {
        commandArgs: {
          type: 'weekly',
          format: 'pdf'
        }
      }
    }
  ];

  const results = [];
  for (const task of batchTasks) {
    const result = await api.createJob(task);
    results.push(result);
    console.log(`Batch task created: ${task.name}`, result.success);
  }
  
  return results;
}

// Example 4: Custom command task
export async function addCustomCommandTask() {
  // First, register a custom command
  await api.registerCommand('custom_analysis', async (args) => {
    const { dataSource, analysisType } = args;
    // Simulate custom analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    return `Custom analysis completed for ${dataSource} with type ${analysisType}`;
  });

  // Now create a task using the custom command
  const customTask = {
    id: 'custom-analysis-task',
    name: 'Custom Analysis Task',
    description: 'Uses a custom command for specialized analysis',
    schedule: 'daily at 8 AM',
    command: 'custom_analysis',
    priority: JobPriority.HIGH,
    metadata: {
      commandArgs: {
        dataSource: 'sales-database',
        analysisType: 'predictive'
      }
    }
  };

  const result = await api.createJob(customTask);
  console.log('Custom command task created:', result);
  return result;
}

// Example 5: Conditional task creation
export async function addConditionalTask() {
  // Check system status before creating task
  const systemStatus = await api.getSystemStatus();
  
  if (systemStatus.success && systemStatus.data.workers.healthyWorkers > 2) {
    const conditionalTask = {
      id: 'resource-intensive-task',
      name: 'Resource Intensive Task',
      description: 'Only created when sufficient workers are available',
      schedule: 'every 1 hour',
      command: 'data_processing',
      priority: JobPriority.MEDIUM,
      metadata: {
        commandArgs: {
          dataset: 'large-dataset',
          operation: 'heavy-processing'
        }
      }
    };

    const result = await api.createJob(conditionalTask);
    console.log('Conditional task created:', result);
    return result;
  } else {
    console.log('Insufficient workers for resource-intensive task');
    return { success: false, error: 'Insufficient workers' };
  }
}

// Example 6: Task with dynamic schedule
export async function addDynamicScheduleTask() {
  const currentHour = new Date().getHours();
  let schedule;
  
  if (currentHour < 9) {
    schedule = 'every 10 minutes'; // More frequent during off-hours
  } else if (currentHour < 17) {
    schedule = 'every 30 minutes'; // Less frequent during business hours
  } else {
    schedule = 'every 15 minutes'; // Moderate frequency in evening
  }

  const dynamicTask = {
    id: 'dynamic-schedule-task',
    name: 'Dynamic Schedule Task',
    description: 'Schedule adapts based on current time',
    schedule: schedule,
    command: 'health_check',
    priority: JobPriority.MEDIUM,
    metadata: {
      commandArgs: {
        service: 'api-server'
      }
    }
  };

  const result = await api.createJob(dynamicTask);
  console.log('Dynamic schedule task created:', result);
  return result;
}

// Example 7: Migration task with dependencies
export async function addMigrationTask() {
  const migrationTask = {
    id: 'data-migration-task',
    name: 'Data Migration Task',
    description: 'Migrates data after backup is complete',
    schedule: 'daily at 3 AM',
    command: 'data_sync',
    priority: JobPriority.HIGH,
    dependencies: ['backup-database'], // Depends on backup
    retryPolicy: {
      type: RetryPolicy.EXPONENTIAL,
      maxRetries: 3,
      delayMs: 5000
    },
    metadata: {
      commandArgs: {
        source: 'old-database',
        destination: 'new-database'
      }
    }
  };

  const result = await api.createJob(migrationTask);
  console.log('Migration task created:', result);
  return result;
}

// Example 8: One-time task (runs once then disables)
export async function addOneTimeTask() {
  const oneTimeTask = {
    id: 'one-time-setup',
    name: 'One-Time Setup Task',
    description: 'Runs once for initial setup',
    schedule: 'every 1 minutes', // Will run once then be disabled
    command: 'database_maintenance',
    priority: JobPriority.HIGH,
    enabled: true,
    metadata: {
      commandArgs: {
        operation: 'initialize',
        database: 'new-system'
      },
      isOneTime: true // Custom flag for one-time execution
    }
  };

  const result = await api.createJob(oneTimeTask);
  
  // Schedule to disable after first run
  setTimeout(async () => {
    await api.toggleJob(oneTimeTask.id, false);
    console.log('One-time task disabled after execution');
  }, 65000); // Disable after 65 seconds
  
  console.log('One-time task created:', result);
  return result;
}

// Utility function to demonstrate all examples
export async function demonstrateAllTaskTypes() {
  console.log('=== Adding Different Types of Tasks ===\n');
  
  try {
    await addSimpleTask();
    await addComplexTask();
    await addBatchTasks();
    await addCustomCommandTask();
    await addConditionalTask();
    await addDynamicScheduleTask();
    await addMigrationTask();
    await addOneTimeTask();
    
    console.log('\n=== All task types added successfully ===');
    
    // Show current jobs
    const allJobs = await api.getAllJobs();
    console.log(`\nTotal jobs now: ${allJobs.data.length}`);
    
  } catch (error) {
    console.error('Error adding tasks:', error);
  }
}

// Example usage:
// demonstrateAllTaskTypes();
