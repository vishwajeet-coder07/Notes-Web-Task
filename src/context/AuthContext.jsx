import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        })
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      const { error } = await supabase.auth.signOut()
      if (error && !error.message.includes('Auth session missing')) {
        throw error
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
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

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext