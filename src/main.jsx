import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import './styles.css';

// Simple router between triage hub and note editor based on pathname
const isNotePage = () => typeof window !== 'undefined' && window.location.pathname.endsWith('note.html');

const root = ReactDOM.createRoot(document.getElementById('root'));

// Extract note ID only if we're on the note page
let noteId = null;
if (isNotePage()) {
  const urlParams = new URLSearchParams(window.location.search);
  noteId = urlParams.get('id');
}

root.render(
  <React.StrictMode>
    {isNotePage() ? <NoteEditor noteId={noteId || `note-${Date.now()}`}/> : <App />}
  </React.StrictMode>
);