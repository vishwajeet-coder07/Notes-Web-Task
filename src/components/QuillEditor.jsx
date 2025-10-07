import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const QuillEditor = forwardRef(({ 
  currentNote, 
  setCurrentNote, 
  darkMode, 
  placeholder = "Start writing your note..."
}, ref) => {
  const quillRef = useRef(null);
  const containerRef = useRef(null);
  const isUpdatingFromProp = useRef(false);

 
  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    if (typeof window.Quill === 'undefined') {
      const checkQuill = setInterval(() => {
        if (typeof window.Quill !== 'undefined') {
          clearInterval(checkQuill);
          initializeQuill();
        }
      }, 100);
      return () => clearInterval(checkQuill);
    } else {
      initializeQuill();
    }

    function initializeQuill() {
      const quill = new window.Quill(containerRef.current, {
        theme: 'snow',
        placeholder: placeholder,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean']
          ]
        }
      });

      quillRef.current = quill;

      // Handle text changes with debouncing
      let timeoutId = null;
      quill.on('text-change', (delta, oldDelta, source) => {
        if (!isUpdatingFromProp.current && source === 'user') {
          // Clear previous timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Debounce the update to prevent excessive re-renders
          timeoutId = setTimeout(() => {
            const htmlContent = quill.root.innerHTML;
            const textContent = quill.getText();
            
            // Only update if there's actual content or if we're clearing
            const finalContent = (textContent.trim() === '' || htmlContent === '<p><br></p>') ? '' : htmlContent;
            
            setCurrentNote(prev => {
              // Only update if content actually changed
              if (prev.content !== finalContent) {
                return {
                  ...prev,
                  content: finalContent
                };
              }
              return prev;
            });
          }, 100); // 100ms debounce
        }
      });

      // Set initial content
      if (currentNote.content) {
        isUpdatingFromProp.current = true;
        quill.root.innerHTML = currentNote.content;
        isUpdatingFromProp.current = false;
      }
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder, setCurrentNote]);

  // Handle initial content setup separately to avoid reinitializing editor
  useEffect(() => {
    if (quillRef.current && currentNote.content !== undefined) {
      isUpdatingFromProp.current = true;
      
      const currentContent = quillRef.current.root.innerHTML;
      const newContent = currentNote.content || '';
      
      // Only update if content is different
      if (currentContent !== newContent) {
        if (newContent === '') {
          quillRef.current.setText('');
        } else {
          // Use Quill's clipboard API for better formatting preservation
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newContent;
          const delta = quillRef.current.clipboard.convert(tempDiv);
          quillRef.current.setContents(delta);
        }
      }
      
      isUpdatingFromProp.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNote.id]); // Only update when switching to a different note

  // Apply dark mode styles
  useEffect(() => {
    if (containerRef.current) {
      const editorContainer = containerRef.current;
      const toolbar = editorContainer.querySelector('.ql-toolbar');
      const editor = editorContainer.querySelector('.ql-editor');
      
      if (darkMode) {
        editorContainer.classList.add('dark-mode');
        if (toolbar) {
          toolbar.style.backgroundColor = '#374151';
          toolbar.style.borderColor = '#4b5563';
          toolbar.style.color = '#ffffff';
        }
        if (editor) {
          editor.style.backgroundColor = '#1f2937';
          editor.style.color = '#ffffff';
          editor.style.borderColor = '#4b5563';
        }
      } else {
        editorContainer.classList.remove('dark-mode');
        if (toolbar) {
          toolbar.style.backgroundColor = '#ffffff';
          toolbar.style.borderColor = '#e5e7eb';
          toolbar.style.color = '#000000';
        }
        if (editor) {
          editor.style.backgroundColor = '#ffffff';
          editor.style.color = '#000000';
          editor.style.borderColor = '#e5e7eb';
        }
      }
    }
  }, [darkMode]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (quillRef.current) {
        quillRef.current.focus();
      }
    },
    getQuill: () => quillRef.current
  }));

  return (
    <div className="quill-editor-wrapper flex-1 flex flex-col">
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col"
        style={{ 
          minHeight: '200px',
          border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
          borderRadius: '8px',
          backgroundColor: darkMode ? '#1f2937' : '#ffffff'
        }}
      />
    </div>
  );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;