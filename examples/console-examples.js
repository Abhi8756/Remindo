/**
 * Browser Console Examples for Adding Tasks
 * Copy and paste these examples into your browser console at http://localhost:5173
 */

// First, get the API instance (assuming the app is running)
// You can access the API through the React component or create a new instance

// Example 1: Quick task creation
const quickTask = {
  id: 'console-task-' + Date.now(),
  name: 'Console Created Task',
  schedule: 'every 2 minutes',
  command: 'echo',
  metadata: {
    commandArgs: {
      message: 'Created from console!'
    }
  }
};

// To create the task (paste this in browser console):
/*
// Get the API instance from the React app
const api = window.jobSchedulerAPI; // If exposed globally

// Or create a new instance
import { JobSchedulerAPI } from './src/api/JobSchedulerAPI.js';
const api = new JobSchedulerAPI();

// Create the task
api.createJob(quickTask).then(result => {
  console.log('Task created:', result);
});
*/

// Example 2: Interactive task creation
/*
const interactiveTask = {
  id: prompt('Enter task ID:'),
  name: prompt('Enter task name:'),
  schedule: prompt('Enter schedule (e.g., "every 5 minutes"):'),
  command: prompt('Enter command (echo, sleep, calculate, etc.):'),
  metadata: {
    commandArgs: {
      message: prompt('Enter message for echo command:') || 'Hello!'
    }
  }
};

api.createJob(interactiveTask).then(result => {
  if (result.success) {
    console.log('Interactive task created successfully!');
  } else {
    console.error('Error creating task:', result.error);
  }
});
*/

// Example 3: Multiple tasks at once
/*
const bulkTasks = [
  {
    id: 'bulk-1',
    name: 'Bulk Task 1',
    schedule: 'every 3 minutes',
    command: 'health_check'
  },
  {
    id: 'bulk-2',
    name: 'Bulk Task 2',
    schedule: 'every 5 minutes',
    command: 'data_processing'
  },
  {
    id: 'bulk-3',
    name: 'Bulk Task 3',
    schedule: 'every 10 minutes',
    command: 'cleanup'
  }
];

Promise.all(bulkTasks.map(task => api.createJob(task)))
  .then(results => {
    console.log('Bulk tasks created:', results);
  });
*/

// Example 4: Task with specific timing
/*
const timedTask = {
  id: 'timed-task',
  name: 'Timed Task',
  schedule: 'daily at 9 AM',
  command: 'report_generation',
  priority: 'HIGH',
  metadata: {
    commandArgs: {
      type: 'daily',
      format: 'pdf'
    }
  }
};

api.createJob(timedTask).then(result => {
  console.log('Timed task created:', result);
});
*/

export const consoleExamples = {
  quickTask,
  // Add more examples as needed
};
