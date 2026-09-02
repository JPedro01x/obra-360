/**
 * STRUCTURED ENTERPRISE LOGGER SERVICE (Clean Architecture)
 * 
 * Fornece logging estruturado em formato JSON com timestamps ISO-8601,
 * níveis de severidade (INFO, WARN, ERROR, AUDIT) e metadados contextuais do tenant.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  companyId?: string;
  userEmail?: string;
  userRole?: string;
  context?: Record<string, any>;
  errorDetails?: string;
}

class LoggerService {
  private logsHistory: LogEntry[] = [];

  private createEntry(level: LogLevel, message: string, context?: Record<string, any>, errorDetails?: string): LogEntry {
    const entry: LogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      errorDetails
    };

    this.logsHistory.unshift(entry);
    
    // Console output formatted with severity colors
    const prefix = `[${entry.timestamp}] [${level}]`;
    if (level === 'ERROR') {
      console.error(prefix, message, context || '', errorDetails || '');
    } else if (level === 'WARN') {
      console.warn(prefix, message, context || '');
    } else if (level === 'AUDIT') {
      console.info(`🛡️ ${prefix} [AUDIT]`, message, context || '');
    } else {
      console.log(prefix, message, context || '');
    }

    return entry;
  }

  public info(message: string, context?: Record<string, any>): LogEntry {
    return this.createEntry('INFO', message, context);
  }

  public warn(message: string, context?: Record<string, any>): LogEntry {
    return this.createEntry('WARN', message, context);
  }

  public error(message: string, error?: any, context?: Record<string, any>): LogEntry {
    const errStr = error instanceof Error ? error.stack || error.message : String(error);
    return this.createEntry('ERROR', message, context, errStr);
  }

  public audit(action: string, entity: string, details: Record<string, any>): LogEntry {
    return this.createEntry('AUDIT', `[AUDIT ACTION]: ${action} on ${entity}`, details);
  }

  public getHistory(): LogEntry[] {
    return [...this.logsHistory];
  }
}

export const logger = new LoggerService();
