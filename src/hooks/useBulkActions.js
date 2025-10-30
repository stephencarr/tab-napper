/**
 * Custom hook for managing bulk actions on lists
 * Handles selection state and bulk operations
 */

import { useState, useCallback } from 'react';

export function useBulkActions() {
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Toggle selection of an item
  const toggleSelection = useCallback((itemId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);
  
  // Select all items
  const selectAll = useCallback((items) => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, []);
  
  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  // Check if an item is selected
  const isSelected = useCallback((itemId) => {
    return selectedIds.has(itemId);
  }, [selectedIds]);
  
  // Get count of selected items
  const selectedCount = selectedIds.size;
  
  // Get array of selected IDs
  const getSelectedIds = useCallback(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);
  
  return {
    selectedIds,
    selectedCount,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    getSelectedIds
  };
}
