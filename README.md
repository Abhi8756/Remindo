# Remindo - Job Scheduler

A simple tool to schedule and run tasks automatically. Think of it like setting reminders for your computer to do things at specific times.

## What Does This Do?

This app helps you:
- Schedule tasks to run automatically (like backups, reports, etc.)
- Set up tasks that depend on other tasks finishing first
- Monitor what's happening with your scheduled tasks
- See which tasks succeeded or failed

## Getting Started

### Step 1: Install and Run
1. Make sure you have Node.js installed on your computer
2. Download this project
3. Open a terminal/command prompt in the project folder
4. Type: `npm install` (this downloads what the app needs)
5. Type: `npm run dev` (this starts the app)
6. Open your web browser and go to: `http://localhost:5173`

### Step 2: Start the System
When you first open the app, you'll see a "Start Scheduler" button. Click it to begin.

## How to Use

### Main Screen
The app has three main sections:

**📋 Jobs Tab**
- Shows all your scheduled tasks
- Click "Execute" to run a task right now
- Use the toggle switch to turn tasks on/off

**🔄 Executions Tab**
- Shows what happened when tasks ran
- See if they succeeded or failed
- Check how long they took

**📊 System Status Tab**
- Shows if the system is running properly
- Displays worker information (the "computers" that run your tasks)

### Creating a New Task
The app comes with sample tasks already set up, like:
- Database backup (runs daily at 2 AM)
- Log processing (runs every 15 minutes)
- Data sync (runs every 30 minutes)
- Cleanup tasks (runs daily at 1 AM)
- Report generation (runs daily at 6 AM)

### Understanding Task Scheduling
You can schedule tasks using simple phrases:
- "every 5 minutes" - runs every 5 minutes
- "daily at 3 AM" - runs once per day at 3:00 AM
- "weekly on monday" - runs every Monday

### Task Dependencies
Some tasks need other tasks to finish first. For example:
- A report task might wait for data processing to complete
- A cleanup task might wait for backups to finish

### Priority Levels
Tasks have three priority levels:
- **High**: Runs first when system is busy
- **Medium**: Normal priority
- **Low**: Runs when system has free time

## What You'll See

### When Things Are Working
- Green indicators show healthy workers
- Tasks show "COMPLETED" status
- Execution times are displayed
- System status shows "Running"

### When Things Go Wrong
- Red indicators show problems
- Tasks show "FAILED" status
- The system will automatically retry failed tasks
- You can check the executions tab to see what went wrong

## Common Tasks

### Run a Task Immediately
1. Go to the Jobs tab
2. Find the task you want to run
3. Click the "Execute" button
4. Check the Executions tab to see the result

### Turn a Task On/Off
1. Go to the Jobs tab
2. Find the task you want to control
3. Click the toggle switch next to it

### Check System Health
1. Go to the System Status tab
2. Look for green indicators (good) or red indicators (problems)
3. Check that workers are "Healthy"

### View Task History
1. Go to the Executions tab
2. See all recent task runs
3. Check status, duration, and which worker ran it

## Troubleshooting

### If Tasks Aren't Running
- Make sure you clicked "Start Scheduler"
- Check that the task is enabled (toggle switch is on)
- Look for any error messages in the Executions tab

### If the System Seems Slow
- Check the System Status tab
- Look for unhealthy workers
- Try refreshing your browser

### If Something Isn't Working
- Refresh your browser page
- Check the System Status tab for problems
- Make sure the development server is still running

## Tips

- The system updates automatically every 5 seconds
- You can have multiple tasks running at the same time
- Tasks with dependencies will wait for their requirements to complete
- Failed tasks will automatically retry a few times before giving up
- The system can handle about 100 tasks per minute

## Need Help?

If you run into problems:
1. Check the System Status tab first
2. Look at the Executions tab for error messages
3. Try restarting the development server (`npm run dev`)
4. Refresh your browser

That's it! The system is designed to be simple and automatic once you set it up.

// Execute job immediately
const execution = await api.executeJobNow(jobId);

// Get job status
const status = await api.getJobStatus(jobId);

// Get system status
const systemStatus = await api.getSystemStatus();
```

## Scheduling Examples

### Natural Language
- `"every 5 minutes"` - Every 5 minutes
- `"every 30 minutes"` - Every 30 minutes
- `"daily at 3 AM"` - Daily at 3:00 AM
- `"daily at 6 PM"` - Daily at 6:00 PM
- `"weekly on monday"` - Every Monday at midnight

### Cron Format
- `"*/5 * * * *"` - Every 5 minutes
- `"0 3 * * *"` - Daily at 3:00 AM
- `"0 0 * * 1"` - Weekly on Monday

## Dependency Management

Jobs can depend on other jobs:

```javascript
{
  id: 'report-job',
  dependencies: ['data-sync-job', 'log-process-job'],
  // ... other properties
}
```

The system ensures:
- Dependencies complete successfully before execution
- Circular dependencies are detected and prevented
- Dependency validation on job creation

## Worker Pool Configuration

The system simulates a distributed worker pool:

```javascript
// Default worker configuration
const workers = [
  { id: 'worker-1', host: 'worker-node-1.local', capacity: 5 },
  { id: 'worker-2', host: 'worker-node-2.local', capacity: 8 },
  { id: 'worker-3', host: 'worker-node-3.local', capacity: 10 },
  { id: 'worker-4', host: 'worker-node-4.local', capacity: 6 }
];
```

## Monitoring and Alerts

The UI provides real-time monitoring:

### Jobs Tab
- View all jobs with their status
- Execute jobs manually
- Enable/disable jobs
- View job details and dependencies

### Executions Tab
- Recent execution history
- Status tracking
- Duration and performance metrics
- Worker assignment information

### System Status Tab
- Overall system health
- Worker pool status
- Job statistics
- Upcoming executions

## Error Handling and Retry Logic

### Retry Policies

1. **Fixed Retry**: Retry with fixed delay
   ```javascript
   {
     type: 'FIXED',
     maxRetries: 3,
     delayMs: 1000
   }
   ```

2. **Exponential Backoff**: Retry with exponentially increasing delay
   ```javascript
   {
     type: 'EXPONENTIAL',
     maxRetries: 5,
     delayMs: 1000,
     maxDelayMs: 300000
   }
   ```

3. **No Retry**: Fail immediately
   ```javascript
   {
     type: 'NONE',
     maxRetries: 0
   }
   ```

## Performance Considerations

### Scalability
- In-memory storage for development/testing
- Configurable worker capacity and load balancing
- Efficient dependency resolution
- Minimal overhead scheduling checks

### Production Considerations
- Replace in-memory storage with persistent database
- Implement actual distributed worker communication
- Add authentication and authorization
- Implement proper logging and monitoring
- Add job result persistence

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```


