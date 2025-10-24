import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Trash2, Copy, Download } from 'lucide-react';
import { cn } from '../utils/cn.js';

/**
 * In-page development console for easier debugging
 * Shows console logs, errors, and warnings directly in the UI
 */
function DevConsole({ className, isEnabled = true }) {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [maxLogs] = useState(100); // Limit logs to prevent memory issues
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!isEnabled) return;

    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    // Create log interceptor
    const addLog = (type, args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      const logEntry = {
        id: Date.now() + Math.random(),
        type,
        message,
        timestamp,
        args
      };

      setLogs(prevLogs => {
        const newLogs = [...prevLogs, logEntry];
        // Keep only the last maxLogs entries
        return newLogs.slice(-maxLogs);
      });
    };

    // Override console methods
    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    // Initial log to show console is active
    console.log('[Dev Console] In-page console initialized');

    // Cleanup on unmount
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [isEnabled, maxLogs]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logsEndRef.current && isVisible) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isVisible]);

  const clearLogs = () => {
    setLogs([]);
    console.log('[Dev Console] Logs cleared');
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-hub-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      console.log('[Dev Console] Logs copied to clipboard');
    });
  };

  const getLogTypeStyles = (type) => {
    switch (type) {
      case 'error':
        return 'text-red-700 bg-red-50 border-l-red-500';
      case 'warn':
        return 'text-amber-700 bg-amber-50 border-l-amber-500';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-l-blue-500';
      default:
        return 'text-calm-700 bg-calm-50 border-l-calm-500';
    }
  };

  const getLogCount = (type) => {
    return logs.filter(log => log.type === type).length;
  };

  if (!isEnabled) return null;

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          'flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all',
          'bg-gray-900 text-white hover:bg-gray-800',
          isVisible && 'rounded-b-none'
        )}
      >
        <Terminal className="h-4 w-4" />
        <span className="text-sm font-medium">Dev Console</span>
        {logs.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {logs.length}
          </span>
        )}
      </button>

      {/* Console Panel */}
      {isVisible && (
        <div className="bg-gray-900 text-white rounded-lg rounded-tr-none shadow-2xl w-96 max-w-[90vw]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="flex items-center space-x-4 text-xs">
              <span className="text-gray-400">
                Logs: {logs.length}/{maxLogs}
              </span>
              <span className="text-green-400">
                ✓ {getLogCount('log')}
              </span>
              <span className="text-amber-400">
                ⚠ {getLogCount('warn')}
              </span>
              <span className="text-red-400">
                ✗ {getLogCount('error')}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={copyLogs}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Copy logs"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={exportLogs}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Export logs"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                onClick={clearLogs}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Clear logs"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Close console"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="h-64 overflow-y-auto p-2 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No logs yet...</p>
                <p className="text-xs mt-1">Console output will appear here</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'p-2 rounded border-l-2 text-xs leading-relaxed',
                    getLogTypeStyles(log.type)
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-semibold text-xs opacity-75">
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-xs opacity-50">
                      {log.timestamp}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs">
                    {log.message}
                  </pre>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DevConsole;