import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { handleAuthError, logErrorSafely } from '../utils/authErrorHandler'

// Create Auth Context
const AuthContext = createContext()

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session with error handling
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          logErrorSafely('⚠️ Session initialization error:', error)
          setUser(null)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
          })
        }
      } catch (err) {
        console.error('❌ Auth initialization failed:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      console.log('✅ User logged in:', data.user.email)
      return { success: true }
    } catch (error) {
      console.error('❌ Login error:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Register function
  const register = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })
      
      if (error) throw error
      
      console.log('✅ User registered:', data.user?.email)
      return { success: true, needsConfirmation: !data.user?.email_confirmed_at }
    } catch (error) {
      console.error('❌ Registration error:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Check if we have a valid session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        logErrorSafely('⚠️ Session error during logout:', sessionError)
        // Clear local state even if session check fails
        setUser(null)
        return
      }

      const userEmail = user?.email || session?.user?.email || 'Unknown user'
      console.log('🚪 User logging out:', userEmail)
      
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        const errorInfo = handleAuthError(error, () => setUser(null))
        if (errorInfo.shouldLogout) {
          console.warn('⚠️ Session already expired, clearing local state')
          return
        }
        throw error
      }
      
      console.log('✅ Successfully logged out:', userEmail)
      setUser(null)
    } catch (error) {
      logErrorSafely('❌ Logout error:', error)
      // Always clear local state on logout attempt
      setUser(null)
    }
  }

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updatedData
      })
      
      if (error) throw error
      
      setUser(prev => ({ ...prev, ...updatedData }))
      console.log('📝 Profile updated for:', user?.email)
      return { success: true }
    } catch (error) {
      console.error('❌ Profile update error:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Refresh session - useful for handling expired sessions
  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()
      if (error) {
        logErrorSafely('⚠️ Session refresh failed:', error)
        const errorInfo = handleAuthError(error, () => setUser(null))
        if (errorInfo.shouldLogout) {
          setUser(null)
        }
        return false
      }
      return !!session
    } catch (error) {
      logErrorSafely('❌ Session refresh error:', error)
      setUser(null)
      return false
    }
  }

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext