/**
 * Job Scheduler System Demo
 * This file demonstrates the key features of the distributed job scheduler
 */

import { JobSchedulerAPI } from './src/api/JobSchedulerAPI.js';
import { JobPriority, RetryPolicy } from './src/types/JobTypes.js';

// Create API instance
const api = new JobSchedulerAPI();

async function demonstrateJobScheduler() {
  console.log('=== Distributed Job Scheduler Demo ===\n');

  try {
    // 1. Start the scheduler
    console.log('1. Starting scheduler...');
    const startResult = await api.start();
    console.log('   Result:', startResult.message);

    // 2. Create a sample job
    console.log('\n2. Creating a sample job...');
    const sampleJob = {
      id: 'demo-job',
      name: 'Demo Job',
      description: 'A demonstration job',
      schedule: 'every 2 minutes',
      command: 'echo',
      priority: JobPriority.HIGH,
      dependencies: [],
      retryPolicy: {
        type: RetryPolicy.FIXED,
        maxRetries: 2,
        delayMs: 1000
      },
      enabled: true,
      metadata: {
        commandArgs: {
          message: 'Hello from demo job!'
        }
      }
    };

    const createResult = await api.createJob(sampleJob);
    if (createResult.success) {
      console.log('   Job created successfully:', createResult.data.name);
    } else {
      console.log('   Error creating job:', createResult.error);
    }

    // 3. Execute job immediately
    console.log('\n3. Executing job immediately...');
    const executeResult = await api.executeJobNow('demo-job');
    if (executeResult.success) {
      console.log('   Job executed successfully');
      console.log('   Result:', executeResult.data.result);
      console.log('   Duration:', executeResult.data.getDuration() + 'ms');
    } else {
      console.log('   Error executing job:', executeResult.error);
    }

    // 4. Get all jobs
    console.log('\n4. Getting all jobs...');
    const jobsResult = await api.getAllJobs();
    if (jobsResult.success) {
      console.log(`   Found ${jobsResult.data.length} jobs:`);
      jobsResult.data.forEach(job => {
        console.log(`   - ${job.name} (${job.id}): ${job.enabled ? 'Enabled' : 'Disabled'}`);
      });
    }

    // 5. Get system status
    console.log('\n5. Getting system status...');
    const statusResult = await api.getSystemStatus();
    if (statusResult.success) {
      const status = statusResult.data;
      console.log('   Scheduler Status:', status.scheduler.isRunning ? 'Running' : 'Stopped');
      console.log('   Total Jobs:', status.jobs.totalJobs);
      console.log('   Enabled Jobs:', status.jobs.enabledJobs);
      console.log('   Total Workers:', status.workers.totalWorkers);
      console.log('   Healthy Workers:', status.workers.healthyWorkers);
      console.log('   Worker Utilization:', status.workers.utilizationRate.toFixed(1) + '%');
    }

    // 6. Get recent executions
    console.log('\n6. Getting recent executions...');
    const executionsResult = await api.getRecentExecutions(5);
    if (executionsResult.success) {
      console.log(`   Found ${executionsResult.data.length} recent executions:`);
      executionsResult.data.forEach(execution => {
        console.log(`   - ${execution.jobName}: ${execution.status} (${execution.assignedWorker || 'No worker'})`);
      });
    }

    // 7. Create a job with dependencies
    console.log('\n7. Creating job with dependencies...');
    const dependentJob = {
      id: 'dependent-job',
      name: 'Dependent Job',
      description: 'A job that depends on the demo job',
      schedule: 'every 5 minutes',
      command: 'data_processing',
      priority: JobPriority.MEDIUM,
      dependencies: ['demo-job'],
      retryPolicy: {
        type: RetryPolicy.EXPONENTIAL,
        maxRetries: 3,
        delayMs: 2000
      },
      enabled: true,
      metadata: {
        commandArgs: {
          dataset: 'demo-data',
          operation: 'process'
        }
      }
    };

    const dependentResult = await api.createJob(dependentJob);
    if (dependentResult.success) {
      console.log('   Dependent job created successfully');
      
      // Check if it can execute (should not, as demo-job needs to complete first)
      const statusCheck = await api.getJobStatus('dependent-job');
      if (statusCheck.success) {
        console.log('   Can execute immediately:', statusCheck.data.canExecute);
        console.log('   Dependencies satisfied:', statusCheck.data.dependencies.satisfied);
      }
    }

    // 8. Validate dependencies
    console.log('\n8. Validating dependencies...');
    const validationResult = await api.validateDependencies();
    if (validationResult.success) {
      console.log('   Dependency validation:', validationResult.data.isValid ? 'PASSED' : 'FAILED');
      if (validationResult.data.errors.length > 0) {
        validationResult.data.errors.forEach(error => {
          console.log('   Error:', error);
        });
      }
    }

    // 9. Test error handling
    console.log('\n9. Testing error handling...');
    const errorJob = {
      id: 'error-job',
      name: 'Error Job',
      description: 'A job that will fail to test retry logic',
      schedule: 'every 1 minutes',
      command: 'health_check',
      priority: JobPriority.LOW,
      dependencies: [],
      retryPolicy: {
        type: RetryPolicy.FIXED,
        maxRetries: 2,
        delayMs: 500
      },
      enabled: true,
      metadata: {
        commandArgs: {
          service: 'failing-service'
        }
      }
    };

    const errorResult = await api.createJob(errorJob);
    if (errorResult.success) {
      console.log('   Error job created for testing');
      
      // Try to execute it multiple times to see retry behavior
      for (let i = 0; i < 3; i++) {
        try {
          const execResult = await api.executeJobNow('error-job');
          if (execResult.success) {
            console.log(`   Attempt ${i + 1}: Success`);
            break;
          } else {
            console.log(`   Attempt ${i + 1}: Failed -`, execResult.error);
          }
        } catch (error) {
          console.log(`   Attempt ${i + 1}: Exception -`, error.message);
        }
      }
    }

    // 10. Get available commands
    console.log('\n10. Available commands:');
    const commandsResult = await api.getAvailableCommands();
    if (commandsResult.success) {
      console.log('   Commands:', commandsResult.data.join(', '));
    }

    console.log('\n=== Demo Complete ===');
    console.log('The scheduler is now running. Check the web interface at http://localhost:5173');
    console.log('Jobs will be executed according to their schedules.');

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demo
if (typeof window === 'undefined') {
  // Running in Node.js environment
  demonstrateJobScheduler();
} else {
  // Running in browser environment
  console.log('Demo can be run from the browser console');
  window.demonstrateJobScheduler = demonstrateJobScheduler;
}

export { demonstrateJobScheduler };
