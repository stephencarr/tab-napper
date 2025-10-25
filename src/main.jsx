import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import NoteEditor from './components/NoteEditor.jsx';
import './styles.css';

// Simple router between triage hub and note editor based on pathname
const isNotePage = () => typeof window !== 'undefined' && window.location.pathname.includes('note.html');

const root = ReactDOM.createRoot(document.getElementById('root'));
const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('id');

root.render(
  <React.StrictMode>
    {isNotePage() ? <NoteEditor noteId={noteId || `note-${Date.now()}`}/> : <App />}
  </React.StrictMode>
);