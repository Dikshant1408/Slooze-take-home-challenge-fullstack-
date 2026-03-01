const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[(LOG_LEVEL as LogLevel) || 'info'];
}

function format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) console.debug(format('debug', message, meta));
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) console.info(format('info', message, meta));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) console.warn(format('warn', message, meta));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) console.error(format('error', message, meta));
  },
};
