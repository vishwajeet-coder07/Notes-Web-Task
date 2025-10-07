/**
 * Utility functions to handle authentication errors gracefully
 */

export const isAuthError = (error) => {
  if (!error) return false
  
  const authErrorMessages = [
    'Auth session missing',
    'Invalid session',
    'Session expired', 
    'Invalid JWT',
    'JWT expired',
    'Unauthorized'
  ]
  
  return authErrorMessages.some(msg => 
    error.message?.includes(msg) || 
    error.toString().includes(msg)
  )
}

export const isNetworkError = (error) => {
  if (!error) return false
  
  const networkErrorMessages = [
    'Network request failed',
    'Failed to fetch',
    'NetworkError',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED'
  ]
  
  return networkErrorMessages.some(msg => 
    error.message?.includes(msg) || 
    error.toString().includes(msg)
  )
}

export const handleAuthError = (error, logout) => {
  console.warn('🔐 Auth error detected:', error.message)
  
  if (isAuthError(error)) {
    console.log('🚪 Clearing auth state due to session error')
    if (logout && typeof logout === 'function') {
      logout()
    }
    return {
      shouldLogout: true,
      userMessage: 'Your session has expired. Please log in again.'
    }
  }
  
  if (isNetworkError(error)) {
    return {
      shouldLogout: false,
      userMessage: 'Network error. Please check your connection and try again.'
    }
  }
  
  return {
    shouldLogout: false,
    userMessage: 'An unexpected error occurred. Please try again.'
  }
}

export const isProduction = () => {
  return import.meta.env.PROD || 
         window.location.hostname !== 'localhost'
}

export const logErrorSafely = (message, error) => {
  // Only log detailed errors in development
  if (isProduction()) {
    console.error(message)
  } else {
    console.error(message, error)
  }
}