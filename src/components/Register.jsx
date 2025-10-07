import React, { useState } from 'react'

function Register({ onRegister, onToggleAuth, darkMode }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

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

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const result = await onRegister(formData.email, formData.password, formData.name)
      
      if (!result.success) {
        setErrors({ general: result.error || 'Registration failed. Please try again.' })
      } else if (result.needsConfirmation) {
        setErrors({ 
          general: 'Please check your email and click the confirmation link to complete registration.' 
        })
      }

    } catch {
      setErrors({ general: 'Registration failed. Please try again.' })
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
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: darkMode ? '#ffffff' : '#1e293b' }}
          >
            Create Account
          </h1>
          <p 
            className="text-base"
            style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
          >
            Join us to organize your notes
          </p>
        </div>

        {/* Register Form */}
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
                className={`p-4 rounded-lg text-sm font-medium flex items-start gap-3 ${
                  errors.general.includes('Please check your email') 
                    ? '' 
                    : ''
                }`}
                style={{
                  backgroundColor: errors.general.includes('Please check your email') 
                    ? (darkMode ? '#064e3b' : '#d1fae5')
                    : (darkMode ? '#7f1d1d' : '#fee2e2'),
                  color: errors.general.includes('Please check your email')
                    ? (darkMode ? '#34d399' : '#059669')
                    : (darkMode ? '#fca5a5' : '#dc2626'),
                  border: `1px solid ${errors.general.includes('Please check your email')
                    ? (darkMode ? '#047857' : '#a7f3d0')
                    : (darkMode ? '#991b1b' : '#fecaca')}`
                }}
              >
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  {errors.general.includes('Please check your email') ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            {/* Name Field */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-semibold mb-2"
                style={{ color: darkMode ? '#f1f5f9' : '#334155' }}
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-0 focus:border-green-500 transition-colors duration-200"
                style={{
                  backgroundColor: darkMode ? '#334155' : '#ffffff',
                  borderColor: errors.name ? '#ef4444' : (darkMode ? '#475569' : '#e2e8f0'),
                  color: darkMode ? '#ffffff' : '#1e293b'
                }}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.name}
                </p>
              )}
            </div>

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
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-0 focus:border-green-500 transition-colors duration-200"
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-0 focus:border-green-500 transition-colors duration-200"
                style={{
                  backgroundColor: darkMode ? '#334155' : '#ffffff',
                  borderColor: errors.password ? '#ef4444' : (darkMode ? '#475569' : '#e2e8f0'),
                  color: darkMode ? '#ffffff' : '#1e293b'
                }}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-semibold mb-2"
                style={{ color: darkMode ? '#f1f5f9' : '#334155' }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:ring-0 focus:border-green-500 transition-colors duration-200"
                style={{
                  backgroundColor: darkMode ? '#334155' : '#ffffff',
                  borderColor: errors.confirmPassword ? '#ef4444' : (darkMode ? '#475569' : '#e2e8f0'),
                  color: darkMode ? '#ffffff' : '#1e293b'
                }}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm font-medium" style={{ color: '#ef4444' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Toggle to Login */}
          <div className="mt-6 text-center">
            <p 
              className="text-sm mb-3"
              style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
            >
              Already have an account?
            </p>
            <button
              type="button"
              onClick={onToggleAuth}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Sign In Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register