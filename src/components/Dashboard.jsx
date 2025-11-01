import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Widget from './Widget.jsx';
import QuickNoteCapture from './QuickNoteCapture.jsx';
import RecentlyVisited from './RecentlyVisited.jsx';
import QuickAccessCards from './QuickAccessCards.jsx';
import { saveAppState, loadAppState } from '../utils/storage.js';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGETS = {
  a: <QuickNoteCapture onNoteSaved={() => {}} />,
  b: <RecentlyVisited maxItems={10} />,
  c: <QuickAccessCards maxItems={6} />,
};

const DEFAULT_LAYOUT = [
  { i: 'a', x: 0, y: 0, w: 6, h: 2, static: false, widget: 'QuickNoteCapture' },
  { i: 'b', x: 6, y: 0, w: 6, h: 2, static: false, widget: 'RecentlyVisited' },
  { i: 'c', x: 0, y: 2, w: 12, h: 2, static: false, widget: 'QuickAccessCards' },
];

function Dashboard() {
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    const loadLayout = async () => {
      const savedLayout = await loadAppState('triageHub_dashboardLayout');
      setLayout(savedLayout || DEFAULT_LAYOUT);
    };
    loadLayout();
  }, []);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    saveAppState('triageHub_dashboardLayout', newLayout);
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
    >
      {layout.map((item) => (
        <div key={item.i}>
          <Widget>{WIDGETS[item.i]}</Widget>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

export default Dashboard;
