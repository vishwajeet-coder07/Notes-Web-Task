import React, { useState, useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import '../App.css'
import { useAuth } from '../hooks/useAuth'
import { getNotes, createNote, updateNote, deleteNote as deleteNoteService, searchNotes } from '../services/notesService'
import GeminiService from '../services/geminiService'

function Notes({ darkMode, setDarkMode }) {
  const { user, logout } = useAuth()
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', id: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiResultType, setAiResultType] = useState('');
  const quillRef = useRef(null);
  const editorRef = useRef(null);
  const dropdownRef = useRef(null);
  const [filteredNotes, setFilteredNotes] = useState([]);


  const stripHtmlTags = (html) => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };


  const formatAiText = (text) => {
    if (!text) return '';
    
    const textColor = darkMode ? 'text-gray-200' : 'text-gray-800';
    
    // Simple formatting - convert line breaks to paragraphs and basic markdown
    return text
      .split('\n')
      .map(line => {
        if (!line.trim()) return '<br>';
        
        // Handle bullet points
        if (line.match(/^[*•-] /)) {
          return `<li class="${textColor}">${line.replace(/^[*•-] /, '')}</li>`;
        }
        
        // Handle bold text
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        return `<p class="mb-3 ${textColor}">${line}</p>`;
      })
      .join('');
  };


  useEffect(() => {
    const loadNotes = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const userNotes = await getNotes(user.id);
        setNotes(userNotes);
      } catch (err) {
        console.error('Failed to load notes from Supabase:', err);
        setError('Failed to load your notes. Using offline storage.');
        
        try {
          const userNotesKey = `notes_${user.id}`;
          const savedNotes = localStorage.getItem(userNotesKey);
          if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
          }
          setError('⚠️ Using local storage. Database setup required for cloud sync.');
        } catch (localErr) {
          console.error('Failed to load from localStorage:', localErr);
          setError('Failed to load notes. Please refresh the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user?.id, logout]);

  // Initialize Quill editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Start writing your note...',
        scrollingContainer: editorRef.current,
        modules: {
          toolbar: [
          
            ['bold', 'italic', 'underline', 'strike'],
            
            
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            
            [{ 'align': [] }],
            
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            
            [{ 'color': [] }, { 'background': [] }],
            
            ['link', 'blockquote', 'code-block'],
            
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'direction': 'rtl' }],
            
            ['clean']
          ]
        }
      });

      // Set up text change listener
      const handleTextChange = () => {
        if (quillRef.current) {
          const content = quillRef.current.root.innerHTML;
          setCurrentNote(prev => ({ 
            ...prev, 
            content: content 
          }));
        }
      };

      quillRef.current.on('text-change', handleTextChange);
      
      quillRef.current.textChangeHandler = handleTextChange;
    }
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      const editorContent = quillRef.current.root.innerHTML;
      const noteContent = currentNote.content || '';
      
      if (noteContent !== editorContent) {
        if (quillRef.current.textChangeHandler) {
          quillRef.current.off('text-change', quillRef.current.textChangeHandler);
        }
        
        if (noteContent.trim() === '') {
          quillRef.current.setText('');
        } else {
          try {
            quillRef.current.root.innerHTML = noteContent;
          } catch (error) {
            console.error('Error loading note content:', error);
            try {
              const delta = quillRef.current.clipboard.convert(noteContent);
              quillRef.current.setContents(delta);
            } catch (fallbackError) {
              console.error('Fallback method also failed:', fallbackError);
              quillRef.current.setText(stripHtmlTags(noteContent));
            }
          }
        }
        
        // Re-enable the text-change listener
        setTimeout(() => {
          if (quillRef.current && quillRef.current.textChangeHandler) {
            quillRef.current.on('text-change', quillRef.current.textChangeHandler);
          }
        }, 100);
      }
    }
  }, [currentNote.id, currentNote.content]);

  const saveNote = async () => {
    const plainContent = stripHtmlTags(currentNote.content);
    if (!currentNote.title.trim() && !plainContent.trim()) return;
    
    // Auto-suggest title if content exists but no title
    if (!currentNote.title.trim() && plainContent.trim() && plainContent.length > 20) {
      const shouldGenerateTitle = window.confirm(
        'Your note has content but no title. Would you like AI to generate a title for you?'
      );
      
      if (shouldGenerateTitle) {
        try {
          const generatedTitle = await GeminiService.generateTitle(plainContent);
          setCurrentNote(prev => ({ ...prev, title: generatedTitle.trim() }));
        } catch (error) {
          console.error('Failed to generate title:', error);
          // Continue with save even if title generation fails
        }
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (currentNote.id) {
        // Update existing note
        const updatedNote = await updateNote(
          currentNote.id,
          currentNote.title || 'Untitled',
          currentNote.content
        );
        setNotes(prev => prev.map(note => note.id === currentNote.id ? updatedNote : note));
      } else {
        // Create new note
        const newNoteData = await createNote(
          user.id,
          currentNote.title || 'Untitled',
          currentNote.content
        );
        setNotes(prev => [newNoteData, ...prev]);
        setCurrentNote(newNoteData);
      }
      
      setSidebarOpen(false);
    } catch (err) {
      console.error('Failed to save note to Supabase:', err);
      
      // Fallback to localStorage
      try {
        const plainContent = stripHtmlTags(currentNote.content);
        if (!currentNote.title.trim() && !plainContent.trim()) return;
        
        const noteToSave = {
          id: currentNote.id || Date.now(),
          title: currentNote.title || 'Untitled',
          content: currentNote.content,
          created_at: currentNote.id ? notes.find(n => n.id === currentNote.id)?.created_at || new Date().toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (currentNote.id) {
          setNotes(prev => prev.map(note => note.id === currentNote.id ? noteToSave : note));
        } else {
          setNotes(prev => [noteToSave, ...prev]);
          setCurrentNote(noteToSave);
        }
        
       
        const userNotesKey = `notes_${user.id}`;
        const updatedNotes = currentNote.id 
          ? notes.map(note => note.id === currentNote.id ? noteToSave : note)
          : [noteToSave, ...notes];
        localStorage.setItem(userNotesKey, JSON.stringify(updatedNotes));
        
        setSidebarOpen(false);
        setError('⚠️ Saved locally. Database setup required for cloud sync.');
      } catch (localErr) {
        console.error('Failed to save to localStorage:', localErr);
        setError('Failed to save note. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const newNote = () => {
    setCurrentNote({ title: '', content: '', id: null });
    setSidebarOpen(false);
  };

  // AI Processing Functions
  const handleAIAction = async (action) => {
    if (!quillRef.current) return;
    
    const text = quillRef.current.getText().trim();
    if (!text && action !== 'generateTitle') {
      setError('Please add some content to your note first.');
      return;
    }

    setAiProcessing(true);
    setError('');
    setAiDropdownOpen(false);

    try {
      let result;
      if (action === 'summarize') {
        result = await GeminiService.summarizeText(text);
        setAiResultType('Summary');
        setAiResult(result);
      } else if (action === 'explain') {
        result = await GeminiService.explainText(text);
        setAiResultType('Explanation');
        setAiResult(result);
      } else if (action === 'generateTitle') {
        if (!text) {
          setError('Please add some content to generate a title.');
          return;
        }
        result = await GeminiService.generateTitle(text);
        // Auto-fill the title input if it's empty or user confirms
        if (!currentNote?.title || currentNote?.title.trim() === '' || 
            window.confirm('Replace current title with AI-generated title?')) {
          setCurrentNote(prev => ({ ...prev, title: result.trim() }));
        }
        setAiResultType('Generated Title');
        setAiResult(`"${result}"`);
      } else if (action === 'suggestions') {
        result = await GeminiService.getWritingSuggestions(text);
        setAiResultType('Writing Suggestions');
        setAiResult(result);
      }
    } catch (error) {
      console.error('AI processing error:', error);
      setError(`Failed to ${action === 'generateTitle' ? 'generate title' : action === 'suggestions' ? 'get writing suggestions' : action} text. Please try again.`);
    } finally {
      setAiProcessing(false);
    }
  };

  const closeAiResult = () => {
    setAiResult('');
    setAiResultType('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAiDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectNote = (note) => {
    // Set the current note which will trigger the useEffect to load content
    setCurrentNote({
      id: note.id,
      title: note.title || '',
      content: note.content || ''
    });
    setSidebarOpen(false);
  };

  const deleteNote = async (noteId) => {
    setLoading(true);
    setError('');
    
    try {
      await deleteNoteService(noteId);
      
      // Remove note from the notes array
      setNotes(prev => prev.filter(note => note.id !== noteId));
      
      // If the deleted note is currently selected, clear the editor
      if (currentNote.id === noteId) {
        setCurrentNote({ title: '', content: '', id: null });
      }
    } catch (err) {
      console.error('Failed to delete note from Supabase:', err);
      
      // Fallback to localStorage
      try {
        // Remove note from the notes array
        setNotes(prev => {
          const updatedNotes = prev.filter(note => note.id !== noteId);
          
          const userNotesKey = `notes_${user.id}`;
          localStorage.setItem(userNotesKey, JSON.stringify(updatedNotes));
          
          return updatedNotes;
        });
        
        
        if (currentNote.id === noteId) {
          setCurrentNote({ title: '', content: '', id: null });
        }
        
        setError('Failed to delete from cloud. Deleted locally.');
      } catch (localErr) {
        console.error('Failed to delete from localStorage:', localErr);
        setError('Failed to delete note. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
        // Even if logout fails, we can redirect to login
        window.location.href = '/';
      }
    }
  };

  // Initialize filteredNotes with all notes when notes are loaded and no search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotes(notes);
    }
  }, [notes, searchTerm]);
  
  useEffect(() => {
    if (user?.id && notes.length > 0) {
      const userNotesKey = `notes_${user.id}`;
      localStorage.setItem(userNotesKey, JSON.stringify(notes));
    }
  }, [notes, user?.id]);


  useEffect(() => {
    const performSearch = async () => {
      if (!user?.id) return;
      
      // Only perform search when there is a search term
      if (searchTerm.trim()) {
        try {
          const searchResults = await searchNotes(user.id, searchTerm);
          setFilteredNotes(searchResults);
        } catch (err) {
          console.error('Search failed:', err);
        
          const localResults = notes.filter(note => {
            const plainContent = stripHtmlTags(note.content);
            return note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   plainContent.toLowerCase().includes(searchTerm.toLowerCase());
          });
          setFilteredNotes(localResults);
        }
      }
      // When searchTerm is empty, the other useEffect will handle showing all notes
    };

    performSearch();
  }, [searchTerm, notes, user?.id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };



  return (
    <div 
      className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 overflow-hidden"
      style={{
        backgroundColor: darkMode ? '#111827' : '#f3f4f6',
        color: darkMode ? '#ffffff' : '#1f2937'
      }}
    >
        {/* Enhanced Responsive Sidebar */}
        <div 
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 md:static md:inset-0
            fixed inset-y-0 left-0 z-50
            w-80 md:w-80
            shadow-2xl md:shadow-none
            transform transition-all duration-300 ease-in-out
            flex flex-col border-r
          `}
          style={{
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#ffffff' : '#1f2937',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          {/* Enhanced Responsive Sidebar Header */}
          <div className="p-4 sm:p-6 border-b" style={{ borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                    My Notes
                  </h1>
                  <p className="text-xs" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                  </p>
                </div>
              </div>
              
              {/* Close button for mobile/tablet */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                style={{
                  color: darkMode ? '#ffffff' : '#1f2937'
                }}
                title="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User info and controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium truncate" style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs truncate hidden sm:block" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  <span className="text-lg">
                    {darkMode ? '☀️' : '🌙'}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Responsive New Note Button */}
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={newNote}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Create New Note</span>
              <span className="sm:hidden">New Note</span>
            </button>
          </div>

          {/* Enhanced Responsive Search */}
          <div className="px-4 sm:px-6 pb-3 sm:pb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-0 transition-colors duration-200 text-sm sm:text-base"
                style={{
                  backgroundColor: darkMode ? '#334155' : '#f8fafc',
                  borderColor: searchTerm ? '#3b82f6' : (darkMode ? '#475569' : '#e2e8f0'),
                  color: darkMode ? '#ffffff' : '#1e293b'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-2 text-xs" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                Found {filteredNotes.length} {filteredNotes.length === 1 ? 'result' : 'results'} for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Enhanced Responsive Error Message */}
          {error && (
            <div className="px-4 sm:px-6 pb-3 sm:pb-4">
              <div 
                className="p-3 rounded-lg text-xs sm:text-sm flex items-start space-x-2 sm:space-x-3"
                style={{
                  backgroundColor: darkMode ? '#7f1d1d' : '#fee2e2',
                  color: darkMode ? '#fca5a5' : '#dc2626',
                  border: `1px solid ${darkMode ? '#991b1b' : '#fecaca'}`
                }}
              >
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}



          {/* Enhanced Responsive Notes List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    Loading your notes...
                  </p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                    {searchTerm ? 'No notes found' : 'No notes yet'}
                  </h3>
                  <p className="text-sm" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {searchTerm ? 'Try adjusting your search terms' : 'Create your first note to get started'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={newNote}
                      className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Create your first note
                    </button>
                  )}
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => selectNote(note)}
                    className={`
                      p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 group relative border hover:shadow-lg
                      ${
                        currentNote.id === note.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-md'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2 text-sm sm:text-base leading-tight flex-1">
                        {note.title || 'Untitled'}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const confirmDelete = window.confirm(`Are you sure you want to delete "${note.title || 'Untitled'}"?`);
                          if (confirmDelete) {
                            deleteNote(note.id);
                          }
                        }}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all duration-200 transform hover:scale-110 flex-shrink-0"
                        title={`Delete "${note.title || 'Untitled'}"`}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 leading-relaxed">
                      {stripHtmlTags(note.content).slice(0, 100)}{stripHtmlTags(note.content).length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {formatDate(note.updated_at || note.updatedAt)}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                          {stripHtmlTags(note.content).split(' ').filter(word => word.length > 0).length} words
                        </p>
                      </div>
                      {currentNote.id === note.id && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile/Tablet Header */}
          <div className="md:hidden flex items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center border border-gray-300 dark:border-gray-600"
              style={{
                color: darkMode ? '#ffffff' : '#1f2937',
                backgroundColor: darkMode ? '#374151' : '#f9fafb'
              }}
              title="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Notes</h1>
            <div className="flex items-center">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <span className="text-lg">{darkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>

          {/* Responsive Editor Container */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 transition-colors duration-300 overflow-y-auto">
            <div className="max-w-none lg:max-w-4xl xl:max-w-6xl mx-auto h-full">
              <div 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6 md:min-h-full flex flex-col transition-colors duration-300"
                style={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#1f2937'
                }}
              >
                {/* Responsive Title Bar with AI Dropdown */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={currentNote.title}
                    onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
                    className="flex-1 text-lg sm:text-xl lg:text-2xl font-bold p-2 sm:p-3 border-b-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    style={{
                      color: darkMode ? '#ffffff' : '#111827',
                      borderColor: darkMode ? '#4b5563' : '#e5e7eb'
                    }}
                  />
                  
                  {/* AI Actions Dropdown */}
                  <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                    <button
                      onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                      disabled={aiProcessing}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                      title="AI-powered text analysis"
                    >
                      {aiProcessing ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span>AI</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    {aiDropdownOpen && !aiProcessing && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                            AI-Powered Writing Assistant
                          </div>
                          <button
                            onClick={() => handleAIAction('summarize')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 group"
                            title="Generate a concise summary of your note content"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Summarize Text</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Get key points & main ideas</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAIAction('explain')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 group"
                            title="Get detailed explanations and context for your content"
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Explain Text</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Break down & clarify concepts</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAIAction('generateTitle')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 group"
                            title="Generate a catchy title based on your note content"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Generate Title</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Auto-create engaging titles</div>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAIAction('suggestions')}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 group"
                            title="Get AI-powered suggestions to improve your writing"
                          >
                            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                              <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">Writing Suggestions</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Improve clarity & style</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Responsive Quill Editor */}
                <div 
                  ref={editorRef}
                  className="flex-1 quill-editor md:overflow-y-auto"
                  style={{
                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                    borderRadius: '8px',
                    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                    minHeight: '300px',
                    maxHeight: window.innerWidth < 768 ? 'none' : '60vh',
                    overflowY: window.innerWidth < 768 ? 'visible' : 'auto'
                  }}
                />
                
                {/* Responsive Action Buttons */}
                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-3">
                  <button
                    onClick={saveNote}
                    disabled={loading}
                    className={`${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                    } text-white px-4 sm:px-6 py-2 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium flex-1 sm:flex-none`}
                  >
                    {loading ? 'Saving...' : 'Save Note'}
                  </button>
                  <button
                    onClick={newNote}
                    disabled={loading}
                    className={`${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700'
                    } text-white px-4 sm:px-6 py-2 sm:py-2 rounded-lg transition-colors text-sm sm:text-base font-medium flex-1 sm:flex-none`}
                  >
                    New Note
                  </button>
                </div>

                {/* Responsive AI Result Display */}
                {aiResult && (
                  <div 
                    className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg border-l-4 flex-shrink-0 transition-colors duration-300"
                    style={{
                      borderColor: '#8b5cf6',
                      backgroundColor: darkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 
                        className="text-base sm:text-lg font-semibold flex items-center space-x-2"
                        style={{
                          color: darkMode ? '#c4b5fd' : '#7c3aed'
                        }}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="truncate">AI {aiResultType}</span>
                      </h3>
                      <button
                        onClick={closeAiResult}
                        className="transition-colors hover:scale-110 transform p-1 flex-shrink-0"
                        style={{
                          color: darkMode ? '#c4b5fd' : '#7c3aed'
                        }}
                        title="Close AI result"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div 
                      className="leading-relaxed"
                      style={{
                        lineHeight: '1.6',
                        color: darkMode ? '#e5e7eb' : '#374151'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: formatAiText(aiResult) }} />
                    </div>
                    <div className="mt-2 sm:mt-3 flex space-x-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(aiResult)}
                        className="text-xs sm:text-sm px-3 py-1 sm:py-2 rounded transition-colors font-medium"
                        style={{
                          backgroundColor: darkMode ? '#7c3aed' : '#ede9fe',
                          color: darkMode ? '#e0e7ff' : '#7c3aed'
                        }}
                        title="Copy to clipboard"
                      >
                        Copy Result
                      </button>
                    </div>
                  </div>
                )}
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

export default Notes