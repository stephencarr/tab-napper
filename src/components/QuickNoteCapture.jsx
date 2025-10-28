import React, { useState, useRef } from 'react';
import { Save, Edit, Eye, FileText } from 'lucide-react';
import { saveAppState, loadAppState } from '../utils/storage.js';
import { cn } from '../utils/cn.js';
import { renderMarkdown as renderMarkdownLib } from '../utils/markdown.js';

// Placeholder text for empty note (used in textarea and preview)
const PLACEHOLDER_MARKDOWN = `Start typing your note here...

Use **bold** and *italic* text, \`inline code\`, # headers, and - lists
Ctrl+Enter to save • Ctrl+E to preview`;

/**
 * Quick Note Capture Component
 * Simple markdown editor with raw/formatted modes for capturing quick notes
 * Injects notes into the Triage Inbox with type: 'note' flag
 */
function QuickNoteCapture({ className, onNoteSaved }) {
  const [noteContent, setNoteContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const textareaRef = useRef(null);

  // Generate title from note content (first line or first 50 chars)
  const generateTitle = (content) => {
    if (!content.trim()) return 'Untitled Note';
    
    // Get first line
    const firstLine = content.split('\n')[0].trim();
    if (firstLine) {
      // Remove markdown formatting from title
      const cleanTitle = firstLine
        .replace(/^#+\s*/, '') // Remove heading markers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`(.*?)`/g, '$1') // Remove code
        .trim();
      
      // Truncate if too long
      return cleanTitle.length > 50 
        ? cleanTitle.substring(0, 50) + '...'
        : cleanTitle;
    }
    
    // Fallback to first 50 characters
    return content.trim().substring(0, 50) + (content.trim().length > 50 ? '...' : '');
  };

  // Markdown to HTML conversion using a robust library + sanitization
  const renderMarkdown = (content) => {
    return renderMarkdownLib(content || '');
  };

  // Handle save note
  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      // Load current inbox
      const currentInbox = await loadAppState('triageHub_inbox') || [];
      
      // Create note item
      const timestamp = Date.now();
      const noteTitle = generateTitle(noteContent);
      
      // Calculate word count from body only (exclude title/heading)
      const trimmedContent = noteContent.trim();
      const lines = trimmedContent.split('\n');
      const firstLine = lines[0] || '';
      const isHeading = firstLine.trim().startsWith('#');
      const bodyOnly = isHeading ? lines.slice(1).join('\n').trim() : trimmedContent;
      const wordCount = bodyOnly ? bodyOnly.split(/\s+/).length : 0;
      
      const noteItem = {
        id: `note-${crypto.randomUUID()}`,
        title: noteTitle,
        content: noteContent,
        timestamp: timestamp,
        type: 'note',
        wordCount
      };      // Add to beginning of inbox (most recent first)
      const updatedInbox = [noteItem, ...currentInbox];
      
      // Save to storage
      await saveAppState('triageHub_inbox', updatedInbox);
      
      setLastSaved(Date.now());
      setNoteContent(''); // Clear after saving
      setIsPreviewMode(false); // Reset to edit mode
      
      console.log('[Tab Napper] 📝 Note saved to Triage Inbox:', noteItem.title);
      
      // Notify parent component if callback provided
      if (onNoteSaved) {
        onNoteSaved(noteItem);
      }
      
    } catch (error) {
      console.error('[Tab Napper] Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveNote();
    }
    
    // Ctrl/Cmd + E to toggle preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      setIsPreviewMode(!isPreviewMode);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-calm-600 dark:text-calm-400" />
          <h2 className="text-lg font-semibold text-calm-800 dark:text-calm-200">Quick Note</h2>
          {lastSaved && (
            <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="bg-white dark:bg-calm-800 border border-calm-200 dark:border-calm-700 rounded-lg overflow-hidden">
        {isPreviewMode ? (
          /* Preview Mode */
          <div className="p-6 min-h-[200px] bg-white dark:bg-calm-800">
            {noteContent.trim() ? (
              <div 
                className="markdown-content max-w-none text-base leading-relaxed font-normal"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(noteContent) 
                }}
              />
            ) : (
              <div 
                className="markdown-content max-w-none text-base leading-relaxed font-normal text-calm-400"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(PLACEHOLDER_MARKDOWN) 
                }}
              />
            )}
          </div>
        ) : (
          /* Edit Mode */
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER_MARKDOWN}
              className="w-full min-h-[200px] p-4 border-0 focus:outline-none resize-none font-mono text-sm leading-relaxed text-calm-800 dark:text-calm-200 placeholder-calm-400 dark:placeholder-calm-500 bg-white dark:bg-calm-800"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
            />
          </div>
        )}
        
        {/* Footer with Controls */}
        <div className="border-t border-calm-100 dark:border-calm-700 px-4 py-3 bg-calm-25 dark:bg-calm-750">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-calm-500 dark:text-calm-400">
              {noteContent.trim() && (
                <span>{noteContent.trim().split(/\s+/).length} words</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Preview Toggle */}
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={cn(
                  'flex items-center space-x-1 px-3 py-1.5 text-xs rounded-md transition-colors',
                  isPreviewMode
                    ? 'bg-calm-600 dark:bg-calm-500 text-white'
                    : 'text-calm-600 dark:text-calm-400 hover:bg-calm-100 dark:hover:bg-calm-700'
                )}
                title="Toggle Preview (Ctrl+E)"
              >
                {isPreviewMode ? <Edit className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
              </button>
              
              {/* Save Button */}
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim() || isSaving}
                className={cn(
                  'flex items-center space-x-2 px-3 py-1.5 text-xs rounded-md transition-colors',
                  !noteContent.trim() || isSaving
                    ? 'bg-calm-200 dark:bg-calm-700 text-calm-400 dark:text-calm-500 cursor-not-allowed'
                    : 'bg-calm-600 dark:bg-calm-500 text-white hover:bg-calm-700 dark:hover:bg-calm-400'
                )}
                title="Save Note (Ctrl+Enter)"
              >
                <Save className="h-3 w-3" />
                <span>{isSaving ? 'Saving...' : 'Save to Inbox'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuickNoteCapture;