# How to Add Tasks to the Job Scheduler

This guide shows you all the different ways to add tasks to the distributed job scheduler system.

## 1. Using the Web Interface (Easiest)

### Steps:
1. Open the application at `http://localhost:5173`
2. Go to the **Jobs** tab
3. Click the **"+ Create Job"** button
4. Fill in the form:
   - **Job ID**: Unique identifier (e.g., "my-task-1")
   - **Job Name**: Human-readable name
   - **Description**: Optional description
   - **Schedule**: When to run (e.g., "every 5 minutes", "daily at 3 AM")
   - **Command**: What to execute (select from dropdown)
   - **Priority**: HIGH, MEDIUM, or LOW
   - **Max Retries**: How many times to retry on failure
   - **Retry Delay**: Delay between retries in milliseconds
5. Click **"Create Job"**

### Available Commands:
- `echo` - Simple echo command
- `sleep` - Sleep for specified duration
- `calculate` - Basic arithmetic operations
- `api_call` - Simulate API calls
- `data_processing` - Data processing simulation
- `backup` - Backup operations
- `cleanup` - Cleanup operations
- `health_check` - System health checks
- `database_maintenance` - Database operations
- `report_generation` - Report generation

### Schedule Examples:
- `"every 5 minutes"` - Every 5 minutes
- `"every 30 minutes"` - Every 30 minutes
- `"daily at 3 AM"` - Daily at 3:00 AM
- `"daily at 6 PM"` - Daily at 6:00 PM
- `"weekly on monday"` - Every Monday at midnight
- `"0 */2 * * *"` - Every 2 hours (cron format)

## 2. Using the API Programmatically

### Basic Example:
```javascript
import { JobSchedulerAPI } from './src/api/JobSchedulerAPI.js';
import { JobPriority, RetryPolicy } from './src/types/JobTypes.js';

const api = new JobSchedulerAPI();

const newTask = {
  id: 'my-custom-task',
  name: 'My Custom Task',
  description: 'A task I created programmatically',
  schedule: 'every 10 minutes',
  command: 'echo',
  priority: JobPriority.HIGH,
  dependencies: [], // Optional: depends on other jobs
  retryPolicy: {
    type: RetryPolicy.FIXED,
    maxRetries: 3,
    delayMs: 1000
  },
  enabled: true,
  metadata: {
    commandArgs: {
      message: 'Hello from my custom task!'
    }
  }
};

// Create the task
const result = await api.createJob(newTask);
if (result.success) {
  console.log('Task created successfully!');
} else {
  console.error('Error:', result.error);
}
```

### Advanced Example with Dependencies:
```javascript
const advancedTask = {
  id: 'advanced-task',
  name: 'Advanced Task',
  description: 'Task that depends on other jobs',
  schedule: 'daily at 5 AM',
  command: 'data_processing',
  priority: JobPriority.HIGH,
  dependencies: ['backup-database', 'sync-data'], // Wait for these to complete
  retryPolicy: {
    type: RetryPolicy.EXPONENTIAL,
    maxRetries: 5,
    delayMs: 2000
  },
  metadata: {
    commandArgs: {
      dataset: 'customer-data',
      operation: 'analyze'
    }
  }
};

await api.createJob(advancedTask);
```

## 3. Using Browser Console

1. Open the application at `http://localhost:5173`
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Paste and run this code:

```javascript
// Create a task from console
const consoleTask = {
  id: 'console-task-' + Date.now(),
  name: 'Console Task',
  schedule: 'every 3 minutes',
  command: 'health_check',
  metadata: {
    commandArgs: {
      service: 'web-server'
    }
  }
};

// Assuming the API is accessible (you may need to import it)
api.createJob(consoleTask).then(result => {
  console.log('Task created from console:', result);
});
```

## 4. Task Schema Reference

### Required Fields:
- `id` (string): Unique identifier
- `name` (string): Human-readable name
- `schedule` (string): When to run the task
- `command` (string): What command to execute

### Optional Fields:
- `description` (string): Task description
- `priority` (string): 'HIGH', 'MEDIUM', or 'LOW'
- `dependencies` (array): Array of job IDs this task depends on
- `retryPolicy` (object): Retry configuration
- `enabled` (boolean): Whether the task is active
- `metadata` (object): Additional configuration

