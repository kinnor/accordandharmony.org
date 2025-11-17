/**
 * Frontend Configuration
 * Centralized configuration for the Accord and Harmony website
 */

const CONFIG = {
  // API Configuration
  api: {
    baseUrl: window.location.hostname === 'localhost'
      ? 'http://localhost:8787/api'
      : 'https://accordandharmony.org/api'
  },

  // OAuth Configuration
  oauth: {
    google: {
      clientId: '1080656509773-e0vi9gsuhgsvmdfibqn8ehvhfqptb9ig.apps.googleusercontent.com',
      scopes: 'email profile openid'
    },
    facebook: {
      appId: 'YOUR_FACEBOOK_APP_ID', // Configure when Facebook OAuth is enabled
      scopes: 'email'
    }
  },

  // Redirect URIs (dynamically generated based on current origin)
  redirects: {
    google: `${window.location.origin}/auth/google/callback`,
    facebook: `${window.location.origin}/auth/facebook/callback`
  },

  // Feature Flags
  features: {
    googleOAuth: true,
    facebookOAuth: false,
    emailRegistration: true,
    guestCheckout: false
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
