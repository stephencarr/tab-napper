import React from 'react';
import { GripVertical } from 'lucide-react';

const Widget = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div {...props} ref={ref} className="calm-card bg-white dark:bg-calm-800 p-6 rounded-lg shadow-sm flex flex-col">
      <div className="flex-grow">
        {children}
      </div>
      <div className="drag-handle cursor-move self-center">
        <GripVertical className="text-calm-400 dark:text-calm-500" />
      </div>
    </div>
  );
});

export default Widget;
