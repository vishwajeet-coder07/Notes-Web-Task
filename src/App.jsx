import React, { useState, useEffect } from 'react'
import './App.css'
import QuillEditor from './components/QuillEditor'

function App() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', id: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const quillEditorRef = React.useRef(null);


  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    if (savedTheme !== null) {
      const isDark = JSON.parse(savedTheme);
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  
    if (darkMode) {
      document.documentElement.classList.add('dark');
      console.log('🌙 Dark mode activated - Added "dark" class to document');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('☀️ Light mode activated - Removed "dark" class from document');
    }

    console.log('Current document classes:', document.documentElement.className);
  }, [darkMode]);

  const saveNote = () => {
    if (!currentNote.title.trim() && !currentNote.content.trim()) return;
    
    const noteToSave = {
      id: currentNote.id || Date.now(),
      title: currentNote.title || 'Untitled',
      content: currentNote.content,
      createdAt: currentNote.id ? notes.find(n => n.id === currentNote.id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (currentNote.id) {
   
      setNotes(prev => prev.map(note => note.id === currentNote.id ? noteToSave : note));
    } else {
      setNotes(prev => [noteToSave, ...prev]);
      setCurrentNote({ ...noteToSave });
    }
    
    setSidebarOpen(false);
  };

  const newNote = () => {
    setCurrentNote({ title: '', content: '', id: null });
    setSidebarOpen(false);
  };

  const selectNote = (note) => {
    setCurrentNote(note);
    setSidebarOpen(false);
  };

  const deleteNote = (noteId) => {
    console.log('🗑️ Deleting note with ID:', noteId);
    
    // Remove note from the notes array
    setNotes(prev => {
      const updatedNotes = prev.filter(note => note.id !== noteId);
      console.log('📋 Notes after deletion:', updatedNotes.length, 'remaining');
      return updatedNotes;
    });
    
    // If the deleted note is currently selected, clear the editor
    if (currentNote.id === noteId) {
      console.log('📝 Clearing editor since deleted note was selected');
      setCurrentNote({ title: '', content: '', id: null });
    }
    
    console.log('✅ Note deletion completed');
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };



  return (
    <div 
      className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300"
      style={{
        backgroundColor: darkMode ? '#111827' : '#f3f4f6',
        color: darkMode ? '#ffffff' : '#1f2937'
      }}
    >
        {/* Sidebar */}
        <div 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static lg:inset-0
            fixed inset-y-0 left-0 z-50
            w-80 bg-white dark:bg-gray-800
            shadow-lg lg:shadow-none
            transform transition-all duration-300 ease-in-out
            flex flex-col
          `}
          style={{
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            color: darkMode ? '#ffffff' : '#1f2937',
            borderColor: darkMode ? '#374151' : '#e5e7eb'
          }}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 
                className="text-xl font-bold text-gray-800 dark:text-white"
                style={{ color: darkMode ? '#ffffff' : '#1f2937' }}
              >
                My Notes
              </h1>
              <div className="text-xs mt-1">
                <span style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                  Theme: <strong style={{ color: darkMode ? '#ffffff' : '#1f2937' }}>{darkMode ? 'DARK MODE' : 'LIGHT MODE'}</strong>
                </span>
                <div 
                  className="inline-block w-4 h-4 ml-2 rounded"
                  style={{ backgroundColor: darkMode ? '#fbbf24' : '#3b82f6' }}
                  title="Theme indicator"
                ></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Dark Mode Toggle button */}
              <button
                onClick={() => {
                  console.log('🔄 Theme button clicked! Current darkMode:', darkMode);
                  console.log('🔄 Will change to:', !darkMode ? 'DARK' : 'LIGHT');
                  setDarkMode(!darkMode);
                }}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
              
              {/* Close Sidebar (Mobile) */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* New Note Button */}
          <div className="p-4">
            <button
              onClick={newNote}
              className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Note</span>
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                style={{
                  backgroundColor: darkMode ? '#374151' : '#f3f4f6',
                  color: darkMode ? '#ffffff' : '#111827'
                }}
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto px-4">
            <div className="space-y-2">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">{searchTerm ? 'No notes found' : 'No notes yet'}</p>
                  <p className="text-xs mt-1">{searchTerm ? 'Try a different search' : 'Create your first note!'}</p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-colors group relative
                      ${
                        currentNote.id === note.id
                          ? 'bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate pr-2">
                        {note.title || 'Untitled'}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🗑️ Delete button clicked for note:', note.title || 'Untitled');
                          
                          const confirmDelete = window.confirm(`Are you sure you want to delete "${note.title || 'Untitled'}"?`);
                          if (confirmDelete) {
                            console.log('✅ User confirmed deletion');
                            deleteNote(note.id);
                          } else {
                            console.log('❌ User cancelled deletion');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 transition-all transform hover:scale-110"
                        title={`Delete "${note.title || 'Untitled'}"`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                      {note.content.slice(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 p-4 lg:p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto h-full">
              <div 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-full flex flex-col transition-colors duration-300"
                style={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#1f2937'
                }}
              >
                <input
                  type="text"
                  placeholder="Note title..."
                  value={currentNote.title}
                  onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
                  className="w-full text-2xl font-bold mb-6 p-3 border-b-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  style={{
                    color: darkMode ? '#ffffff' : '#111827',
                    borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                  }}
                />
                
                {/* Quill Rich Text Editor */}
                <QuillEditor 
                  ref={quillEditorRef}
                  currentNote={currentNote}
                  setCurrentNote={setCurrentNote}
                  darkMode={darkMode}
                />
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={saveNote}
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Note</span>
                  </button>
                  <button
                    onClick={newNote}
                    className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Note</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
    </div>
  )
}
export default App;