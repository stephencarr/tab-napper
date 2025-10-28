import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, FileText, Edit, Eye, Bold as BoldIcon, Italic as ItalicIcon, Code as CodeIcon, Heading1, Heading2, List as ListIcon, Link as LinkIcon, Smile } from 'lucide-react';
import { loadAppState, saveAppState } from '../utils/storage.js';
import { cn } from '../utils/cn.js';
import { useDarkMode } from '../hooks/useDarkMode.js';
import { renderMarkdown as renderMarkdownLib } from '../utils/markdown.js';
import { calculateWordCount } from '../utils/wordCount.js';

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
  const [isPreview, setIsPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const lastSavedContentRef = useRef('');
  const currentCollectionsRef = useRef({ inInbox: false, inNotes: false });
  const textareaRef = useRef(null);
  const savedToastTimeoutRef = useRef(null);

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

  // Markdown rendering using shared robust library
  const renderMarkdown = (text) => renderMarkdownLib(text || '');

  // Load note from storage by ID
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [notes, inbox] = await Promise.all([
          loadAppState('triageHub_notes'),
          loadAppState('triageHub_inbox')
        ]);
        
        console.log('[NoteEditor] All notes:', notes);
        console.log('[NoteEditor] All inbox:', inbox);
        console.log('[NoteEditor] Looking for noteId:', noteId);
        
        const fromNotes = (notes || []).find((n) => n.id === noteId);
        const fromInbox = (inbox || []).find((n) => n.id === noteId);
        const note = fromNotes || fromInbox;
        currentCollectionsRef.current = { inInbox: !!fromInbox, inNotes: !!fromNotes };
        
        console.log('[NoteEditor] Found in notes:', fromNotes);
        console.log('[NoteEditor] Found in inbox:', fromInbox);
        console.log('[NoteEditor] Using note:', note);
        
        if (note) {
          const noteContent = note.description || note.content || '';
          setContent(noteContent);
          
          // Generate title from content if title is default or empty
          const hasDefaultTitle = !note.title || note.title === 'Untitled Note';
          const t = hasDefaultTitle ? generateTitle(noteContent) : note.title;
          
          console.log('[NoteEditor] Title logic:', { 
            hasDefaultTitle, 
            noteTitle: note.title, 
            generatedTitle: t,
            contentLength: noteContent.length 
          });
          
          setTitle(t);
          document.title = `${t} • Note`;
          lastSavedContentRef.current = noteContent;
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

      const updateItem = (item) => {
        const trimmedContent = content.trim();
        
        // Calculate word count from body only (exclude title/heading)
        const wordCount = calculateWordCount(content);
        
        return {
          ...item,
          title: newTitle,
          description: content,
          content,
          timestamp: item.timestamp || Date.now(),
          type: 'note',
          wordCount,
          lastEditedAt: Date.now(),
        };
      };

      let notesUpdated = false;
      let inboxUpdated = false;

      const notesOut = notes.map((n) => (n.id === noteId ? (notesUpdated = true, updateItem(n)) : n));
      const inboxOut = inbox.map((n) => (n.id === noteId ? (inboxUpdated = true, updateItem(n)) : n));

      // If not present in notes, add it there as canonical storage
      const newNoteEntry = updateItem({ id: noteId });
      const finalNotes = notesUpdated ? notesOut : [newNoteEntry, ...notesOut];

      await Promise.all([
        saveAppState('triageHub_notes', finalNotes),
        saveAppState('triageHub_inbox', inboxUpdated ? inboxOut : inbox)
      ]);

      lastSavedContentRef.current = content;
      setLastSavedAt(Date.now());
      setShowSavedToast(true);
      // Clear any existing timeout before setting a new one
      if (savedToastTimeoutRef.current) {
        clearTimeout(savedToastTimeoutRef.current);
      }
      savedToastTimeoutRef.current = setTimeout(() => setShowSavedToast(false), 1200);
      console.log(`[NoteEditor] Saved (${reason})`);
    } catch (err) {
      console.error('[NoteEditor] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  // Markdown helpers
  function wrapSelection(prefix, suffix = prefix) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const selected = content.slice(start, end) || 'text';
    const after = content.slice(end);
    const updated = `${before}${prefix}${selected}${suffix}${after}`;
    setContent(updated);
    // restore caret inside wrapped text
    const pos = start + prefix.length + selected.length + suffix.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function toggleHeading(level = 1) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    // Expand to full lines
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', end);
    const realEnd = lineEnd === -1 ? content.length : lineEnd;
    const segment = content.slice(lineStart, realEnd);
    const hash = '#'.repeat(level) + ' ';
    const updatedSegment = segment
      .split('\n')
      .map(line => {
        const stripped = line.replace(/^#+\s+/, '');
        return hash + stripped;
      })
      .join('\n');
    const updated = content.slice(0, lineStart) + updatedSegment + content.slice(realEnd);
    setContent(updated);
  }

  function makeList() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', end);
    const realEnd = lineEnd === -1 ? content.length : lineEnd;
    const segment = content.slice(lineStart, realEnd);
    const updatedSegment = segment
      .split('\n')
      .map(line => (line.startsWith('- ') ? line : `- ${line}`))
      .join('\n');
    const updated = content.slice(0, lineStart) + updatedSegment + content.slice(realEnd);
    setContent(updated);
  }

  function makeLink() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = content.slice(start, end) || 'link text';
    const url = typeof window !== 'undefined' ? window.prompt('Enter URL', 'https://') : '';
    if (url) {
      wrapSelection(`[`, `](${url})`);
    } else {
      wrapSelection('[', '](#)');
    }
  }

  // Emoji: minimal shortcode replacement and picker
  const EMOJI_MAP = {
    smile: '😄',
    grin: '😁',
    joy: '😂',
    wink: '😉',
    heart: '❤️',
    thumbs_up: '👍',
    thinking: '🤔',
    clap: '👏',
    fire: '🔥',
    star: '⭐',
    rocket: '🚀',
    tada: '🎉',
    writing_hand: '✍️',
    wave: '👋',
    eyes: '👀',
  };

  function replaceShortcodesOnSpace(e) {
    if (e.key !== ' ') return;
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    // Find the word before the cursor (ending at pos-1)
    const before = content.slice(0, pos);
    // Match :shortcode: at the end of 'before'
    const match = before.match(/(:[a-z0-9_+\-]+:)$/i);
    if (match) {
      const shortcode = match[1];
      const emojiName = shortcode.slice(1, -1); // remove leading/trailing ':'
      const emoji = EMOJI_MAP[emojiName];
      if (emoji) {
        // Replace the shortcode with the emoji
        const newBefore = before.slice(0, -shortcode.length) + emoji;
        const after = content.slice(pos);
        const updated = newBefore + after;
        setContent(updated);
        // Move cursor to after the emoji
        requestAnimationFrame(() => {
          el.focus();
          const newPos = newBefore.length;
          el.setSelectionRange(newPos, newPos);
        });
      }
    }
  }

  function insertEmoji(emoji) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const updated = `${before}${emoji}${after}`;
    setContent(updated);
    const pos = start + emoji.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
    setShowEmojiPicker(false);
  }

  // Editor hotkeys inside textarea
  function handleEditorKeyDown(e) {
    // Emoji shortcode replacement on space
    if (e.key === ' ' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      replaceShortcodesOnSpace(e);
      return; // let default space proceed
    }

    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;

    const key = e.key.toLowerCase();
    // Avoid interfering with IME or alt combos
    if (e.altKey) return;

    if (key === 'b') {
      e.preventDefault();
      e.stopPropagation();
      wrapSelection('**', '**');
    } else if (key === 'i') {
      e.preventDefault();
      e.stopPropagation();
      wrapSelection('*', '*');
    } else if (key === 'k') {
      e.preventDefault();
      e.stopPropagation();
      makeLink();
    } else if (key === '1') {
      e.preventDefault();
      e.stopPropagation();
      toggleHeading(1);
    } else if (key === '2') {
      e.preventDefault();
      e.stopPropagation();
      toggleHeading(2);
    } else if (key === 'l') {
      e.preventDefault();
      e.stopPropagation();
      makeList();
    } else if (e.key === '`') {
      e.preventDefault();
      e.stopPropagation();
      wrapSelection('`', '`');
    }
  }

  // Global hotkey: toggle Preview/Edit with Cmd/Ctrl+E
  useEffect(() => {
    const onKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.altKey) return;
      if (e.key && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsPreview((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      // Cleanup toast timeout on unmount
      if (savedToastTimeoutRef.current) {
        clearTimeout(savedToastTimeoutRef.current);
      }
    };
  }, []);

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
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                Saved {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPreview((v) => !v)}
              className={cn('px-3 py-1.5 text-xs rounded-md transition-colors',
                isPreview ? 'bg-calm-600 dark:bg-calm-500 text-white' : 'text-calm-600 dark:text-calm-400 hover:bg-calm-100 dark:hover:bg-calm-700')}
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
            <button
              onClick={async () => {
                try {
                  await doSave('manual');
                  window.close();
                } catch (err) {
                  window.alert('Failed to save note. Please try again.');
                }
              }}
              className="calm-button-primary px-3 py-1 text-xs flex items-center space-x-1"
              disabled={isSaving}
            >
              <Save className="h-3 w-3" />
              <span>Save & Close</span>
            </button>
          </div>
        </div>
      </header>

      {/* Formatting Toolbar (edit mode only) */}
      {!isPreview && (
        <div className="bg-white dark:bg-calm-800 border-b border-calm-200 dark:border-calm-700 px-6 py-2">
          <div className="max-w-4xl mx-auto flex items-center space-x-2 text-calm-600 dark:text-calm-400">
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Bold (**)" onClick={() => wrapSelection('**', '**')}><BoldIcon className="h-4 w-4"/></button>
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Italic (*)" onClick={() => wrapSelection('*', '*')}><ItalicIcon className="h-4 w-4"/></button>
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Inline code (`)" onClick={() => wrapSelection('`', '`')}><CodeIcon className="h-4 w-4"/></button>
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Heading 1" onClick={() => toggleHeading(1)}><Heading1 className="h-4 w-4"/></button>
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Heading 2" onClick={() => toggleHeading(2)}><Heading2 className="h-4 w-4"/></button>
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Bulleted list" onClick={makeList}><ListIcon className="h-4 w-4"/></button>
            <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Link" onClick={makeLink}><LinkIcon className="h-4 w-4"/></button>

            <div className="ml-auto relative">
              <button className="px-2 py-1 rounded hover:bg-calm-100 dark:hover:bg-calm-700" title="Emoji" onClick={() => setShowEmojiPicker((v) => !v)}>
                <Smile className="h-4 w-4"/>
              </button>
              {showEmojiPicker && (
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-lg shadow-lg border border-calm-200 dark:border-calm-700 bg-white dark:bg-calm-800 z-50">
                  <div className="grid grid-cols-8 gap-1 text-lg">
                    {Object.values(EMOJI_MAP).map((e, idx) => (
                      <button key={idx} onClick={() => insertEmoji(e)} className="hover:bg-calm-100 dark:hover:bg-calm-700 rounded" title="Insert emoji">{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            <>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                placeholder="Start writing…"
                className="w-full min-h-[300px] p-4 border-0 focus:outline-none resize-none font-mono text-sm leading-relaxed text-calm-800 dark:text-calm-200 placeholder-calm-400 dark:placeholder-calm-500 bg-white dark:bg-calm-800"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
              />
              <div className="px-4 pb-3 pt-1 border-t border-calm-200 dark:border-calm-700">
                <a
                  href="https://www.markdownguide.org/basic-syntax/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-calm-600 dark:text-calm-400 hover:text-calm-800 dark:hover:text-calm-200"
                  title="Markdown help"
                >
                  Markdown Help
                </a>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Saved toast */}
      {showSavedToast && (
        <div className="fixed bottom-4 right-4 px-3 py-2 rounded-md bg-calm-900 text-white dark:bg-calm-700 shadow-lg text-xs">
          Saved
        </div>
      )}
    </div>
  );
}
