# Firebase Authentication Setup Guide

## Google Sign-In Configuration

To fix the "unauthorized domain" error for Google Sign-In, follow these steps:

### 1. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `hitchit-prod-388b7`
3. Navigate to **Authentication** > **Settings** > **Authorized domains**
4. Add these domains:
   - `localhost` (for development)
   - Your Replit domain (e.g., `your-repl-name.replit.app`)
   - Any custom domains you plan to use

### 2. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `hitchit-prod-388b7`
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID
5. Add authorized JavaScript origins:
   - `http://localhost:5000`
   - `https://your-repl-name.replit.app`
6. Add authorized redirect URIs:
   - `http://localhost:5000`
   - `https://your-repl-name.replit.app`

### 3. Current Authentication Features

✅ **Working Features:**
- Email/password registration and login
- Password reset via email
- Real-time authentication state management
- Secure logout functionality
- User profile display in settings

⚠️ **Requires Configuration:**
- Google Sign-In (domain authorization needed)
- Apple Sign-In (requires Apple Developer account)

### 4. Test the Authentication

1. **Register a new account** with email/password
2. **Login with existing credentials**
3. **Reset password** using "Forgot password?" link
4. **Logout** from settings page

All authentication now uses real Firebase services with no test data.