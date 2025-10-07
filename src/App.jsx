import React, { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Register from './components/Register'
import Notes from './components/Notes'
import './App.css'

function AppContent() {
  const { isLoading, isAuthenticated, login, register } = useAuth()
  const [showLogin, setShowLogin] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode')
    if (savedTheme !== null) {
      const isDark = JSON.parse(savedTheme)
      setDarkMode(isDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleLogin = (email, password) => {
    return login(email, password)
  }

  const handleRegister = (email, password, fullName) => {
    return register(email, password, fullName)
  }

  const toggleAuthMode = () => {
    setShowLogin(!showLogin)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {showLogin ? (
          <Login 
            onLogin={handleLogin} 
            onToggleAuth={toggleAuthMode}
            darkMode={darkMode}
          />
        ) : (
          <Register 
            onRegister={handleRegister} 
            onToggleAuth={toggleAuthMode}
            darkMode={darkMode}
          />
        )}
      </>
    )
  }

  return (
    <Notes 
      darkMode={darkMode} 
      setDarkMode={setDarkMode}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App