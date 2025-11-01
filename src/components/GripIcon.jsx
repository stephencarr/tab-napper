import React from 'react';

/**
 * GripIcon - Reusable drag handle icon (6 dots in 2 columns)
 */
export default function GripIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="4" cy="4" r="1.5"/>
      <circle cx="12" cy="4" r="1.5"/>
      <circle cx="4" cy="8" r="1.5"/>
      <circle cx="12" cy="8" r="1.5"/>
      <circle cx="4" cy="12" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
    </svg>
  );
}
