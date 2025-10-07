import React, { useState } from 'react'

function Login({ onLogin, onToggleAuth, darkMode }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const result = await onLogin(formData.email, formData.password)
      
      if (!result.success) {
        setErrors({ general: result.error || 'Invalid email or password' })
      }
    } catch {
      setErrors({ general: 'Login failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-8 px-4 transition-colors duration-300"
      style={{
        backgroundColor: darkMode ? '#0f172a' : '#f8fafc'
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
          >
            Welcome Back
          </h1>
          <p 
            className="text-base"
            style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div 
          className="p-8 rounded-xl shadow-xl border"
          style={{
            backgroundColor: darkMode ? '#1e293b' : '#ffffff',
            borderColor: darkMode ? '#334155' : '#e2e8f0'
          }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errors.general && (
              <div 
                className="p-4 rounded-lg text-sm font-medium flex items-start gap-3"
                style={{
                  backgroundColor: darkMode ? '#7f1d1d' : '#fee2e2',
                  color: darkMode ? '#fca5a5' : '#dc2626',
                  border: `1px solid ${darkMode ? '#991b1b' : '#fecaca'}`
                }}
              >
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold mb-2"
                style={{ color: darkMode ? '#f1f5f9' : '#334155' }}
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors duration-200"
                style={{
                  backgroundColor: darkMode ? '#334155' : '#ffffff',
                  borderColor: errors.email ? '#ef4444' : (darkMode ? '#475569' : '#e2e8f0'),
                  color: darkMode ? '#ffffff' : '#1e293b'
                }}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold mb-2"
                style={{ color: darkMode ? '#f1f5f9' : '#334155' }}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors duration-200"
                style={{
                  backgroundColor: darkMode ? '#334155' : '#ffffff',
                  borderColor: errors.password ? '#ef4444' : (darkMode ? '#475569' : '#e2e8f0'),
                  color: darkMode ? '#ffffff' : '#1e293b'
                }}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Toggle to Register */}
          <div className="mt-6 text-center">
            <p 
              className="text-sm mb-3"
              style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
            >
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={onToggleAuth}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login