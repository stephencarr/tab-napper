import React, { useState, useEffect } from 'react';
import { saveAppState, loadAppState } from '../utils/storage.js';

const ALL_WIDGETS = [
  { id: 'a', name: 'Quick Note Capture' },
  { id: 'b', name: 'Recently Visited' },
  { id: 'c', name: 'Quick Access Cards' },
];

function SettingsView() {
  const [visibleWidgets, setVisibleWidgets] = useState([]);

  useEffect(() => {
    const loadLayout = async () => {
      const savedLayout = await loadAppState('triageHub_dashboardLayout');
      if (savedLayout) {
        setVisibleWidgets(savedLayout.map((item) => item.i));
      }
    };
    loadLayout();
  }, []);

  const handleWidgetToggle = async (widgetId) => {
    const newVisibleWidgets = visibleWidgets.includes(widgetId)
      ? visibleWidgets.filter((id) => id !== widgetId)
      : [...visibleWidgets, widgetId];

    setVisibleWidgets(newVisibleWidgets);

    const savedLayout = (await loadAppState('triageHub_dashboardLayout')) || [];
    const newLayout = ALL_WIDGETS.filter((widget) => newVisibleWidgets.includes(widget.id)).map(
      (widget) => {
        const existingLayout = savedLayout.find((item) => item.i === widget.id);
        return (
          existingLayout || {
            i: widget.id,
            x: 0,
            y: Infinity,
            w: 6,
            h: 2,
          }
        );
      }
    );
    saveAppState('triageHub_dashboardLayout', newLayout);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dashboard Widgets</h2>
        {ALL_WIDGETS.map((widget) => (
          <div key={widget.id} className="flex items-center">
            <input
              type="checkbox"
              id={widget.id}
              checked={visibleWidgets.includes(widget.id)}
              onChange={() => handleWidgetToggle(widget.id)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={widget.id} className="ml-3 text-sm text-gray-700 dark:text-gray-300">
              {widget.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsView;
