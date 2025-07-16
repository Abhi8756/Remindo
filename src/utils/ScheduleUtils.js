/**
 * Cron-like Schedule Parser and Utilities
 */

export class CronSchedule {
  constructor(expression) {
    this.expression = expression;
    this.parsed = this.parseExpression(expression);
  }

  /**
   * Parse cron-like expressions
   * Supports:
   * - "every 5 minutes" -> every N minutes
   * - "daily at 3 AM" -> daily at specific hour
   * - "weekly on monday" -> weekly on specific day
   * - Standard cron format: "minute hour day month dayOfWeek"
   */
  parseExpression(expression) {
    const expr = expression.toLowerCase().trim();
    
    // Handle natural language expressions
    if (expr.includes('every') && expr.includes('minutes')) {
      const match = expr.match(/every (\d+) minutes/);
      if (match) {
        const minutes = parseInt(match[1]);
        return { minute: `*/${minutes}`, hour: '*', day: '*', month: '*', dayOfWeek: '*' };
      }
    }
    
    if (expr.includes('daily') && expr.includes('am')) {
      const match = expr.match(/daily at (\d+) am/);
      if (match) {
        const hour = parseInt(match[1]);
        return { minute: '0', hour: hour.toString(), day: '*', month: '*', dayOfWeek: '*' };
      }
    }
    
    if (expr.includes('daily') && expr.includes('pm')) {
      const match = expr.match(/daily at (\d+) pm/);
      if (match) {
        const hour = parseInt(match[1]) + 12;
        return { minute: '0', hour: hour.toString(), day: '*', month: '*', dayOfWeek: '*' };
      }
    }
    
    if (expr.includes('weekly') && expr.includes('monday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '1' };
    }
    
    if (expr.includes('weekly') && expr.includes('tuesday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '2' };
    }
    
    if (expr.includes('weekly') && expr.includes('wednesday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '3' };
    }
    
    if (expr.includes('weekly') && expr.includes('thursday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '4' };
    }
    
    if (expr.includes('weekly') && expr.includes('friday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '5' };
    }
    
    if (expr.includes('weekly') && expr.includes('saturday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '6' };
    }
    
    if (expr.includes('weekly') && expr.includes('sunday')) {
      return { minute: '0', hour: '0', day: '*', month: '*', dayOfWeek: '0' };
    }
    
    // Handle standard cron format
    const parts = expression.split(' ');
    if (parts.length === 5) {
      return {
        minute: parts[0],
        hour: parts[1],
        day: parts[2],
        month: parts[3],
        dayOfWeek: parts[4]
      };
    }
    
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  /**
   * Get the next execution time based on current time
   */
  getNextExecution(currentTime = new Date()) {
    const next = new Date(currentTime);
    
    // Simple implementation for common cases
    if (this.parsed.minute.startsWith('*/')) {
      const interval = parseInt(this.parsed.minute.substring(2));
      const minutesToAdd = interval - (next.getMinutes() % interval);
      next.setMinutes(next.getMinutes() + minutesToAdd);
      next.setSeconds(0);
      next.setMilliseconds(0);
      return next;
    }
    
    if (this.parsed.minute !== '*' && this.parsed.hour !== '*') {
      const targetMinute = parseInt(this.parsed.minute);
      const targetHour = parseInt(this.parsed.hour);
      
      next.setMinutes(targetMinute);
      next.setSeconds(0);
      next.setMilliseconds(0);
      
      if (this.parsed.day === '*' && this.parsed.month === '*' && this.parsed.dayOfWeek === '*') {
        // Daily execution
        next.setHours(targetHour);
        if (next <= currentTime) {
          next.setDate(next.getDate() + 1);
        }
        return next;
      }
      
      if (this.parsed.dayOfWeek !== '*') {
        // Weekly execution
        const targetDayOfWeek = parseInt(this.parsed.dayOfWeek);
        const currentDayOfWeek = next.getDay();
        const daysUntilTarget = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
        
        next.setHours(targetHour);
        if (daysUntilTarget === 0 && next <= currentTime) {
          next.setDate(next.getDate() + 7);
        } else {
          next.setDate(next.getDate() + daysUntilTarget);
        }
        return next;
      }
    }
    
    // Default: run in 1 minute
    next.setMinutes(next.getMinutes() + 1);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  }

  /**
   * Check if the schedule should trigger at the given time
   */
  shouldTrigger(currentTime) {
    const nextExecution = this.getNextExecution(new Date(currentTime.getTime() - 60000));
    return Math.abs(nextExecution.getTime() - currentTime.getTime()) < 30000; // 30 second window
  }
}

/**
 * Schedule Management Utilities
 */
export class ScheduleManager {
  constructor() {
    this.schedules = new Map();
  }

  addSchedule(jobId, cronExpression) {
    this.schedules.set(jobId, new CronSchedule(cronExpression));
  }

  removeSchedule(jobId) {
    this.schedules.delete(jobId);
  }

  getNextExecutionTime(jobId) {
    const schedule = this.schedules.get(jobId);
    return schedule ? schedule.getNextExecution() : null;
  }

  getJobsToExecute(currentTime = new Date()) {
    const jobsToExecute = [];
    
    for (const [jobId, schedule] of this.schedules) {
      if (schedule.shouldTrigger(currentTime)) {
        jobsToExecute.push(jobId);
      }
    }
    
    return jobsToExecute;
  }

  getAllNextExecutions() {
    const executions = [];
    
    for (const [jobId, schedule] of this.schedules) {
      executions.push({
        jobId,
        nextExecution: schedule.getNextExecution(),
        expression: schedule.expression
      });
    }
    
    return executions.sort((a, b) => a.nextExecution - b.nextExecution);
  }
}
