import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, FileText, Edit, Eye } from 'lucide-react';
import { loadAppState, saveAppState } from '../utils/storage.js';
import { cn } from '../utils/cn.js';
import { useDarkMode } from '../hooks/useDarkMode.js';

/**
 * NoteEditor Component
 * Loads a note by ID from storage (triageHub_notes first, falls back to triageHub_inbox)
 * Allows editing markdown content with lightweight preview and auto-save.
 */
export default function NoteEditor({ noteId }) {
  // Apply system dark mode
  useDarkMode();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled Note');
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const lastSavedContentRef = useRef('');
  const currentCollectionsRef = useRef({ inInbox: false, inNotes: false });

  // Derive title from first non-empty line
  const generateTitle = (text) => {
    if (!text || !text.trim()) return 'Untitled Note';
    const first = text.split('\n').find((l) => l.trim()) || '';
    const clean = first
      .replace(/^#+\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .trim();
    return clean.length > 80 ? clean.slice(0, 80) + '…' : clean || 'Untitled Note';
  };

  const renderMarkdown = useMemo(() => {
    const convert = (text) => {
      try {
        let html = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-calm-900 dark:text-calm-100 mb-2 mt-3 leading-tight">$1</h3>')
          .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-calm-900 dark:text-calm-100 mb-3 mt-4 leading-tight">$1</h2>')
          .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-calm-900 dark:text-calm-100 mb-3 mt-4 leading-tight">$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-calm-900 dark:text-calm-100">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-calm-800 dark:text-calm-200">$1</em>')
          .replace(/`(.*?)`/g, '<code class="bg-calm-100 dark:bg-calm-800 px-2 py-1 rounded text-sm font-mono text-calm-900 dark:text-calm-100 border dark:border-calm-600">$1</code>')
          .replace(/\n\n/g, '</p><p class="mb-3 text-calm-800 dark:text-calm-200 leading-relaxed">')
          .replace(/\n/g, '<br>');
        const lines = html.split('<br>');
        const processed = [];
        let inList = false;
        for (const line of lines) {
          const m = line.match(/^- (.*)$/);
          if (m) {
            if (!inList) {
              processed.push('<ul class="list-disc ml-5 mb-3 text-calm-800 dark:text-calm-200 leading-relaxed space-y-1">');
              inList = true;
            }
            processed.push(`<li class="pl-1">${m[1]}</li>`);
          } else {
            if (inList) { processed.push('</ul>'); inList = false; }
            if (line.trim()) processed.push(line);
          }
        }
        if (inList) processed.push('</ul>');
        html = processed.join('<br>');
        if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<p')) {
          html = `<p class="mb-3 text-calm-800 dark:text-calm-200 leading-relaxed">${html}</p>`;
        }
        return html;
      } catch {
        return text;
      }
    };
    return convert;
  }, []);

  // Load note from storage by ID
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [notes, inbox] = await Promise.all([
          loadAppState('triageHub_notes'),
          loadAppState('triageHub_inbox')
        ]);
        const fromNotes = (notes || []).find((n) => n.id === noteId);
        const fromInbox = (inbox || []).find((n) => n.id === noteId);
        const note = fromNotes || fromInbox;
        currentCollectionsRef.current = { inInbox: !!fromInbox, inNotes: !!fromNotes };
        if (note) {
          setContent(note.description || note.content || '');
          const t = note.title || generateTitle(note.description || note.content || '');
          setTitle(t);
          document.title = `${t} • Note`;
          lastSavedContentRef.current = note.description || note.content || '';
        } else {
          // Create a placeholder note in notes collection
          const now = Date.now();
          const newNote = {
            id: noteId,
            title: 'Untitled Note',
            description: '',
            content: '',
            url: '',
            timestamp: now,
            type: 'note',
            source: 'note-editor',
            isNote: true,
            wordCount: 0
          };
          const existing = (notes || []);
          await saveAppState('triageHub_notes', [newNote, ...existing]);
          currentCollectionsRef.current = { inInbox: false, inNotes: true };
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [noteId]);

  // Auto-save every 3s when content changed
  useEffect(() => {
    const interval = setInterval(async () => {
      const current = content;
      if (current === lastSavedContentRef.current) return;
      await doSave('autosave');
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, title]);

  async function doSave(reason = 'manual') {
    try {
      setIsSaving(true);
      const newTitle = generateTitle(content);
      setTitle(newTitle);
      document.title = `${newTitle} • Note`;

      const [notes, inbox] = await Promise.all([
        loadAppState('triageHub_notes').then((v) => v || []),
        loadAppState('triageHub_inbox').then((v) => v || [])
      ]);

      const updateItem = (item) => ({
        ...item,
        title: newTitle,
        description: content,
        content,
        timestamp: item.timestamp || Date.now(),
        isNote: true,
        type: 'note',
        wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
        lastEditedAt: Date.now(),
      });

      let notesUpdated = false;
      let inboxUpdated = false;

      const notesOut = notes.map((n) => (n.id === noteId ? (notesUpdated = true, updateItem(n)) : n));
      const inboxOut = inbox.map((n) => (n.id === noteId ? (inboxUpdated = true, updateItem(n)) : n));

      // If not present in notes, add it there as canonical storage
      const canonical = updateItem({ id: noteId });
      const finalNotes = notesUpdated ? notesOut : [canonical, ...notesOut];

      await Promise.all([
        saveAppState('triageHub_notes', finalNotes),
        saveAppState('triageHub_inbox', inboxUpdated ? inboxOut : inbox)
      ]);

      lastSavedContentRef.current = content;
      setLastSavedAt(Date.now());
      console.log(`[NoteEditor] Saved (${reason})`);
    } catch (err) {
      console.error('[NoteEditor] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-calm-50 dark:bg-calm-900 flex items-center justify-center">
        <div className="text-center text-calm-600 dark:text-calm-300">Loading note…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-calm-50 dark:bg-calm-900">
      {/* Header */}
      <header className="bg-white dark:bg-calm-800 border-b border-calm-200 dark:border-calm-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-calm-600 dark:text-calm-400" />
            <span className="text-sm text-calm-500 dark:text-calm-400">Note</span>
            {lastSavedAt && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 px-2 py-1 rounded-full">
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreview((v) => !v)}
              className={cn('px-3 py-1.5 text-xs rounded-md transition-colors',
                isPreview ? 'bg-calm-600 text-white' : 'text-calm-600 dark:text-calm-400 hover:bg-calm-100 dark:hover:bg-calm-700')}
            >
              {isPreview ? <Edit className="h-3 w-3 inline mr-1"/> : <Eye className="h-3 w-3 inline mr-1"/>}
              {isPreview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => doSave('manual')}
              className="calm-button-primary px-3 py-1 text-xs flex items-center space-x-1"
              disabled={isSaving}
            >
              <Save className="h-3 w-3" />
              <span>{isSaving ? 'Saving…' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            // Only update content-derived title if user left it empty
            if (!title.trim()) setTitle(generateTitle(content));
          }}
          className="w-full text-xl font-semibold bg-transparent outline-none mb-3 text-calm-900 dark:text-calm-100"
          placeholder="Untitled Note"
        />
        <div className="bg-white dark:bg-calm-800 border border-calm-200 dark:border-calm-700 rounded-lg">
          {isPreview ? (
            <div className="p-6">
              <div
                className="markdown-content max-w-none text-base leading-relaxed font-normal"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content || 'Start writing…') }}
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing…"
              className="w-full min-h-[300px] p-4 border-0 focus:outline-none resize-none font-mono text-sm leading-relaxed text-calm-800 dark:text-calm-200 placeholder-calm-400 dark:placeholder-calm-500 bg-white dark:bg-calm-800"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
