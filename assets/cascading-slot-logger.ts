/**
 * Cascading Slot Logger
 *
 * A logger utility for the shared-cascading-slot extension with toggle functionality.
 * Automatically writes logs to file when enabled and provides download capability.
 * Supports both global and per-file enable/disable controls.
 *
 * Usage:
 * - Import: import { cascadingSlotLogger, getFileIdentifier, createFileLogger } from "./cascading-slot-logger";
 * 
 * Basic Logging:
 * - Log: cascadingSlotLogger.info("Message", data);
 * - Log with file identifier: cascadingSlotLogger.info("Message", data, "my-file-name");
 * - Or use helper: const fileId = getFileIdentifier(); cascadingSlotLogger.info("Message", data, fileId);
 * - Or use file logger: const logger = createFileLogger("my-file-name"); logger.info("Message", data);
 * 
 * Global Controls:
 * - Toggle: cascadingSlotLogger.setEnabled(false); // Turn off logging globally
 * - Check: cascadingSlotLogger.getEnabled(); // Check global status
 * 
 * Per-File Controls:
 * - Enable for file: cascadingSlotLogger.setFileEnabled("my-file-name", true);
 * - Disable for file: cascadingSlotLogger.setFileEnabled("my-file-name", false);
 * - Check file status: cascadingSlotLogger.getFileEnabled("my-file-name");
 * - Remove file setting: cascadingSlotLogger.removeFileSetting("my-file-name");
 * - Get all settings: cascadingSlotLogger.getAllFileSettings();
 * - Clear all file settings: cascadingSlotLogger.clearFileSettings();
 * 
 * File Management:
 * - Download: cascadingSlotLogger.downloadLogs(); // Download log file
 * - Clear: cascadingSlotLogger.clearLogs(); // Clear all logs
 * - Get count: cascadingSlotLogger.getLogCount(); // Get stored log count
 * - Get logs: cascadingSlotLogger.getAllLogs(); // Get all stored logs
 *
 * Browser Console Commands (Global):
 * - enableCascadingSlotLogs() - Enable logging globally
 * - disableCascadingSlotLogs() - Disable logging globally
 * - toggleCascadingSlotLogs() - Toggle logging on/off globally
 * - checkCascadingSlotLogs() - Check global status and log count
 * - downloadCascadingSlotLogs() - Download logs as file
 * - clearCascadingSlotLogs() - Clear all stored logs
 * - showCascadingSlotLogs() - Display all logs in console
 *
 * Browser Console Commands (Per-File):
 * - enableCascadingSlotLogsForFile("file-name") - Enable logging for specific file
 * - disableCascadingSlotLogsForFile("file-name") - Disable logging for specific file
 * - toggleCascadingSlotLogsForFile("file-name") - Toggle logging for specific file
 * - checkCascadingSlotLogsForFile("file-name") - Check status for specific file
 * - listCascadingSlotLogsFileSettings() - List all file-specific settings
 * - clearCascadingSlotLogsFileSettings() - Clear all file-specific settings
 * - removeCascadingSlotLogsFileSetting("file-name") - Remove setting for specific file
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogOptions {
    level?: LogLevel;
    data?: any;
    timestamp?: boolean;
    fileIdentifier?: string; // Optional file identifier for per-file enable/disable
}

class CascadingSlotLogger {
    private isEnabled: boolean = false;
    private readonly featureName: string = 'CASCADING_SLOT';
    private readonly storageKey: string = 'cascading-slot-logs';
    private readonly fileSettingsKey: string = 'cascading-slot-logger-file-settings';
    private maxLogs: number = 1000; // Maximum number of logs to keep in memory
    private fileSettings: Map<string, boolean> = new Map(); // Per-file enable/disable settings

    // Async write queue system to prevent blocking
    private logQueue: string[] = []; // Queue of log messages waiting to be written
    private writePending: boolean = false; // Flag to prevent multiple simultaneous writes
    private writeTimer: ReturnType<typeof setTimeout> | null = null; // Timer for deferred writes
    private readonly writeBatchSize: number = 10; // Number of logs to batch before writing
    private readonly writeDelayMs: number = 100; // Delay before writing (ms)
    private logCache: string[] | null = null; // In-memory cache of logs to avoid frequent localStorage reads
    private cacheValid: boolean = false; // Flag to track if cache is valid

    constructor() {
        this.loadFileSettings();
    }

    /**
     * Load file-specific settings from localStorage
     */
    private loadFileSettings(): void {
        try {
            const stored = localStorage.getItem(this.fileSettingsKey);
            if (stored) {
                const settings = JSON.parse(stored);
                this.fileSettings = new Map(Object.entries(settings));
            }
        } catch (error) {
            console.warn('[CASCADING_SLOT_LOGGER] Failed to load file settings:', error);
        }
    }

    /**
     * Save file-specific settings to localStorage
     * IMPORTANT: This method ONLY touches the fileSettingsKey, never the logs storage key
     */
    private saveFileSettings(): void {
        try {
            const settings = Object.fromEntries(this.fileSettings);
            // Explicitly use only the fileSettingsKey - never touch storageKey
            // Verify we're using the correct key (fileSettingsKey, NOT storageKey)
            const keyToUse = this.fileSettingsKey;
            if (keyToUse === this.storageKey) {
                console.error('[CASCADING_SLOT_LOGGER] CRITICAL ERROR: fileSettingsKey matches storageKey!');
                return; // Prevent accidental log clearing
            }
            localStorage.setItem(keyToUse, JSON.stringify(settings));
        } catch (error) {
            console.warn('[CASCADING_SLOT_LOGGER] Failed to save file settings:', error);
        }
    }

    /**
     * Enable or disable logging globally
     * @param enabled - true to enable logging, false to disable
     */
    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    /**
     * Check if logging is currently enabled globally
     * @returns true if logging is enabled, false otherwise
     */
    public getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Enable or disable logging for a specific file
     * @param fileIdentifier - Unique identifier for the file (e.g., file path or module name)
     * @param enabled - true to enable logging for this file, false to disable
     */
    public setFileEnabled(fileIdentifier: string, enabled: boolean): void {
        this.fileSettings.set(fileIdentifier, enabled);
        this.saveFileSettings();
    }

    /**
     * Check if logging is enabled for a specific file
     * @param fileIdentifier - Unique identifier for the file
     * @returns true if enabled for this file, false otherwise. Returns global setting if file-specific setting doesn't exist.
     */
    public getFileEnabled(fileIdentifier: string): boolean {
        if (this.fileSettings.has(fileIdentifier)) {
            return this.fileSettings.get(fileIdentifier)!;
        }
        return this.isEnabled; // Default to global setting
    }

    /**
     * Remove file-specific setting (will use global setting)
     * @param fileIdentifier - Unique identifier for the file
     */
    public removeFileSetting(fileIdentifier: string): void {
        this.fileSettings.delete(fileIdentifier);
        this.saveFileSettings();
    }

    /**
     * Get all file-specific settings
     * @returns Object with file identifiers as keys and enabled state as values
     */
    public getAllFileSettings(): Record<string, boolean> {
        return Object.fromEntries(this.fileSettings);
    }

    /**
     * Clear all file-specific settings
     * IMPORTANT: This method ONLY clears file-specific settings.
     * It does NOT clear logs, log cache, or any other data.
     */
    public clearFileSettings(): void {
        // Only clear file settings Map - do NOT touch logs or cache
        this.fileSettings.clear();
        // Save only file settings to localStorage - explicitly use fileSettingsKey only
        this.saveFileSettings();
        // Explicitly ensure we never touch log-related storage or cache
        // Logs storage key: this.storageKey ('cascading-slot-logs')
        // Logs cache: this.logCache - NOT modified here
    }

    /**
     * Check if logging should be enabled for a specific file
     * @param fileIdentifier - Unique identifier for the file
     * @returns true if logging should proceed, false otherwise
     */
    private isLoggingEnabledForFile(fileIdentifier?: string): boolean {
        if (!fileIdentifier) {
            return this.isEnabled;
        }
        return this.getFileEnabled(fileIdentifier);
    }

    /**
     * Log a message with optional data
     * @param message - The log message
     * @param options - Optional log configuration
     */
    public log(message: string, options?: LogOptions): void {
        const fileIdentifier = options?.fileIdentifier;
        const isFileEnabled = this.isLoggingEnabledForFile(fileIdentifier);

        // Error logs always go through, but respect file settings for file storage
        if (!isFileEnabled && options?.level !== 'error') {
            return;
        }

        const level = options?.level || 'info';
        const timestamp = options?.timestamp !== false ? new Date().toISOString() : '';
        const prefix = `[${this.featureName}]`;
        const filePrefix = fileIdentifier ? `[${fileIdentifier}]` : '';

        let logMessage = `${prefix}${filePrefix} ${message}`;

        if (timestamp) {
            logMessage = `${prefix}${filePrefix} [${timestamp}] ${message}`;
        }

        if (options?.data !== undefined) {
            try {
                const dataStr = typeof options.data === 'object'
                    ? JSON.stringify(options.data, null, 2)
                    : String(options.data);
                logMessage += `\n${dataStr}`;
            } catch (error) {
                logMessage += `\n[Data serialization failed]`;
            }
        }

        // Output to console (errors always shown)
        if (isFileEnabled) {
            switch (level) {
                case 'error':
                    console.error(logMessage);
                    break;
                case 'warn':
                    console.warn(logMessage);
                    break;
                case 'debug':
                    // console.debug(logMessage);
                    break;
                case 'info':
                default:
                    // console.log(logMessage);
                    break;
            }
        }

        // Write to file if logging is enabled for this file
        if (isFileEnabled) {
            this.writeToFile(logMessage);
        }
    }

    /**
     * Log an info message
     * @param message - The log message
     * @param data - Optional data to log
     * @param fileIdentifier - Optional file identifier for per-file enable/disable
     */
    public info(message: string, data?: any, fileIdentifier?: string): void {
        this.log(message, { level: 'info', data, fileIdentifier });
    }

    /**
     * Log a warning message
     * @param message - The log message
     * @param data - Optional data to log
     * @param fileIdentifier - Optional file identifier for per-file enable/disable
     */
    public warn(message: string, data?: any, fileIdentifier?: string): void {
        this.log(message, { level: 'warn', data, fileIdentifier });
    }

    /**
     * Log an error message (always logged even if disabled)
     * @param message - The log message
     * @param data - Optional data to log
     * @param fileIdentifier - Optional file identifier for per-file enable/disable
     */
    public error(message: string, data?: any, fileIdentifier?: string): void {
        this.log(message, { level: 'error', data, fileIdentifier });
    }

    /**
     * Log a debug message
     * @param message - The log message
     * @param data - Optional data to log
     * @param fileIdentifier - Optional file identifier for per-file enable/disable
     */
    public debug(message: string, data?: any, fileIdentifier?: string): void {
        this.log(message, { level: 'debug', data, fileIdentifier });
    }

    /**
     * Queue log message for async write to file storage (non-blocking)
     * @param message - The formatted log message
     */
    private writeToFile(message: string): void {
        // Add to queue
        this.logQueue.push(message);

        // If queue is large enough, trigger immediate write
        if (this.logQueue.length >= this.writeBatchSize) {
            this.flushLogQueue();
            return;
        }

        // Schedule deferred write if not already scheduled
        if (!this.writePending && this.writeTimer === null) {
            this.scheduleWrite();
        }
    }

    /**
     * Schedule a deferred write operation
     * Uses setTimeout to defer writes to the next event loop, preventing blocking
     */
    private scheduleWrite(): void {
        if (this.writeTimer !== null) {
            return; // Already scheduled
        }

        // Use setTimeout to defer the write operation, allowing other code to execute first
        // This prevents blocking the main thread
        this.writeTimer = setTimeout(() => {
            this.writeTimer = null;
            this.flushLogQueue();
        }, this.writeDelayMs);
    }

    /**
     * Flush the log queue to localStorage (batched write)
     */
    private flushLogQueue(): void {
        if (this.writePending || this.logQueue.length === 0) {
            return;
        }

        this.writePending = true;

        // Use setTimeout to defer the actual write operation to next event loop tick
        setTimeout(() => {
            try {
                // Get current logs (use cache if valid, otherwise read from storage)
                let existingLogs: string[] = [];
                if (this.cacheValid && this.logCache !== null) {
                    existingLogs = [...this.logCache];
                } else {
                    existingLogs = this.getStoredLogs();
                    this.logCache = [...existingLogs];
                    this.cacheValid = true;
                }

                // Process all queued logs
                const logsToAdd = this.logQueue.splice(0); // Remove all from queue
                existingLogs.push(...logsToAdd);

                // Keep only the most recent logs
                if (existingLogs.length > this.maxLogs) {
                    existingLogs.splice(0, existingLogs.length - this.maxLogs);
                }

                // Update cache
                this.logCache = [...existingLogs];
                this.cacheValid = true;

                // Write to localStorage
                localStorage.setItem(this.storageKey, JSON.stringify(existingLogs));
            } catch (error) {
                console.warn('[CASCADING_SLOT_LOGGER] Failed to write to file storage:', error);
                this.cacheValid = false; // Invalidate cache on error
            } finally {
                this.writePending = false;

                // If more logs were added while writing, schedule another write
                if (this.logQueue.length > 0) {
                    this.scheduleWrite();
                }
            }
        }, 0);
    }

    /**
     * Get stored logs from localStorage (with caching)
     * @param forceRefresh - If true, bypass cache and read from localStorage
     * @returns Array of log messages
     */
    private getStoredLogs(forceRefresh: boolean = false): string[] {
        // Use cache if valid and not forcing refresh
        if (!forceRefresh && this.cacheValid && this.logCache !== null) {
            return [...this.logCache];
        }

        try {
            const stored = localStorage.getItem(this.storageKey);
            const logs = stored ? JSON.parse(stored) : [];

            // Update cache
            this.logCache = [...logs];
            this.cacheValid = true;

            return logs;
        } catch (error) {
            console.warn('[CASCADING_SLOT_LOGGER] Failed to read from file storage:', error);
            this.cacheValid = false;
            return [];
        }
    }

    /**
     * Invalidate the log cache (call when logs are modified externally)
     */
    private invalidateCache(): void {
        this.cacheValid = false;
        this.logCache = null;
    }

    /**
     * Download all logs as a text file
     * @param filename - Optional filename (defaults to timestamp)
     */
    public downloadLogs(filename?: string): void {
        try {
            // Flush queue first to ensure all logs are written
            this.flushLogQueue();

            // Small delay to ensure write completes, then get logs
            setTimeout(() => {
                const logs = this.getStoredLogs(true); // Force refresh to get latest
                if (logs.length === 0) {
                    console.warn('[CASCADING_SLOT_LOGGER] No logs available to download');
                    return;
                }

                const logContent = logs.join('\n\n') + '\n';
                const defaultFilename = filename || `cascading-slot-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;

                // Create blob and download
                const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = defaultFilename;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);

                console.log(`📁 Downloaded ${logs.length} log entries to ${defaultFilename}`);
            }, 50); // Small delay to ensure flush completes
        } catch (error) {
            console.error('[CASCADING_SLOT_LOGGER] Failed to download logs:', error);
        }
    }

    /**
     * Clear all stored logs
     */
    public clearLogs(): void {
        try {
            // Clear queue and cancel pending writes
            this.logQueue = [];
            if (this.writeTimer !== null) {
                clearTimeout(this.writeTimer);
                this.writeTimer = null;
            }
            this.writePending = false;

            // Clear localStorage
            localStorage.removeItem(this.storageKey);

            // Invalidate cache
            this.invalidateCache();

            console.log('🗑️ Cascading Slot logs cleared');
        } catch (error) {
            console.error('[CASCADING_SLOT_LOGGER] Failed to clear logs:', error);
        }
    }

    /**
     * Get the number of stored logs
     * @returns Number of log entries (includes queued logs)
     */
    public getLogCount(): number {
        // Flush queue to ensure count is accurate
        this.flushLogQueue();
        return this.getStoredLogs().length + this.logQueue.length;
    }

    /**
     * Get all stored logs as an array
     * @returns Array of log messages (includes queued logs)
     */
    public getAllLogs(): string[] {
        // Flush queue first to ensure all logs are included
        this.flushLogQueue();
        const storedLogs = this.getStoredLogs();
        return [...storedLogs, ...this.logQueue];
    }
}

// Export singleton instance
export const cascadingSlotLogger = new CascadingSlotLogger();

// Global console functions for easy access (can be called from browser console)
(window as any).enableCascadingSlotLogs = () => {
    cascadingSlotLogger.setEnabled(true);
    console.log("🔥 Cascading Slot Logger: ENABLED");
    return "Cascading Slot logging is now ENABLED";
};

(window as any).disableCascadingSlotLogs = () => {
    cascadingSlotLogger.setEnabled(false);
    console.log("🔇 Cascading Slot Logger: DISABLED");
    return "Cascading Slot logging is now DISABLED";
};

(window as any).toggleCascadingSlotLogs = () => {
    const newState = !cascadingSlotLogger.getEnabled();
    cascadingSlotLogger.setEnabled(newState);
    console.log(`🔄 Cascading Slot Logger: ${newState ? 'ENABLED' : 'DISABLED'}`);
    return `Cascading Slot logging is now ${newState ? 'ENABLED' : 'DISABLED'}`;
};

(window as any).checkCascadingSlotLogs = () => {
    const enabled = cascadingSlotLogger.getEnabled();
    const count = cascadingSlotLogger.getLogCount();
    console.log(`📊 Cascading Slot Logger Status: ${enabled ? 'ENABLED' : 'DISABLED'} (${count} logs stored)`);
    return `Cascading Slot logging is currently ${enabled ? 'ENABLED' : 'DISABLED'} (${count} logs stored)`;
};

(window as any).downloadCascadingSlotLogs = () => {
    const count = cascadingSlotLogger.getLogCount();
    if (count === 0) {
        console.log("📁 No logs available to download");
        return "No logs available to download";
    }

    cascadingSlotLogger.downloadLogs();
    console.log(`📁 Downloading ${count} log entries...`);
    return `Downloading ${count} log entries...`;
};

(window as any).clearCascadingSlotLogs = () => {
    const count = cascadingSlotLogger.getLogCount();
    cascadingSlotLogger.clearLogs();
    console.log(`🗑️ Cleared ${count} log entries`);
    return `Cleared ${count} log entries`;
};

(window as any).showCascadingSlotLogs = () => {
    const logs = cascadingSlotLogger.getAllLogs();
    if (logs.length === 0) {
        console.log("📋 No logs stored");
        return "No logs stored";
    }

    console.group(`📋 Cascading Slot Logs (${logs.length} entries)`);
    logs.forEach((log, index) => {
        console.log(`${index + 1}: ${log}`);
    });
    console.groupEnd();
    return `Showing ${logs.length} log entries`;
};

// Per-file enable/disable functions
(window as any).enableCascadingSlotLogsForFile = (fileIdentifier: string) => {
    cascadingSlotLogger.setFileEnabled(fileIdentifier, true);
    console.log(`✅ Cascading Slot Logger: ENABLED for "${fileIdentifier}"`);
    return `Cascading Slot logging is now ENABLED for "${fileIdentifier}"`;
};

(window as any).disableCascadingSlotLogsForFile = (fileIdentifier: string) => {
    cascadingSlotLogger.setFileEnabled(fileIdentifier, false);
    console.log(`❌ Cascading Slot Logger: DISABLED for "${fileIdentifier}"`);
    return `Cascading Slot logging is now DISABLED for "${fileIdentifier}"`;
};

(window as any).toggleCascadingSlotLogsForFile = (fileIdentifier: string) => {
    const currentState = cascadingSlotLogger.getFileEnabled(fileIdentifier);
    const newState = !currentState;
    cascadingSlotLogger.setFileEnabled(fileIdentifier, newState);
    console.log(`🔄 Cascading Slot Logger: ${newState ? 'ENABLED' : 'DISABLED'} for "${fileIdentifier}"`);
    return `Cascading Slot logging is now ${newState ? 'ENABLED' : 'DISABLED'} for "${fileIdentifier}"`;
};

(window as any).checkCascadingSlotLogsForFile = (fileIdentifier: string) => {
    const enabled = cascadingSlotLogger.getFileEnabled(fileIdentifier);
    console.log(`📊 Cascading Slot Logger Status for "${fileIdentifier}": ${enabled ? 'ENABLED' : 'DISABLED'}`);
    return `Cascading Slot logging is currently ${enabled ? 'ENABLED' : 'DISABLED'} for "${fileIdentifier}"`;
};

(window as any).listCascadingSlotLogsFileSettings = () => {
    const settings = cascadingSlotLogger.getAllFileSettings();
    const globalEnabled = cascadingSlotLogger.getEnabled();

    console.group(`📋 Cascading Slot Logger File Settings`);
    console.log(`🌐 Global Setting: ${globalEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📁 File-Specific Settings:`);

    if (Object.keys(settings).length === 0) {
        console.log('   (No file-specific settings)');
    } else {
        Object.entries(settings).forEach(([file, enabled]) => {
            console.log(`   ${enabled ? '✅' : '❌'} ${file}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
        });
    }

    console.groupEnd();
    return settings;
};

(window as any).clearCascadingSlotLogsFileSettings = () => {
    // Verify logs count before clearing settings
    const logCountBefore = cascadingSlotLogger.getLogCount();

    // Clear only file settings (this should NOT affect logs)
    cascadingSlotLogger.clearFileSettings();

    // Verify logs are still intact after clearing settings
    const logCountAfter = cascadingSlotLogger.getLogCount();

    if (logCountBefore !== logCountAfter) {
        console.warn(`⚠️ WARNING: Log count changed from ${logCountBefore} to ${logCountAfter} after clearing file settings!`);
    }

    console.log('🗑️ All file-specific settings cleared');
    console.log(`📊 Logs preserved: ${logCountAfter} logs remain`);
    return 'All file-specific settings cleared';
};

(window as any).removeCascadingSlotLogsFileSetting = (fileIdentifier: string) => {
    cascadingSlotLogger.removeFileSetting(fileIdentifier);
    console.log(`🗑️ Removed file-specific setting for "${fileIdentifier}"`);
    return `Removed file-specific setting for "${fileIdentifier}"`;
};

/**
 * Get file identifier from the calling file's stack trace
 * This is a helper function that files can use to automatically get their identifier
 * @returns File identifier based on the caller's file path
 */
export function getFileIdentifier(): string {
    try {
        const stack = new Error().stack;
        if (!stack) {
            return 'unknown';
        }

        const stackLines = stack.split('\n');
        // Find the first line that references a file in shared-cascading-slot
        for (let i = 0; i < stackLines.length; i++) {
            const line = stackLines[i];
            const match = line.match(/shared-cascading-slot[^:]*:(\d+):(\d+)/);
            if (match) {
                // Extract the file path
                const fileMatch = line.match(/([^/\\]+\.ts)/);
                if (fileMatch) {
                    return fileMatch[1].replace('.ts', '');
                }
            }
        }

        return 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Create a file-specific logger wrapper
 * This helper creates a logger instance that automatically includes the file identifier
 * @param fileIdentifier - Unique identifier for the file (e.g., file name without extension)
 * @returns Logger wrapper with file identifier pre-configured
 * 
 * @example
 * const logger = createFileLogger("my-component");
 * logger.info("This will include the file identifier automatically");
 */
export function createFileLogger(fileIdentifier: string) {
    return {
        info: (message: string, data?: any) => cascadingSlotLogger.info(message, data, fileIdentifier),
        warn: (message: string, data?: any) => cascadingSlotLogger.warn(message, data, fileIdentifier),
        error: (message: string, data?: any) => cascadingSlotLogger.error(message, data, fileIdentifier),
        debug: (message: string, data?: any) => cascadingSlotLogger.debug(message, data, fileIdentifier),
        setEnabled: (enabled: boolean) => cascadingSlotLogger.setFileEnabled(fileIdentifier, enabled),
        getEnabled: () => cascadingSlotLogger.getFileEnabled(fileIdentifier),
        toggle: () => {
            const current = cascadingSlotLogger.getFileEnabled(fileIdentifier);
            cascadingSlotLogger.setFileEnabled(fileIdentifier, !current);
            return !current;
        }
    };
}

// Export class for testing purposes
export { CascadingSlotLogger };

