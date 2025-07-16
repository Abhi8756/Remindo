import React, { useState, useEffect, useCallback } from 'react';
import { JobSchedulerAPI, initializeSampleJobs } from '../api/JobSchedulerAPI.js';
import { JobPriority, JobStatus, RetryPolicy } from '../types/JobTypes.js';
import './JobSchedulerApp.css';

const JobSchedulerApp = () => {
  const [api] = useState(new JobSchedulerAPI());
  const [jobs, setJobs] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newJob, setNewJob] = useState({
    id: '',
    name: '',
    description: '',
    schedule: '',
    command: '',
    priority: JobPriority.MEDIUM,
    dependencies: [],
    retryPolicy: {
      type: RetryPolicy.FIXED,
      maxRetries: 3,
      delayMs: 1000
    },
    enabled: true,
    metadata: {
      commandArgs: {}
    }
  });

  const fetchData = useCallback(async () => {
    try {
      const [jobsResult, executionsResult, statusResult] = await Promise.all([
        api.getAllJobs(),
        api.getRecentExecutions(20),
        api.getSystemStatus()
      ]);

      if (jobsResult.success) setJobs(jobsResult.data);
      if (executionsResult.success) setExecutions(executionsResult.data);
      if (statusResult.success) setSystemStatus(statusResult.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [api]);

  const initializeData = useCallback(async () => {
    try {
      await api.start();
      await initializeSampleJobs(api);
      await fetchData();
    } catch (error) {
      console.error('Failed to initialize:', error);
      setError('Failed to initialize scheduler');
    }
  }, [api, fetchData]);

  useEffect(() => {
    initializeData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [initializeData, fetchData]);

  const handleExecuteJob = async (jobId) => {
    setIsLoading(true);
    try {
      const result = await api.executeJobNow(jobId);
      if (result.success) {
        await fetchData();
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleJob = async (jobId, enabled) => {
    try {
      const result = await api.toggleJob(jobId, enabled);
      if (result.success) {
        await fetchData();
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateJob = async () => {
    setIsLoading(true);
    try {
      const result = await api.createJob(newJob);
      if (result.success) {
        await fetchData();
        setShowCreateForm(false);
        setNewJob({
          id: '',
          name: '',
          description: '',
          schedule: '',
          command: '',
          priority: JobPriority.MEDIUM,
          dependencies: [],
          retryPolicy: {
            type: RetryPolicy.FIXED,
            maxRetries: 3,
            delayMs: 1000
          },
          enabled: true,
          metadata: {
            commandArgs: {}
          }
        });
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case JobPriority.HIGH: return '#ff4444';
      case JobPriority.MEDIUM: return '#ffaa00';
      case JobPriority.LOW: return '#44aa44';
      default: return '#666666';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case JobStatus.COMPLETED: return '#44aa44';
      case JobStatus.RUNNING: return '#0066cc';
      case JobStatus.FAILED: return '#ff4444';
      case JobStatus.PENDING: return '#ffaa00';
      case JobStatus.WAITING_FOR_DEPENDENCIES: return '#aa44aa';
      case JobStatus.RETRYING: return '#ff8800';
      default: return '#666666';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '-';
    const duration = new Date(endTime) - new Date(startTime);
    return `${Math.round(duration / 1000)}s`;
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const JobsTab = () => (
    <div className="jobs-tab">
      <div className="jobs-header">
        <h3>📋 Jobs ({jobs.length})</h3>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={fetchData}
            disabled={isLoading}
            aria-label="Refresh jobs"
          >
            {isLoading ? <div className="loading-spinner"></div> : '🔄'} Refresh
          </button>
          <button 
            className="create-job-btn"
            onClick={() => setShowCreateForm(true)}
            aria-label="Create new job"
          >
            ✨ Create Job
          </button>
        </div>
      </div>
      
      {/* Demo Instructions */}
      <div className="demo-instructions">
        <div className="demo-card">
          <h4>🚀 How to Use the Job Scheduler</h4>
          <div className="demo-steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <strong>Sample Jobs Created:</strong> The system has pre-loaded sample jobs including database backups, log processing, and health checks.
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <strong>Execute Jobs:</strong> Click the "▶️ Execute" button on any job card to run it immediately and see it in action.
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <strong>Monitor Progress:</strong> Check the "🔄 Executions" tab to see job execution history and status.
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <strong>View System Status:</strong> The "📊 System Status" tab shows worker health and system performance.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="jobs-grid">
        {jobs.map(job => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <h4>{job.name}</h4>
              <span 
                className="priority-badge"
                style={{ backgroundColor: getPriorityColor(job.priority) }}
              >
                {job.priority}
              </span>
            </div>
            
            <div className="job-details">
              <div className="job-detail-item">
                <span className="job-detail-label">📅 Schedule:</span>
                <span className="job-detail-value">{job.schedule}</span>
              </div>
              <div className="job-detail-item">
                <span className="job-detail-label">⚡ Command:</span>
                <span className="job-detail-value">{job.command}</span>
              </div>
              <div className="job-detail-item">
                <span className="job-detail-label">🔗 Dependencies:</span>
                <span className="job-detail-value">{job.dependencies.length > 0 ? job.dependencies.join(', ') : 'None'}</span>
              </div>
              <div className="job-detail-item">
                <span className="job-detail-label">📊 Status:</span>
                <span className="job-detail-value">{job.enabled ? '🟢 Enabled' : '🔴 Disabled'}</span>
              </div>
            </div>
            
            <div className="job-actions">
              <button 
                className="execute-btn"
                onClick={() => handleExecuteJob(job.id)}
                disabled={isLoading || !job.enabled}
                aria-label={`Execute job ${job.name}`}
              >
                {isLoading ? <div className="loading-spinner"></div> : '▶️'} Execute
              </button>
              <button 
                className={`toggle-btn ${job.enabled ? 'enabled' : 'disabled'}`}
                onClick={() => handleToggleJob(job.id, !job.enabled)}
                aria-label={job.enabled ? `Disable job ${job.name}` : `Enable job ${job.name}`}
              >
                {job.enabled ? '⏸️ Disable' : '▶️ Enable'}
              </button>
              <button 
                className="details-btn"
                onClick={() => setSelectedJob(job)}
                aria-label={`View details for job ${job.name}`}
              >
                🔍 Details
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {jobs.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No jobs found</h3>
          <p>Create your first job to get started with task scheduling</p>
          <button 
            className="create-job-btn"
            onClick={() => setShowCreateForm(true)}
          >
            ✨ Create Your First Job
          </button>
        </div>
      )}
    </div>
  );

  const ExecutionsTab = () => (
    <div className="executions-tab">
      <div className="executions-header">
        <h3>🔄 Recent Executions ({executions.length})</h3>
        <button 
          className="refresh-btn"
          onClick={fetchData}
          disabled={isLoading}
          aria-label="Refresh executions"
        >
          {isLoading ? <div className="loading-spinner"></div> : '🔄'} Refresh
        </button>
      </div>
      
      <div className="executions-table">
        <table>
          <thead>
            <tr>
              <th>📋 Job Name</th>
              <th>📊 Status</th>
              <th>📅 Scheduled</th>
              <th>⏰ Started</th>
              <th>⏱️ Duration</th>
              <th>👷 Worker</th>
              <th>🔁 Retries</th>
            </tr>
          </thead>
          <tbody>
            {executions.map(execution => (
              <tr key={execution.id}>
                <td>{execution.jobName}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(execution.status) }}
                  >
                    {execution.status}
                  </span>
                </td>
                <td>{formatDate(execution.scheduledTime)}</td>
                <td>{execution.startTime ? formatDate(execution.startTime) : '-'}</td>
                <td>{formatDuration(execution.startTime, execution.endTime)}</td>
                <td>{execution.assignedWorker || '-'}</td>
                <td>{execution.retryCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {executions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔄</div>
          <h3>No executions yet</h3>
          <p>Job executions will appear here once jobs start running</p>
        </div>
      )}
    </div>
  );

  const SystemStatusTab = () => (
    <div className="system-status-tab">
      <h3>📊 System Status Overview</h3>
      
      {/* System Architecture Info */}
      <div className="system-info">
        <div className="info-card">
          <h4>🏗️ System Architecture</h4>
          <p>This is a <strong>distributed job scheduler</strong> that simulates a real-world system with:</p>
          <ul>
            <li>🔄 <strong>Job Scheduler:</strong> Central coordinator that manages job execution</li>
            <li>👷 <strong>Worker Nodes:</strong> Distributed workers that execute jobs</li>
            <li>📦 <strong>Job Storage:</strong> In-memory storage for jobs and execution history</li>
            <li>🔗 <strong>Dependency Manager:</strong> Handles job dependencies and execution order</li>
            <li>⏰ <strong>Schedule Manager:</strong> Manages cron-like scheduling</li>
          </ul>
        </div>
        
        <div className="info-card">
          <h4>🚀 How It Works</h4>
          <p>The scheduler continuously:</p>
          <ul>
            <li>📅 Checks for jobs that need to be executed based on their schedule</li>
            <li>🔍 Validates job dependencies before execution</li>
            <li>🎯 Selects the best available worker for each job</li>
            <li>▶️ Executes jobs and tracks their progress</li>
            <li>🔄 Handles retries for failed jobs</li>
            <li>💚 Monitors worker health and availability</li>
          </ul>
        </div>
      </div>
      
      {systemStatus && (
        <div className="status-grid">
          <div className="status-card">
            <h4>⚙️ Scheduler</h4>
            <p>
              <strong>Status:</strong> 
              <span className="status-value">{systemStatus.scheduler.isRunning ? '🟢 Running' : '🔴 Stopped'}</span>
            </p>
            <p>
              <strong>Uptime:</strong> 
              <span className="status-value">{systemStatus.scheduler.isRunning ? formatUptime(systemStatus.scheduler.uptime) : 'N/A'}</span>
            </p>
          </div>
          
          <div className="status-card">
            <h4>📋 Jobs</h4>
            <p>
              <strong>Total Jobs:</strong> 
              <span className="status-value">{systemStatus.jobs.totalJobs}</span>
            </p>
            <p>
              <strong>Enabled:</strong> 
              <span className="status-value">{systemStatus.jobs.enabledJobs}</span>
            </p>
            <p>
              <strong>🔴 High Priority:</strong> 
              <span className="status-value">{systemStatus.jobs.jobsByPriority.HIGH}</span>
            </p>
            <p>
              <strong>🟡 Medium Priority:</strong> 
              <span className="status-value">{systemStatus.jobs.jobsByPriority.MEDIUM}</span>
            </p>
            <p>
              <strong>🟢 Low Priority:</strong> 
              <span className="status-value">{systemStatus.jobs.jobsByPriority.LOW}</span>
            </p>
          </div>
          
          <div className="status-card">
            <h4>🔄 Executions</h4>
            <p>
              <strong>Total Executions:</strong> 
              <span className="status-value">{systemStatus.jobs.totalExecutions}</span>
            </p>
            <p>
              <strong>✅ Completed:</strong> 
              <span className="status-value">{systemStatus.jobs.executionsByStatus.COMPLETED}</span>
            </p>
            <p>
              <strong>❌ Failed:</strong> 
              <span className="status-value">{systemStatus.jobs.executionsByStatus.FAILED}</span>
            </p>
            <p>
              <strong>🔄 Running:</strong> 
              <span className="status-value">{systemStatus.jobs.executionsByStatus.RUNNING}</span>
            </p>
            <p>
              <strong>⏳ Pending:</strong> 
              <span className="status-value">{systemStatus.jobs.executionsByStatus.PENDING}</span>
            </p>
          </div>
          
          <div className="status-card">
            <h4>👷 Workers</h4>
            <p>
              <strong>Total Workers:</strong> 
              <span className="status-value">{systemStatus.workers.totalWorkers}</span>
            </p>
            <p>
              <strong>💚 Healthy:</strong> 
              <span className="status-value">{systemStatus.workers.healthyWorkers}</span>
            </p>
            <p>
              <strong>🏭 Capacity:</strong> 
              <span className="status-value">{systemStatus.workers.totalCapacity}</span>
            </p>
            <p>
              <strong>📈 Load:</strong> 
              <span className="status-value">{systemStatus.workers.totalLoad}</span>
            </p>
            <p>
              <strong>📊 Utilization:</strong> 
              <span className="status-value">{systemStatus.workers.utilizationRate.toFixed(1)}%</span>
            </p>
          </div>
          
          {systemStatus.workers.workerDetails && (
            <div className="status-card worker-details">
              <h4>🖥️ Worker Details</h4>
              <div className="worker-list">
                {systemStatus.workers.workerDetails.map(worker => (
                  <div key={worker.id} className="worker-item">
                    <div className="worker-info">
                      <strong>{worker.id}</strong>
                      <span className={`worker-status ${worker.status.toLowerCase()}`}>
                        {worker.status === 'HEALTHY' ? '💚' : '❌'} {worker.status}
                      </span>
                    </div>
                    <div className="worker-stats">
                      <small>Load: {worker.currentLoad}/{worker.capacity} ({worker.utilizationRate.toFixed(1)}%)</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {systemStatus && systemStatus.nextExecutions && (
        <div className="next-executions">
          <h4>⏰ Next Scheduled Executions</h4>
          <table>
            <thead>
              <tr>
                <th>📋 Job ID</th>
                <th>⏰ Next Execution</th>
                <th>📅 Schedule</th>
              </tr>
            </thead>
            <tbody>
              {systemStatus.nextExecutions.map(item => (
                <tr key={item.jobId}>
                  <td>{item.jobId}</td>
                  <td>{formatDate(item.nextExecution)}</td>
                  <td>{item.expression}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {!systemStatus && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Loading system status...</h3>
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );

  const JobDetailsModal = ({ job, onClose }) => {
    const [jobStatus, setJobStatus] = useState(null);
    
    useEffect(() => {
      if (job) {
        api.getJobStatus(job.id).then(result => {
          if (result.success) {
            setJobStatus(result.data);
          }
        });
      }
    }, [job]);

    if (!job) return null;

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>🔍 {job.name}</h3>
            <button className="close-btn" onClick={onClose} aria-label="Close modal">×</button>
          </div>
          
          <div className="modal-body">
            <div className="job-info">
              <h4>📋 Job Information</h4>
              <p><strong>ID:</strong> <span>{job.id}</span></p>
              <p><strong>Description:</strong> <span>{job.description || 'No description'}</span></p>
              <p><strong>Schedule:</strong> <span>{job.schedule}</span></p>
              <p><strong>Command:</strong> <span>{job.command}</span></p>
              <p><strong>Priority:</strong> <span>{job.priority}</span></p>
              <p><strong>Dependencies:</strong> <span>{job.dependencies.length > 0 ? job.dependencies.join(', ') : 'None'}</span></p>
              <p><strong>Enabled:</strong> <span>{job.enabled ? '✅ Yes' : '❌ No'}</span></p>
              <p><strong>Max Retries:</strong> <span>{job.retryPolicy.maxRetries}</span></p>
              <p><strong>Retry Delay:</strong> <span>{job.retryPolicy.delayMs}ms</span></p>
            </div>
            
            {jobStatus && (
              <div className="job-status">
                <h4>📊 Current Status</h4>
                <p><strong>Next Execution:</strong> <span>{jobStatus.nextExecution ? formatDate(jobStatus.nextExecution) : 'Not scheduled'}</span></p>
                <p><strong>Can Execute:</strong> <span>{jobStatus.canExecute ? '✅ Yes' : '❌ No'}</span></p>
                <p><strong>Dependencies Satisfied:</strong> <span>{jobStatus.dependencies.satisfied ? '✅ Yes' : '❌ No'}</span></p>
              </div>
            )}
            
            {jobStatus && jobStatus.recentExecutions && (
              <div className="recent-executions">
                <h4>🔄 Recent Executions</h4>
                <table>
                  <thead>
                    <tr>
                      <th>📊 Status</th>
                      <th>📅 Scheduled</th>
                      <th>⏱️ Duration</th>
                      <th>👷 Worker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobStatus.recentExecutions.map(execution => (
                      <tr key={execution.id}>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(execution.status) }}
                          >
                            {execution.status}
                          </span>
                        </td>
                        <td>{formatDate(execution.scheduledTime)}</td>
                        <td>{formatDuration(execution.startTime, execution.endTime)}</td>
                        <td>{execution.assignedWorker || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CreateJobForm = () => (
    <div className="create-job-form">
      <div className="form-grid">
        <div className="form-group">
          <label>🆔 Job ID *</label>
          <input
            type="text"
            value={newJob.id}
            onChange={(e) => setNewJob({...newJob, id: e.target.value})}
            placeholder="unique-job-id"
            required
          />
        </div>
        <div className="form-group">
          <label>📝 Job Name *</label>
          <input
            type="text"
            value={newJob.name}
            onChange={(e) => setNewJob({...newJob, name: e.target.value})}
            placeholder="My Awesome Job"
            required
          />
        </div>
        <div className="form-group">
          <label>📄 Description</label>
          <textarea
            value={newJob.description}
            onChange={(e) => setNewJob({...newJob, description: e.target.value})}
            placeholder="Describe what this job does..."
            rows="3"
          />
        </div>
        <div className="form-group">
          <label>📅 Schedule *</label>
          <input
            type="text"
            value={newJob.schedule}
            onChange={(e) => setNewJob({...newJob, schedule: e.target.value})}
            placeholder="every 5 minutes, daily at 3 AM, etc."
            required
          />
        </div>
        <div className="form-group">
          <label>⚡ Command *</label>
          <select
            value={newJob.command}
            onChange={(e) => setNewJob({...newJob, command: e.target.value})}
            required
          >
            <option value="">Select command type</option>
            <option value="echo">🔊 Echo</option>
            <option value="sleep">😴 Sleep</option>
            <option value="calculate">🧮 Calculate</option>
            <option value="api_call">🌐 API Call</option>
            <option value="data_processing">📊 Data Processing</option>
            <option value="backup">💾 Backup</option>
            <option value="cleanup">🧹 Cleanup</option>
            <option value="health_check">🏥 Health Check</option>
            <option value="database_maintenance">🗄️ Database Maintenance</option>
            <option value="report_generation">📈 Report Generation</option>
          </select>
        </div>
        <div className="form-group">
          <label>🎯 Priority</label>
          <select
            value={newJob.priority}
            onChange={(e) => setNewJob({...newJob, priority: e.target.value})}
          >
            <option value={JobPriority.HIGH}>🔴 High</option>
            <option value={JobPriority.MEDIUM}>🟡 Medium</option>
            <option value={JobPriority.LOW}>🟢 Low</option>
          </select>
        </div>
        <div className="form-group">
          <label>🔁 Max Retries</label>
          <input
            type="number"
            value={newJob.retryPolicy.maxRetries}
            onChange={(e) => setNewJob({
              ...newJob,
              retryPolicy: {
                ...newJob.retryPolicy,
                maxRetries: parseInt(e.target.value)
              }
            })}
            min="0"
            max="10"
          />
        </div>
        <div className="form-group">
          <label>⏱️ Retry Delay (ms)</label>
          <input
            type="number"
            value={newJob.retryPolicy.delayMs}
            onChange={(e) => setNewJob({
              ...newJob,
              retryPolicy: {
                ...newJob.retryPolicy,
                delayMs: parseInt(e.target.value)
              }
            })}
            min="100"
            step="100"
          />
        </div>
      </div>
      <div className="form-actions">
        <button 
          className="cancel-btn" 
          onClick={() => setShowCreateForm(false)}
        >
          ❌ Cancel
        </button>
        <button 
          className="create-btn" 
          onClick={handleCreateJob}
          disabled={isLoading || !newJob.id || !newJob.name || !newJob.schedule || !newJob.command}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner"></div>
              <span className="loading-text">Creating...</span>
            </>
          ) : (
            '✨ Create Job'
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="job-scheduler-app">
      <header className="app-header">
        <div className="app-header-content">
          <div>
            <h1>🚀 Distributed Job Scheduler</h1>
            <div className="subtitle">Modern, scalable job management system</div>
          </div>
          <div className="header-status">
            <span className={`status-indicator ${systemStatus?.scheduler?.isRunning ? 'running' : 'stopped'}`}>
              {systemStatus?.scheduler?.isRunning ? '🟢 Running' : '🔴 Stopped'}
            </span>
            {systemStatus && (
              <div className="system-stats">
                <div className="stat-item">
                  <div className="stat-value">{systemStatus.jobs.totalJobs}</div>
                  <div className="stat-label">Jobs</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{systemStatus.workers.totalWorkers}</div>
                  <div className="stat-label">Workers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{systemStatus.workers.utilizationRate.toFixed(1)}%</div>
                  <div className="stat-label">Utilization</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} aria-label="Close error">×</button>
          </div>
        )}

        <nav className="tab-nav">
          <button 
            className={activeTab === 'jobs' ? 'active' : ''}
            onClick={() => setActiveTab('jobs')}
          >
            📋 Jobs
          </button>
          <button 
            className={activeTab === 'executions' ? 'active' : ''}
            onClick={() => setActiveTab('executions')}
          >
            🔄 Executions
          </button>
          <button 
            className={activeTab === 'status' ? 'active' : ''}
            onClick={() => setActiveTab('status')}
          >
            📊 System Status
          </button>
        </nav>

        <main className="app-main">
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'executions' && <ExecutionsTab />}
          {activeTab === 'status' && <SystemStatusTab />}
        </main>
      </div>

      <JobDetailsModal 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✨ Create New Job</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)} aria-label="Close modal">×</button>
            </div>
            
            <div className="modal-body">
              <CreateJobForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSchedulerApp;
