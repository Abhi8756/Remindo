# Distributed Job Scheduler

A comprehensive distributed job scheduling system built with React and JavaScript that can schedule, execute, and monitor jobs across multiple worker nodes.

## Features

### Core Features
- **Job Scheduling**: Cron-like scheduling with natural language support
- **Job Dependencies**: Support for job dependency chains
- **Priority Management**: High, Medium, Low priority job execution
- **Retry Logic**: Configurable retry policies (Fixed, Exponential backoff)
- **Worker Pool**: Distributed execution across multiple worker nodes
- **Real-time Monitoring**: Live job status and execution tracking
- **Persistent Storage**: In-memory job and execution history storage
- **RESTful API**: Complete API for job management

### Scheduling Features
- **Natural Language Scheduling**:
  - "every 5 minutes"
  - "daily at 3 AM"
  - "weekly on monday"
- **Standard Cron Format**: Traditional cron expression support
- **Dependency-based Execution**: Jobs wait for dependencies to complete
- **Automatic Retry**: Failed jobs retry based on configured policy

### Worker Management
- **Load Balancing**: Automatic worker selection based on capacity
- **Health Monitoring**: Worker health checks with heartbeat mechanism
- **Fault Tolerance**: Graceful handling of worker failures
- **Scalable Architecture**: Easy to add/remove worker nodes

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Job Scheduler  │    │  Worker Pool    │
│                 │    │                 │    │                 │
│ - Job Management│◄──►│ - Core Engine   │◄──►│ - Worker Nodes  │
│ - Status Monitor│    │ - API Layer     │    │ - Load Balancer │
│ - Execution View│    │ - Storage       │    │ - Health Check  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Command Registry│
                       │                 │
                       │ - Built-in Cmds │
                       │ - Custom Cmds   │
                       │ - Executors     │
                       └─────────────────┘
```

## Project Structure

```
src/
├── api/
│   └── JobSchedulerAPI.js          # RESTful API interface
├── components/
│   ├── JobSchedulerApp.jsx         # Main React component
│   └── JobSchedulerApp.css         # Styling
├── core/
│   └── JobScheduler.js             # Core scheduling engine
├── execution/
│   └── JobExecutor.js              # Job execution and worker management
├── storage/
│   └── JobStorage.js               # In-memory storage and dependencies
├── types/
│   └── JobTypes.js                 # Type definitions and constants
└── utils/
    └── ScheduleUtils.js            # Cron scheduling utilities
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Initial Setup
The system automatically initializes with sample jobs when started. These include:
- Database backup (daily at 2 AM)
- Log processing (every 15 minutes)
- Data synchronization (every 30 minutes)
- Cleanup tasks (daily at 1 AM)
- Report generation (daily at 6 AM with dependencies)

## Usage

### Creating Jobs

Jobs can be created through the API or UI with the following properties:

```javascript
{
  id: 'unique-job-id',
  name: 'Job Name',
  description: 'Job description',
  schedule: 'every 5 minutes',  // or cron expression
  command: 'command_name',
  priority: 'HIGH',             // HIGH, MEDIUM, LOW
  dependencies: ['job-id-1'],   // Array of job IDs
  retryPolicy: {
    type: 'FIXED',              // FIXED, EXPONENTIAL, NONE
    maxRetries: 3,
    delayMs: 1000
  },
  enabled: true,
  metadata: {
    commandArgs: {
      // Command-specific arguments
    }
  }
}
```

### Built-in Commands

The system includes several built-in commands:

- **echo**: Simple echo command
- **sleep**: Sleep for specified duration
- **calculate**: Basic arithmetic operations
- **api_call**: Simulate API calls
- **data_processing**: Simulate data processing
- **backup**: Simulate backup operations

### Custom Commands

Add custom commands to the executor:

```javascript
scheduler.registerCommand('custom_command', async (args) => {
  // Your custom logic here
  return 'Command result';
});
```

### API Usage

The system provides a comprehensive API:

```javascript
// Create job
const result = await api.createJob(jobData);

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

## Future Enhancements

### Planned Features
- [ ] Persistent database storage (PostgreSQL, MongoDB)
- [ ] Real distributed worker communication
- [ ] Job result persistence and history
- [ ] Advanced scheduling (timezone support, holidays)
- [ ] Job templates and workflows
- [ ] Email/Slack notifications
- [ ] Job performance analytics
- [ ] REST API documentation (OpenAPI)
- [ ] Authentication and authorization
- [ ] Job versioning and rollback
- [ ] Dynamic worker scaling
- [ ] Job queue prioritization
- [ ] Workflow orchestration
- [ ] Integration with external systems

### Technical Improvements
- [ ] TypeScript migration
- [ ] Unit and integration tests
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Security hardening
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Monitoring and alerting
- [ ] Documentation site

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For questions or issues, please create an issue in the repository.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
