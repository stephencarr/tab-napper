import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, X, RefreshCw, Bug, Clock, Bell, Copy, Trash2, Database, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn.js';
import {
  listActiveAlarms,
  testNotification,
  testAlarm,
  getCloseTabCandidates,
  getDuplicateTabCandidates,
  getAllBrowserTabs,
  addSampleData,
  clearSampleData
} from '../utils/devUtils.js';
import { findAndCloseDuplicateTabs } from '../utils/navigation.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useConfirm } from '../hooks/useConfirm.js';
import ConfirmDialog from './ConfirmDialog.jsx';

/**
 * Enhanced Dev Panel - Focused on debugging tab detection and close all issues
 */
function DevPanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('debugging');
  const [logs, setLogs] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [browserTabs, setBrowserTabs] = useState({ tabs: [], summary: {} });
  const [closeTabData, setCloseTabData] = useState({ candidates: [], summary: {} });
  const [duplicateData, setDuplicateData] = useState({ duplicates: [], summary: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    alarms: true,
    browserTabs: true,
    closeCandidates: false,
    duplicates: false
  });
  
  const { toast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  // Add log entry
  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  // Load debugging data
  const refreshDebugData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alarmsResult, tabsResult] = await Promise.all([
        listActiveAlarms(),
        getAllBrowserTabs()
      ]);
      
      setAlarms(alarmsResult || []);
      setBrowserTabs(tabsResult || { tabs: [], summary: {} });
      
      addLog('Debug data refreshed', 'info');
    } catch (error) {
      console.error('[DevPanel] Error refreshing data:', error);
      toast.error('Refresh Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [toast, addLog]);

  // Load close tab candidates
  const refreshCloseCandidates = useCallback(async () => {
    try {
      // Get all items from storage
      const result = await chrome.storage.local.get(['triageHub_inbox', 'triageHub_scheduled', 'triageHub_archive']);
      const allItems = [
        ...(result.triageHub_inbox || []),
        ...(result.triageHub_scheduled || []),
        ...(result.triageHub_archive || [])
      ];
      
      const data = await getCloseTabCandidates(allItems);
      setCloseTabData(data || { candidates: [], summary: {} });
      
      const summary = data?.summary || {};
      addLog(`Found ${summary.total || 0} matching tabs (${summary.wouldClose || 0} would close, ${summary.wouldSkip || 0} pinned)`, 'info');
    } catch (error) {
      console.error('[DevPanel] Error getting close candidates:', error);
      toast.error('Analysis Failed', error.message);
    }
  }, [toast, addLog]);

  // Load duplicate tab candidates
  const refreshDuplicateCandidates = useCallback(async () => {
    try {
      const data = await getDuplicateTabCandidates();
      setDuplicateData(data || { duplicates: [], summary: {} });
      
      const summary = data?.summary || {};
      addLog(`Found ${summary.totalGroups || 0} duplicate groups (${summary.wouldClose || 0} would close)`, 'info');
    } catch (error) {
      console.error('[DevPanel] Error getting duplicates:', error);
      toast.error('Analysis Failed', error.message);
    }
  }, [toast, addLog]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      refreshDebugData();
    }
  }, [isOpen, refreshDebugData]);

  const clearLogs = () => setLogs([]);

  // Intercept console.log for Tab Napper messages
  useEffect(() => {
    if (!isOpen) return;
    
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      if (message.includes('[Tab Napper]') || message.includes('[useOpenTabs]') || message.includes('[DevPanel]')) {
        addLog(message, 'info');
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'error');
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      addLog(message, 'warn');
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [isOpen, addLog]);

  // Quick action handlers
  const handleTestAlarm = async () => {
    try {
      await testAlarm();
      toast.success('Test Alarm Created', 'Will fire in 10 seconds');
      addLog('Test alarm created (10 seconds)', 'info');
    } catch (error) {
      toast.error('Alarm Failed', error.message);
    }
  };

  const handleTestNotification = async () => {
    try {
      await testNotification();
      toast.success('Notification Sent', 'Check your system tray');
      addLog('Test notification sent', 'info');
    } catch (error) {
      toast.error('Notification Failed', error.message);
    }
  };

  const handleCloseDuplicates = async () => {
    const totalGroups = duplicateData?.summary?.totalGroups || 0;
    const wouldClose = duplicateData?.summary?.wouldClose || 0;
    
    await confirm({
      title: 'Close Duplicate Tabs',
      message: `Found ${totalGroups} duplicate groups.\n\nThis will close ${wouldClose} tabs (keeping newest of each URL, preserving pinned tabs).\n\nContinue?`,
      type: 'warning',
      confirmText: 'Close Duplicates',
      onConfirm: async () => {
        try {
          const result = await findAndCloseDuplicateTabs({ keepNewest: true, dryRun: false });
          toast.success('Duplicates Closed', `Closed ${result.closed} tabs`);
          addLog(`Closed ${result.closed} duplicate tabs`, 'info');
          await refreshDuplicateCandidates();
          await refreshDebugData();
        } catch (error) {
          toast.error('Close Failed', error.message);
          addLog(`Error closing duplicates: ${error.message}`, 'error');
        }
      }
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Panel */}
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-4xl bg-calm-50 dark:bg-calm-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-calm-200 dark:border-calm-700 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Developer Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-calm-200 dark:border-calm-700 bg-white dark:bg-calm-800">
            {['debugging', 'console', 'data'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-calm-600 dark:text-calm-400 hover:text-calm-900 dark:hover:text-calm-200'
                )}
              >
                {tab === 'debugging' && <Bug className="inline h-4 w-4 mr-2" />}
                {tab === 'console' && <Terminal className="inline h-4 w-4 mr-2" />}
                {tab === 'data' && <Database className="inline h-4 w-4 mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Debugging Tab */}
            {activeTab === 'debugging' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={refreshDebugData}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    Refresh All Data
                  </button>
                  <button
                    onClick={refreshCloseCandidates}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Analyze Close All
                  </button>
                  <button
                    onClick={refreshDuplicateCandidates}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Find Duplicates
                  </button>
                  {duplicateData?.summary?.totalGroups > 0 && (
                    <button
                      onClick={handleCloseDuplicates}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Close Duplicates ({duplicateData.summary.wouldClose})
                    </button>
                  )}
                  <button
                    onClick={handleTestAlarm}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    Test Alarm
                  </button>
                  <button
                    onClick={handleTestNotification}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    Test Notification
                  </button>
                </div>

                {/* Active Alarms */}
                <CollapsibleSection
                  title="Active Alarms"
                  count={alarms?.length || 0}
                  isExpanded={expandedSections.alarms}
                  onToggle={() => toggleSection('alarms')}
                  icon={Clock}
                >
                  {!alarms || alarms.length === 0 ? (
                    <p className="text-calm-500 dark:text-calm-400 text-sm">No active alarms</p>
                  ) : (
                    <div className="space-y-2">
                      {alarms.map((alarm, idx) => (
                        <div key={idx} className="p-3 bg-calm-100 dark:bg-calm-800 rounded-lg text-sm">
                          <div className="font-medium text-calm-900 dark:text-calm-100">{alarm.name}</div>
                          <div className="text-calm-600 dark:text-calm-400 text-xs mt-1">
                            Fires at: {new Date(alarm.scheduledTime).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* Browser Tabs Summary */}
                <CollapsibleSection
                  title="Browser Tabs"
                  count={browserTabs?.summary?.total || 0}
                  isExpanded={expandedSections.browserTabs}
                  onToggle={() => toggleSection('browserTabs')}
                  icon={Eye}
                >
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <StatCard label="Total Tabs" value={browserTabs?.summary?.total || 0} color="blue" />
                    <StatCard label="Unpinned" value={browserTabs?.summary?.unpinned || 0} color="green" />
                    <StatCard label="Pinned" value={browserTabs?.summary?.pinned || 0} color="purple" />
                    <StatCard label="Active" value={browserTabs?.summary?.active || 0} color="orange" />
                  </div>
                  {browserTabs?.tabs && browserTabs.tabs.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {browserTabs.tabs.map((tab) => (
                        <div key={tab.id} className="p-3 bg-calm-100 dark:bg-calm-800 rounded-lg text-sm">
                          <div className="flex items-center gap-2">
                            {tab.pinned && <span className="text-purple-600 dark:text-purple-400">📌</span>}
                            {tab.active && <span className="text-green-600 dark:text-green-400">●</span>}
                            <span className="font-medium text-calm-900 dark:text-calm-100 flex-1 truncate">
                              {tab.title}
                            </span>
                          </div>
                          <div className="text-calm-600 dark:text-calm-400 text-xs mt-1 truncate">
                            {tab.url}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>

                {/* Close Tab Candidates */}
                {closeTabData?.summary?.total > 0 && (
                  <CollapsibleSection
                    title="Close All Analysis"
                    count={closeTabData.summary.total}
                    isExpanded={expandedSections.closeCandidates}
                    onToggle={() => toggleSection('closeCandidates')}
                    icon={Trash2}
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <StatCard label="Would Close" value={closeTabData?.summary?.wouldClose || 0} color="red" />
                      <StatCard label="Would Skip (Pinned)" value={closeTabData?.summary?.wouldSkip || 0} color="purple" />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(closeTabData?.candidates || []).map((candidate, idx) => (
                        <div key={idx} className={cn(
                          "p-3 rounded-lg text-sm",
                          candidate.wouldClose 
                            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                            : "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                        )}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-calm-900 dark:text-calm-100 flex-1 truncate">
                              {candidate.itemTitle}
                            </span>
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              candidate.wouldClose 
                                ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                : "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                            )}>
                              {candidate.wouldClose ? 'Would Close' : 'Pinned - Skip'}
                            </span>
                          </div>
                          <div className="text-calm-600 dark:text-calm-400 text-xs mt-1">
                            Tab ID: {candidate.tabId} | Window: {candidate.windowId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Duplicate Candidates */}
                {duplicateData?.summary?.totalGroups > 0 && (
                  <CollapsibleSection
                    title="Duplicate Tabs"
                    count={duplicateData.summary.totalGroups}
                    isExpanded={expandedSections.duplicates}
                    onToggle={() => toggleSection('duplicates')}
                    icon={Copy}
                  >
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <StatCard label="Duplicate Groups" value={duplicateData?.summary?.totalGroups || 0} color="orange" />
                      <StatCard label="Would Close" value={duplicateData?.summary?.wouldClose || 0} color="red" />
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(duplicateData?.duplicates || []).map((dup, idx) => (
                        <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm">
                          <div className="font-medium text-calm-900 dark:text-calm-100 truncate mb-2">
                            {dup.count} tabs with same URL
                          </div>
                          <div className="text-calm-600 dark:text-calm-400 text-xs mb-2 truncate">
                            {dup.url}
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                              {dup.pinned} pinned
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {dup.unpinned} unpinned
                            </span>
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                              {dup.wouldClose} would close
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>
            )}

            {/* Console Tab */}
            {activeTab === 'console' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-100">Console Logs</h3>
                  <button
                    onClick={clearLogs}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="bg-calm-900 dark:bg-black rounded-lg p-4 font-mono text-xs h-[600px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-calm-500">No logs yet. Tab Napper messages will appear here.</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className={cn(
                        "py-1",
                        log.type === 'error' && "text-red-400",
                        log.type === 'warn' && "text-yellow-400",
                        log.type === 'info' && "text-green-400"
                      )}>
                        <span className="text-calm-500">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-calm-900 dark:text-calm-100">Test Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={async () => {
                      await addSampleData();
                      toast.success('Sample Data Added', 'Check your inbox');
                      addLog('Added sample data', 'info');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Database className="h-4 w-4" />
                    Add Sample Data
                  </button>
                  <button
                    onClick={async () => {
                      await confirm({
                        title: 'Clear All Data',
                        message: 'This will delete ALL data from Tab Napper. Are you sure?',
                        type: 'danger',
                        confirmText: 'Delete All',
                        onConfirm: async () => {
                          await clearSampleData();
                          toast.success('Data Cleared', 'All Tab Napper data deleted');
                          addLog('Cleared all data', 'warn');
                        }
                      });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <ConfirmDialog {...confirmProps} />
    </>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, count, isExpanded, onToggle, icon: Icon, children }) {
  return (
    <div className="border border-calm-200 dark:border-calm-700 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-calm-100 dark:hover:bg-calm-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-calm-600 dark:text-calm-400" />}
          <span className="font-semibold text-calm-900 dark:text-calm-100">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
              {count}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isExpanded && (
        <div className="p-4 border-t border-calm-200 dark:border-calm-700">
          {children}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
  };

  return (
    <div className={cn('p-4 rounded-lg', colors[color])}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}

export default DevPanel;
