import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, Database, Bell, Clock, Trash2, Eye, EyeOff, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '../utils/cn.js';
import {
  addSampleData,
  clearSampleData,
  generateTestBrowsingHistory,
  testSmartSuggestions,
  listActiveAlarms,
  testNotification,
  testAlarm
} from '../utils/devUtils.js';

/**
 * Modern Dev Panel with categorized tools
 */
function DevPanel({ isOpen, onClose, className }) {
  const [activeTab, setActiveTab] = useState('data');
  const [expandedSections, setExpandedSections] = useState(['quick-actions']);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }].slice(-50)); // Keep last 50 logs
  }, []);

  const clearLogs = () => setLogs([]);

  // Show toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Quick action buttons
  const quickActions = [
    {
      label: 'Test Alarm',
      icon: Clock,
      action: () => testAlarm(),
      color: 'blue'
    },
    {
      label: 'Test Notification',
      icon: Bell,
      action: () => testNotification(),
      color: 'purple'
    },
    {
      label: 'List Alarms',
      icon: Eye,
      action: () => listActiveAlarms(),
      color: 'green'
    }
  ];

  const tabs = [
    { id: 'data', label: 'Data', icon: Database },
    { id: 'alarms', label: 'Alarms & Notifications', icon: Bell },
    { id: 'console', label: 'Console', icon: Terminal }
  ];

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed bottom-4 right-4 w-[600px] max-h-[600px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-purple-500 dark:border-purple-400 flex flex-col z-50',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Terminal className="h-5 w-5" />
          <h3 className="font-bold text-lg">Developer Panel</h3>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">BETA</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            )}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'data' && <DataTab addLog={addLog} showToast={showToast} />}
        {activeTab === 'alarms' && <AlarmsTab addLog={addLog} showToast={showToast} />}
        {activeTab === 'console' && (
          <ConsoleTab logs={logs} onClear={clearLogs} />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          'absolute top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium z-50 animate-in fade-in slide-in-from-top-2',
          toast.type === 'success' && 'bg-green-600',
          toast.type === 'error' && 'bg-red-600',
          toast.type === 'info' && 'bg-blue-600'
        )}>
          {toast.message}
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Actions:</span>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={cn(
                'flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                action.color === 'blue' && 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300',
                action.color === 'purple' && 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300',
                action.color === 'green' && 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
              )}
            >
              <action.icon className="h-3 w-3" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Data Tab Component
function DataTab({ addLog, showToast }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSampleData = async () => {
    setIsLoading(true);
    addLog('Adding sample data...', 'info');
    try {
      await addSampleData();
      addLog('✅ Sample data added successfully', 'success');
      showToast('✅ Sample data added!', 'success');
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      showToast('❌ Failed to add data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Clear all sample data? This cannot be undone.')) return;
    setIsLoading(true);
    addLog('Clearing sample data...', 'info');
    try {
      await clearSampleData();
      addLog('✅ Sample data cleared', 'success');
      showToast('✅ Sample data cleared!', 'success');
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      showToast('❌ Failed to clear data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateHistory = async () => {
    setIsLoading(true);
    addLog('Generating test history...', 'info');
    try {
      await generateTestBrowsingHistory();
      addLog('✅ Test history generated', 'success');
      showToast('✅ Test history generated!', 'success');
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      showToast('❌ Failed to generate history', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Sample Data">
        <div className="space-y-2">
          <ActionButton
            icon={Database}
            label="Add Sample Data"
            description="Populate inbox, stashed tabs, and trash with test data"
            onClick={handleAddSampleData}
            disabled={isLoading}
            color="blue"
          />
          <ActionButton
            icon={Trash2}
            label="Clear Sample Data"
            description="Remove all test data from storage"
            onClick={handleClearData}
            disabled={isLoading}
            color="red"
          />
        </div>
      </Section>

      <Section title="Browser History">
        <ActionButton
          icon={Clock}
          label="Generate Test History"
          description="Create mock browsing history for smart suggestions"
          onClick={handleGenerateHistory}
          disabled={isLoading}
          color="purple"
        />
      </Section>

      <Section title="State Inspector">
        <StateInspector addLog={addLog} showToast={showToast} />
      </Section>
    </div>
  );
}

// Alarms Tab Component
function AlarmsTab({ addLog, showToast }) {
  const [alarms, setAlarms] = useState([]);

  const loadAlarms = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.alarms) return;
    
    chrome.alarms.getAll((alarmList) => {
      setAlarms(alarmList || []);
      addLog(`Found ${alarmList?.length || 0} active alarms`, 'info');
    });
  }, [addLog]);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  const triggerAllScheduledAlarms = async () => {
    console.log('[DevPanel] triggerAllScheduledAlarms called');
    
    if (!confirm('Trigger ALL scheduled alarms now? This will move all stashed items back to inbox and fire their notifications.')) {
      console.log('[DevPanel] User cancelled');
      return;
    }

    try {
      addLog('🚀 Starting to trigger all scheduled alarms...', 'info');
      showToast('⏳ Triggering alarms...', 'info');
      
      // Wrap chrome.alarms.getAll in a promise
      const allAlarms = await new Promise((resolve) => {
        chrome.alarms.getAll((alarms) => resolve(alarms || []));
      });
      
      console.log('[DevPanel] All alarms:', allAlarms);
      
      const tabNapperAlarms = allAlarms.filter(a => a.name.startsWith('tabNapper_'));
      console.log('[DevPanel] Tab Napper alarms:', tabNapperAlarms);
      
      if (tabNapperAlarms.length === 0) {
        showToast('No scheduled alarms found', 'info');
        addLog('❌ No Tab Napper alarms to trigger', 'info');
        return;
      }

      addLog(`📋 Found ${tabNapperAlarms.length} scheduled alarms`, 'info');

      let successCount = 0;
      let errorCount = 0;

      // Process each alarm
      for (const alarm of tabNapperAlarms) {
        try {
          // Parse the alarm name: tabNapper_{action}_{itemId}
          // Example: tabNapper_remind_me_inbox-1761419209071-ep2vhqiz5
          const nameWithoutPrefix = alarm.name.replace('tabNapper_', '');
          
          // Split on first underscore only to separate action from itemId
          const firstUnderscoreIndex = nameWithoutPrefix.indexOf('_');
          const action = nameWithoutPrefix.substring(0, firstUnderscoreIndex);
          const itemId = nameWithoutPrefix.substring(firstUnderscoreIndex + 1);

          console.log('[DevPanel] Processing alarm:', alarm.name);
          console.log('[DevPanel] Parsed - action:', action, 'itemId:', itemId);
          addLog(`⏰ Triggering: ${alarm.name}`, 'info');

          // Get the stashed item
          const result = await chrome.storage.local.get(['triageHub_stashedTabs', 'triageHub_inbox']);
          const stashedTabs = result.triageHub_stashedTabs || [];
          const inbox = result.triageHub_inbox || [];

          console.log('[DevPanel] Stashed tabs:', stashedTabs.length);
          const item = stashedTabs.find(i => i.id === itemId);
          console.log('[DevPanel] Found item:', item ? item.title : 'NOT FOUND');

          if (!item) {
            addLog(`⚠️ Item not found: ${itemId}`, 'warn');
            errorCount++;
            continue;
          }

          // Remove scheduled data
          const retriagedItem = { ...item };
          delete retriagedItem.scheduledFor;
          delete retriagedItem.scheduledAction;
          delete retriagedItem.scheduledWhen;

          // Move to inbox
          const updatedInbox = [retriagedItem, ...inbox];
          const updatedStashed = stashedTabs.filter(i => i.id !== itemId);

          await chrome.storage.local.set({
            triageHub_inbox: updatedInbox,
            triageHub_stashedTabs: updatedStashed
          });

          console.log('[DevPanel] Storage updated for:', itemId);

          // Create notification
          const actionLabel = action === 'remind_me' ? 'Reminder' : 
                             action === 'follow_up' ? 'Follow-up' : 'Review';
          const iconDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

          chrome.notifications.create(`dev-trigger-${itemId}`, {
            type: 'basic',
            iconUrl: iconDataUri,
            title: `Tab Napper ${actionLabel} (Dev Trigger)`,
            message: item.title || 'Scheduled item ready for review',
            priority: 2,
            requireInteraction: true,
            buttons: [
              { title: 'Open Tab Napper' },
              { title: 'Dismiss' }
            ]
          });

          // Clear the alarm
          await new Promise((resolve) => {
            chrome.alarms.clear(alarm.name, () => resolve());
          });

          console.log('[DevPanel] Alarm cleared:', alarm.name);
          addLog(`✅ Triggered: ${item.title}`, 'success');
          successCount++;

        } catch (itemError) {
          console.error('[DevPanel] Error processing alarm:', alarm.name, itemError);
          addLog(`❌ Error processing ${alarm.name}: ${itemError.message}`, 'error');
          errorCount++;
        }
      }

      showToast(`✅ Triggered ${successCount} alarms!`, 'success');
      addLog(`✅ Successfully triggered ${successCount} alarms (${errorCount} errors)`, 'success');
      
      // Reload alarms list and force UI refresh
      setTimeout(() => {
        loadAlarms();
        // Trigger reactive store update
        window.dispatchEvent(new CustomEvent('storage-updated'));
      }, 500);

    } catch (error) {
      console.error('[DevPanel] Error in triggerAllScheduledAlarms:', error);
      addLog(`❌ Error: ${error.message}`, 'error');
      showToast('❌ Failed to trigger alarms', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <Section title="Active Alarms">
        <div className="space-y-2">
          <button
            onClick={loadAlarms}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            🔄 Refresh
          </button>
          
          {alarms.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded">
              No active alarms found. Schedule some items to see them here.
            </div>
          ) : (
            <div className="space-y-2">
              {alarms.map((alarm) => (
                <AlarmCard key={alarm.name} alarm={alarm} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Testing">
        <div className="space-y-2">
          <ActionButton
            icon={Clock}
            label="Test Alarm (10 seconds)"
            description="Create a test alarm that fires in 10 seconds"
            onClick={async () => {
              try {
                addLog('Creating test alarm...', 'info');
                await testAlarm();
                addLog('✅ Test alarm created - check console in 10s', 'success');
                showToast('✅ Test alarm created!', 'success');
                setTimeout(() => loadAlarms(), 200);
              } catch (error) {
                addLog(`❌ Error: ${error.message}`, 'error');
                showToast('❌ Failed to create alarm', 'error');
              }
            }}
            color="blue"
          />
          <ActionButton
            icon={Bell}
            label="Test Notification"
            description="Show a test system notification"
            onClick={async () => {
              try {
                addLog('Sending test notification...', 'info');
                await testNotification();
                addLog('✅ Notification sent', 'success');
                showToast('✅ Notification sent!', 'success');
              } catch (error) {
                addLog(`❌ Error: ${error.message}`, 'error');
                showToast('❌ Failed to send notification', 'error');
              }
            }}
            color="purple"
          />
          <ActionButton
            icon={Clock}
            label="🚀 Trigger All Scheduled Alarms NOW"
            description="Force all scheduled items to trigger immediately (for testing)"
            onClick={triggerAllScheduledAlarms}
            color="red"
          />
        </div>
      </Section>
    </div>
  );
}

// Console Tab Component
function ConsoleTab({ logs, onClear }) {
  const logColors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warn: 'text-yellow-600 dark:text-yellow-400'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Console Output ({logs.length})
        </span>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear
        </button>
      </div>
      
      <div className="bg-gray-900 rounded p-3 h-[400px] overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-500">Console is empty. Actions will log here.</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="mb-1">
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              <span className={logColors[log.type] || 'text-gray-300'}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper Components
function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ActionButton({ icon: Icon, label, description, onClick, disabled, color = 'gray' }) {
  const colors = {
    blue: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    red: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    green: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-start space-x-3 p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]',
        colors[color]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-left">
        <div className="font-medium text-sm">{label}</div>
        {description && (
          <div className="text-xs opacity-75 mt-0.5">{description}</div>
        )}
      </div>
    </button>
  );
}

function AlarmCard({ alarm }) {
  const now = Date.now();
  const timeUntil = alarm.scheduledTime - now;
  const minutesUntil = Math.floor(timeUntil / 60000);
  
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-mono text-xs text-gray-600 dark:text-gray-400">
            {alarm.name}
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
            {new Date(alarm.scheduledTime).toLocaleString()}
          </div>
        </div>
        <div className={cn(
          'text-xs font-medium px-2 py-1 rounded',
          timeUntil < 0 
            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            : minutesUntil < 60
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
        )}>
          {timeUntil < 0 ? 'OVERDUE' : `${minutesUntil}m`}
        </div>
      </div>
    </div>
  );
}

function StateInspector({ addLog, showToast }) {
  const [stateData, setStateData] = useState(null);

  const inspectState = async () => {
    if (typeof chrome === 'undefined') return;
    
    try {
      const data = await chrome.storage.local.get(null);
      setStateData(data);
      addLog('State loaded successfully', 'success');
      showToast('✅ State loaded!', 'success');
    } catch (error) {
      addLog(`Error loading state: ${error.message}`, 'error');
      showToast('❌ Failed to load state', 'error');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={inspectState}
        className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
      >
        🔍 Inspect Current State
      </button>
      
      {stateData && (
        <div className="bg-gray-900 rounded p-3 max-h-[300px] overflow-y-auto">
          <pre className="text-xs text-green-400 font-mono">
            {JSON.stringify(stateData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default DevPanel;
