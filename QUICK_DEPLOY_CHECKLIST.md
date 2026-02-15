# Quick Vercel Deployment Checklist

## ✅ Python Migration Complete

All Python scripts have been migrated to TypeScript. Your app is now fully Vercel-compatible with all features working!

## Before Deploying

- [ ] Database is set up (Supabase/Neon/Railway)
- [ ] Environment variables are ready
- [ ] Google OAuth credentials configured
- [ ] Code is pushed to GitHub

## Environment Variables Needed

```bash
POSTGRES_URL=postgresql://...
NEXTAUTH_URL=https://your-site.vercel.app
NEXTAUTH_SECRET=<generate-random-32-chars>
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GEMINI_API_KEY=...
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Deployment Steps

### With GitHub (Recommended)

1. Push code to GitHub
2. Go to vercel.com and sign in
3. Click "Add New..." > "Project"
4. Import your GitHub repository
5. **IMPORTANT**: Set "Root Directory" to `web-app`
6. Add all environment variables
7. Click "Deploy"

### With Vercel CLI

```bash
npm install -g vercel
cd web-app
vercel --prod
```

## After Deployment

1. Go to Google Cloud Console
2. Add Vercel URL to OAuth redirect URIs:
   - `https://your-site.vercel.app/api/auth/callback/google`
3. Test login functionality
4. Run database migration if needed:
   ```bash
   # Set POSTGRES_URL in local .env
   npm run migrate
   ```

## Next Steps

1. Deploy to Vercel
2. Test all functionality (auth, transcript fetching, guide generation, PDF export)
3. Set up custom domain (optional)

## Performance Tips

**Build fails**: Check package.json dependencies
**Database error**: Verify POSTGRES_URL format and SSL
**Auth fails**: Check NEXTAUTH_URL and Google OAuth settings
**Python error**: Expected - see "Known Limitations" above
