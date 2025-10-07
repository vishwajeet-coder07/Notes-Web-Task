import { supabase } from '../lib/supabase'
// Get all notes for the current user
export const getNotes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notes:', error.message)
    throw error
  }
}

// Create a new note
export const createNote = async (userId, title, content) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert([
        {
          user_id: userId,
          title: title || 'Untitled',
          content: content || '',
        }
      ])
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating note:', error.message)
    throw error
  }
}

// Update an existing note
export const updateNote = async (id, title, content) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({
        title: title || 'Untitled',
        content: content || ''

      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating note:', error.message)
    throw error
  }
}

// Delete a note
export const deleteNote = async (id) => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting note:', error.message)
    throw error
  }
}

// Search notes by title and content
export const searchNotes = async (userId, query) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching notes:', error.message)
    throw error
  }
}