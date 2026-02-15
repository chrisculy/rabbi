# Vercel Deployment Guide for Rabbi App

## ✅ Migration Complete: Python → Node.js/TypeScript

**Good news!** All Python dependencies have been migrated to Node.js/TypeScript. Your app will now work fully on Vercel with no external services needed.

### What Was Migrated:
- ✅ YouTube transcript fetching (yt-dlp → youtube-transcript)
- ✅ AI guide generation (Python Gemini SDK → @google/genai)
- ✅ PDF generation (pdfkit + wkhtmltopdf → Puppeteer + Chromium)

All features work identically to before, but now deploy seamlessly to Vercel!

---

## Deployment Steps

### 1. Set Up Environment Variables in Vercel

Go to your Vercel project settings and add these environment variables:

```bash
# Database (required)
POSTGRES_URL=postgresql://user:password@host:port/database

# NextAuth (required)
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth (required)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Google Gemini API (required)
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to "APIs & Services" > "Credentials"
4. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
5. Add authorized JavaScript origins: `https://your-domain.vercel.app`

### 3. Set Up Database (Supabase/Neon/Railway)

#### Using Supabase (Recommended - Free Tier):
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Use **"Connection Pooling"** string for better performance
5. Run migration:
   ```bash
   cd web-app
   npm run migrate
   ```

#### Using Neon (Alternative):
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Run migration

### 4. Deploy to Vercel

#### Option 1: GitHub Integration (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. **Set Root Directory to `web-app`**
6. Add environment variables
7. Click "Deploy"

#### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from web-app directory
cd web-app
vercel --prod
```

### 5. Post-Deployment Checklist

- [ ] Test Google OAuth login
- [ ] Verify database connection
- [ ] Test guide fetching (may not work without Python fix)
- [ ] Test PDF generation (may not work without Python fix)
- [ ] Set up custom domain (optional)

---

## ✅ All Features Now Work on Vercel

The app has been fully migrated from Python to TypeScript. All features now work natively on Vercel:

1. **YouTube Transcript Fetching** - Uses `youtube-transcript` npm package
2. **AI Guide Generation** - Uses official `@google/genai` SDK
3. **PDF Generation** - Uses Puppeteer with `@sparticuz/chromium` for Vercel

No additional configuration needed beyond the standard deployment steps below!

---

## Troubleshooting

### Build Fails with "Cannot find module"
- Ensure all dependencies are in `package.json`
- Check that Shell.js and pg are listed in dependencies (not devDependencies)

### Database Connection Fails
- Verify `POSTGRES_URL` format: `postgresql://user:password@host:port/database`
- Ensure SSL is enabled for production databases
- Check database is not paused (Supabase free tier pauses after 7 days)

### NextAuth Session Issues
- Verify `NEXTAUTH_URL` matches your deployment URL
- Ensure `NEXTAUTH_SECRET` is set (generate new one with `openssl rand -base64 32`)
- Check Google OAuth redirect URIs are correct

### PDF Generation Issues
- Ensure Puppeteer and @sparticuz/chromium are installed
- Check that fonts are in public/assets directory
- Verify maxDuration is set in vercel.json (60 seconds)

---

## Performance Optimization

After deployment works:

1. Enable Edge Runtime for API routes (where possible)
2. Add ISR (Incremental Static Regeneration) for guide pages
3. Implement caching for transcripts
4. Use Vercel Analytics

---

## Next Steps

1. Deploy with current setup (Python features may not work)
2. Test what works and what doesn't
3. Let me know which approach you prefer:
   - Convert Python to Node.js (I can help)
   - Deploy Python to separate service
   - Hybrid approach
