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

  const JobsTab = () => (
    <div className="jobs-tab">
      <div className="jobs-header">
        <h3>Jobs ({jobs.length})</h3>
        <div className="header-actions">
          <button 
            className="create-job-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create Job
          </button>
          <button 
            className="refresh-btn"
            onClick={fetchData}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {showCreateForm && <CreateJobForm />}
      
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
              <p><strong>Schedule:</strong> {job.schedule}</p>
              <p><strong>Command:</strong> {job.command}</p>
              <p><strong>Dependencies:</strong> {job.dependencies.length > 0 ? job.dependencies.join(', ') : 'None'}</p>
              <p><strong>Status:</strong> {job.enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            
            <div className="job-actions">
              <button 
                className="execute-btn"
                onClick={() => handleExecuteJob(job.id)}
                disabled={isLoading || !job.enabled}
              >
                Execute Now
              </button>
              <button 
                className={`toggle-btn ${job.enabled ? 'enabled' : 'disabled'}`}
                onClick={() => handleToggleJob(job.id, !job.enabled)}
              >
                {job.enabled ? 'Disable' : 'Enable'}
              </button>
              <button 
                className="details-btn"
                onClick={() => setSelectedJob(job)}
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ExecutionsTab = () => (
    <div className="executions-tab">
      <div className="executions-header">
        <h3>Recent Executions ({executions.length})</h3>
        <button 
          className="refresh-btn"
          onClick={fetchData}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>
      
      <div className="executions-table">
        <table>
          <thead>
            <tr>
              <th>Job Name</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Started</th>
              <th>Duration</th>
              <th>Worker</th>
              <th>Retries</th>
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
    </div>
  );

  const SystemStatusTab = () => (
    <div className="system-status-tab">
      <h3>System Status</h3>
      
      {systemStatus && (
        <div className="status-grid">
          <div className="status-card">
            <h4>Scheduler</h4>
            <p><strong>Status:</strong> {systemStatus.scheduler.isRunning ? 'Running' : 'Stopped'}</p>
          </div>
          
          <div className="status-card">
            <h4>Jobs</h4>
            <p><strong>Total:</strong> {systemStatus.jobs.totalJobs}</p>
            <p><strong>Enabled:</strong> {systemStatus.jobs.enabledJobs}</p>
            <p><strong>High Priority:</strong> {systemStatus.jobs.jobsByPriority.HIGH}</p>
            <p><strong>Medium Priority:</strong> {systemStatus.jobs.jobsByPriority.MEDIUM}</p>
            <p><strong>Low Priority:</strong> {systemStatus.jobs.jobsByPriority.LOW}</p>
          </div>
          
          <div className="status-card">
            <h4>Executions</h4>
            <p><strong>Total:</strong> {systemStatus.jobs.totalExecutions}</p>
            <p><strong>Completed:</strong> {systemStatus.jobs.executionsByStatus.COMPLETED}</p>
            <p><strong>Failed:</strong> {systemStatus.jobs.executionsByStatus.FAILED}</p>
            <p><strong>Running:</strong> {systemStatus.jobs.executionsByStatus.RUNNING}</p>
            <p><strong>Pending:</strong> {systemStatus.jobs.executionsByStatus.PENDING}</p>
          </div>
          
          <div className="status-card">
            <h4>Workers</h4>
            <p><strong>Total:</strong> {systemStatus.workers.totalWorkers}</p>
            <p><strong>Healthy:</strong> {systemStatus.workers.healthyWorkers}</p>
            <p><strong>Capacity:</strong> {systemStatus.workers.totalCapacity}</p>
            <p><strong>Load:</strong> {systemStatus.workers.totalLoad}</p>
            <p><strong>Utilization:</strong> {systemStatus.workers.utilizationRate.toFixed(1)}%</p>
          </div>
        </div>
      )}
      
      {systemStatus && systemStatus.nextExecutions && (
        <div className="next-executions">
          <h4>Next Executions</h4>
          <table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Next Execution</th>
                <th>Schedule</th>
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
            <h3>{job.name}</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="job-info">
              <h4>Job Information</h4>
              <p><strong>ID:</strong> {job.id}</p>
              <p><strong>Description:</strong> {job.description || 'No description'}</p>
              <p><strong>Schedule:</strong> {job.schedule}</p>
              <p><strong>Command:</strong> {job.command}</p>
              <p><strong>Priority:</strong> {job.priority}</p>
              <p><strong>Dependencies:</strong> {job.dependencies.length > 0 ? job.dependencies.join(', ') : 'None'}</p>
              <p><strong>Enabled:</strong> {job.enabled ? 'Yes' : 'No'}</p>
              <p><strong>Max Retries:</strong> {job.retryPolicy.maxRetries}</p>
              <p><strong>Retry Delay:</strong> {job.retryPolicy.delayMs}ms</p>
            </div>
            
            {jobStatus && (
              <div className="job-status">
                <h4>Status</h4>
                <p><strong>Next Execution:</strong> {jobStatus.nextExecution ? formatDate(jobStatus.nextExecution) : 'Not scheduled'}</p>
                <p><strong>Can Execute:</strong> {jobStatus.canExecute ? 'Yes' : 'No'}</p>
                <p><strong>Dependencies Satisfied:</strong> {jobStatus.dependencies.satisfied ? 'Yes' : 'No'}</p>
              </div>
            )}
            
            {jobStatus && jobStatus.recentExecutions && (
              <div className="recent-executions">
                <h4>Recent Executions</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Scheduled</th>
                      <th>Duration</th>
                      <th>Worker</th>
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
      <h4>Create New Job</h4>
      <div className="form-grid">
        <div className="form-group">
          <label>Job ID *</label>
          <input
            type="text"
            value={newJob.id}
            onChange={(e) => setNewJob({...newJob, id: e.target.value})}
            placeholder="unique-job-id"
          />
        </div>
        <div className="form-group">
          <label>Job Name *</label>
          <input
            type="text"
            value={newJob.name}
            onChange={(e) => setNewJob({...newJob, name: e.target.value})}
            placeholder="My Job"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={newJob.description}
            onChange={(e) => setNewJob({...newJob, description: e.target.value})}
            placeholder="Job description"
          />
        </div>
        <div className="form-group">
          <label>Schedule *</label>
          <input
            type="text"
            value={newJob.schedule}
            onChange={(e) => setNewJob({...newJob, schedule: e.target.value})}
            placeholder="every 5 minutes, daily at 3 AM, etc."
          />
        </div>
        <div className="form-group">
          <label>Command *</label>
          <select
            value={newJob.command}
            onChange={(e) => setNewJob({...newJob, command: e.target.value})}
          >
            <option value="">Select command</option>
            <option value="echo">Echo</option>
            <option value="sleep">Sleep</option>
            <option value="calculate">Calculate</option>
            <option value="api_call">API Call</option>
            <option value="data_processing">Data Processing</option>
            <option value="backup">Backup</option>
            <option value="cleanup">Cleanup</option>
            <option value="health_check">Health Check</option>
            <option value="database_maintenance">Database Maintenance</option>
            <option value="report_generation">Report Generation</option>
          </select>
        </div>
        <div className="form-group">
          <label>Priority</label>
          <select
            value={newJob.priority}
            onChange={(e) => setNewJob({...newJob, priority: e.target.value})}
          >
            <option value={JobPriority.HIGH}>High</option>
            <option value={JobPriority.MEDIUM}>Medium</option>
            <option value={JobPriority.LOW}>Low</option>
          </select>
        </div>
        <div className="form-group">
          <label>Max Retries</label>
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
          <label>Retry Delay (ms)</label>
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
          className="create-btn" 
          onClick={handleCreateJob}
          disabled={isLoading || !newJob.id || !newJob.name || !newJob.schedule || !newJob.command}
        >
          {isLoading ? 'Creating...' : 'Create Job'}
        </button>
        <button 
          className="cancel-btn" 
          onClick={() => setShowCreateForm(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="job-scheduler-app">
      <header className="app-header">
        <h1>Distributed Job Scheduler</h1>
        <div className="header-status">
          <span className={`status-indicator ${systemStatus?.scheduler?.isRunning ? 'running' : 'stopped'}`}>
            {systemStatus?.scheduler?.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <nav className="tab-nav">
        <button 
          className={activeTab === 'jobs' ? 'active' : ''}
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
        <button 
          className={activeTab === 'executions' ? 'active' : ''}
          onClick={() => setActiveTab('executions')}
        >
          Executions
        </button>
        <button 
          className={activeTab === 'status' ? 'active' : ''}
          onClick={() => setActiveTab('status')}
        >
          System Status
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'executions' && <ExecutionsTab />}
        {activeTab === 'status' && <SystemStatusTab />}
      </main>

      <JobDetailsModal 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Job</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
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
