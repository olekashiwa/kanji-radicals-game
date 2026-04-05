# 🚀 Deployment Guide

## Prerequisites
- GitHub account
- Netlify account (free tier works)
- Firebase project with credentials

## Step 1: Prepare Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings → General
4. Copy all Firebase configuration values:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

## Step 2: Set Up Netlify Deployment

### Option A: Direct GitHub Integration (Recommended)

1. **Connect Repository:**
   - Visit [netlify.com](https://netlify.com) and log in
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Choose `olekashiwa/kanji-radicals-game`

2. **Configure Build Settings:**
   - Build command: (leave empty)
   - Publish directory: `.` (current directory)
   - Deploy branch: `main`

3. **Set Environment Variables:**
   - Click "Site settings" → "Build & Deploy" → "Environment"
   - Add these variables:
     ```
     FIREBASE_API_KEY=your_value
     FIREBASE_AUTH_DOMAIN=your_value
     FIREBASE_PROJECT_ID=your_value
     FIREBASE_STORAGE_BUCKET=your_value
     FIREBASE_MESSAGING_SENDER_ID=your_value
     FIREBASE_APP_ID=your_value
     ```

4. **Deploy:**
   - Click "Deploy site"
   - Netlify will generate a URL like `https://your-site.netlify.app`

### Option B: GitHub Actions (Auto-Deploy on Push)

1. **Add Netlify Secrets to GitHub:**
   - Go to Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add:
     - `NETLIFY_AUTH_TOKEN` - [Get from Netlify](https://app.netlify.com/user/applications/personal)
     - `NETLIFY_SITE_ID` - Found in Netlify Site Settings

2. **Workflow will auto-run** on every push to `main` branch

## Step 3: Verify Deployment

1. Visit your Netlify URL
2. Test all features:
   - Study mode
   - Quiz mode
   - Leaderboard (requires Firebase)
   - User progress tracking

## Step 4: Custom Domain (Optional)

1. In Netlify Site Settings → Domain management
2. Click "Add domain"
3. Follow DNS configuration instructions

## Troubleshooting

### Firebase not initializing
- Check all environment variables are set in Netlify
- Verify Firebase credentials are correct
- Check browser console for error messages

### CORS errors
- Firebase should handle CORS automatically
- If issues persist, configure CORS in Firebase Console

### Site shows blank page
- Check browser DevTools Console (F12)
- Verify all CSS and JS files are loading
- Clear browser cache

## Local Testing Before Deploy

```bash
# Test locally with a server
python -m http.server 8000

# Visit http://localhost:8000
# Check all functionality works
# Check browser console for errors
```

## Rollback

If deployment has issues:
1. Go to Netlify → Deploys
2. Find a previous working deployment
3. Click "Publish deploy"