### Retry Policy Options:
```javascript
{
  type: 'FIXED',        // or 'EXPONENTIAL', 'NONE'
  maxRetries: 3,        // Maximum retry attempts
  delayMs: 1000,        // Delay between retries
  maxDelayMs: 300000    // Maximum delay for exponential backoff
}
```

## 5. Schedule Formats

### Natural Language (Recommended):
- `"every X minutes"` - Every X minutes
- `"every X hours"` - Every X hours
- `"daily at X AM/PM"` - Daily at specific time
- `"weekly on monday"` - Weekly on specific day

### Cron Format:
- `"*/5 * * * *"` - Every 5 minutes
- `"0 */2 * * *"` - Every 2 hours
- `"0 9 * * *"` - Daily at 9 AM
- `"0 0 * * 1"` - Weekly on Monday

## 6. Dependencies

Tasks can depend on other tasks:

```javascript
{
  id: 'report-task',
  name: 'Generate Report',
  dependencies: ['data-backup', 'data-sync'], // These must complete first
  schedule: 'daily at 6 AM',
  command: 'report_generation'
}
```

### Dependency Rules:
- Dependencies must complete successfully within the last 24 hours
- Circular dependencies are automatically detected and prevented
- Tasks wait in "WAITING_FOR_DEPENDENCIES" status until ready

## 7. Custom Commands

You can register custom commands:

```javascript
// Register a custom command
await api.registerCommand('my_custom_command', async (args) => {
  // Your custom logic here
  const { param1, param2 } = args;
  // Do something with the parameters
  return 'Custom command completed';
});

// Use the custom command in a task
const taskWithCustomCommand = {
  id: 'custom-command-task',
  name: 'Custom Command Task',
  schedule: 'every 15 minutes',
  command: 'my_custom_command',
  metadata: {
    commandArgs: {
      param1: 'value1',
      param2: 'value2'
    }
  }
};

await api.createJob(taskWithCustomCommand);
```

## 8. Task Management

### Get All Tasks:
```javascript
const allTasks = await api.getAllJobs();
console.log(allTasks.data);
```

### Get Task Status:
```javascript
const status = await api.getJobStatus('my-task-id');
console.log(status.data);
```

### Execute Task Immediately:
```javascript
const execution = await api.executeJobNow('my-task-id');
console.log(execution.data);
```

### Enable/Disable Task:
```javascript
await api.toggleJob('my-task-id', false); // Disable
await api.toggleJob('my-task-id', true);  // Enable
```

### Delete Task:
```javascript
await api.deleteJob('my-task-id');
```

## 9. Best Practices

### Task Naming:
- Use descriptive IDs: `backup-database` instead of `task1`
- Use clear names: `"Database Backup"` instead of `"Task"`

### Scheduling:
- Use natural language for readability
- Consider system load when scheduling frequent tasks
- Spread tasks across different times to avoid conflicts

### Dependencies:
- Keep dependency chains simple
- Avoid deep dependency hierarchies
- Test dependency relationships before production

### Error Handling:
- Set appropriate retry policies
- Use exponential backoff for external API calls
- Set reasonable retry limits

### Resource Management:
- Consider task duration when setting schedules
- Use appropriate priorities for different task types
- Monitor worker utilization

## 10. Examples

See the `examples/` folder for complete examples:
- `add-tasks-examples.js` - Programmatic task creation
- `console-examples.js` - Browser console examples

## 11. Troubleshooting

### Common Issues:
- **Task not running**: Check if it's enabled and dependencies are satisfied
- **Dependency errors**: Verify all dependency jobs exist and are enabled
- **Schedule errors**: Check schedule format and syntax
- **Command errors**: Ensure the command exists and is registered

### Debug Commands:
```javascript
// Check system status
await api.getSystemStatus();

// Validate dependencies
await api.validateDependencies();

// Check available commands
await api.getAvailableCommands();

// Get recent executions
await api.getRecentExecutions(10);
```

This comprehensive guide should help you add tasks to the job scheduler in any way that suits your needs!
