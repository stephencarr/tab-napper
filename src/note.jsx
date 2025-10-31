import React from 'react';
import ReactDOM from 'react-dom/client';
import NoteEditor from './components/NoteEditor.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('id');

root.render(
  <React.StrictMode>
    <ToastProvider>
      <NoteEditor noteId={noteId} />
    </ToastProvider>
  </React.StrictMode>
);
