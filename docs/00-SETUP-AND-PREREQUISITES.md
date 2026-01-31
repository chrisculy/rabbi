# Setup and Prerequisites

**Before starting development, you must complete these manual setup steps.**

---

## 1. Google OAuth Application Setup

**Purpose:** Enable "Sign in with Google" functionality

### Steps:

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/

2. **Create a New Project** (or use existing)
   - Click "Select a project" → "New Project"
   - Name: `sermon-discussion-guide` (or your choice)
   - Click "Create"

3. **Enable Google+ API**
   - In the left sidebar: APIs & Services → Library
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - APIs & Services → OAuth consent screen
   - Select "External" (unless you have Google Workspace)
   - Click "Create"
   - Fill in required fields:
     - App name: `Sermon Discussion Guide Generator`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Scopes: Skip for now (defaults are fine)
   - Test users: Add your email address(es) - max 2 users
   - Click "Save and Continue"

5. **Create OAuth Client ID**
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: `Next.js Web App`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-app-name.vercel.app` (add after deploying)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-app-name.vercel.app/api/auth/callback/google` (add after deploying)
   - Click "Create"

6. **Save Your Credentials**
   - **Client ID:** Copy this - you'll need it as `GOOGLE_CLIENT_ID`
   - **Client Secret:** Copy this - you'll need it as `GOOGLE_CLIENT_SECRET`
   - ⚠️ **Keep these secret!** Never commit to Git

---

## 2. Google Gemini API Key

**Purpose:** AI-powered discussion guide generation

### Steps:

1. **Go to Google AI Studio**
   - Navigate to: https://aistudio.google.com/app/apikey

2. **Create API Key**
   - Click "Create API key"
   - Select a Google Cloud project (can use the same one from OAuth setup)
   - Click "Create API key in existing project" or "Create API key in new project"

3. **Copy Your API Key**
   - Copy the generated API key
   - You'll need this as `GEMINI_API_KEY`
   - ⚠️ **Keep this secret!** Never commit to Git

4. **Note Usage Limits**
   - Free tier: 1,500 requests/day, 1 million tokens/day
   - For 4-12 guides/month, you'll stay well within limits

---

## 3. Vercel Account Setup

**Purpose:** Hosting and deployment platform

### Steps:

1. **Sign Up for Vercel**
   - Navigate to: https://vercel.com/signup
   - Sign up with your GitHub account (recommended)

2. **Install Vercel CLI** (optional for local testing)
   ```bash
   npm install -g vercel
   ```

3. **Login via CLI** (if installed)
   ```bash
   vercel login
   ```

4. **Connect GitHub Repository**
   - Will be done in Week 3 when deploying

---

## 4. GitHub Repository Setup

**Purpose:** Version control and CI/CD

### Steps:

1. **Your repository already exists:** `chrisculy/rabbi`
   - Current branch: `master`

2. **Create a branch for web app development** (recommended)
   ```bash
   cd c:/code/rabbi
   git checkout -b web-app-development
   ```

3. **Add .gitignore entries**
   - Ensure `.env.local` is in .gitignore
   - Ensure `node_modules/` is in .gitignore
   - Ensure `.next/` is in .gitignore

---

## 5. Development Environment

**Purpose:** Local development tools

### Required Software:

1. **Node.js 20+**
   - Check version: `node --version`
   - If needed, download from: https://nodejs.org/

2. **Python 3.11+** ✅ (Already have 3.13.7)
   - Check version: `python --version`

3. **Git** ✅ (Already installed)
   - Check version: `git --version`

4. **Package Manager: npm or pnpm**
   - npm comes with Node.js
   - For pnpm (faster): `npm install -g pnpm`

5. **Code Editor: VS Code** ✅ (Already using)

---

## 6. Install wkhtmltopdf

**Purpose:** PDF generation on local machine

### Windows Installation:

1. **Download wkhtmltopdf**
   - Navigate to: https://wkhtmltopdf.org/downloads.html
   - Download Windows installer (64-bit recommended)

2. **Install**
   - Run installer
   - Default location: `C:\Program Files\wkhtmltopdf\`
   - Note: The existing code already points to this location

3. **Verify Installation**
   ```bash
   "C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe" --version
   ```

---

## 7. Prepare Existing Assets

**Purpose:** Ensure all required assets are available

### Check These Files Exist:

1. **Fonts** (in `c:\code\rabbi\assets\`):
   - `Mont-HeavyDEMO.otf`
   - `Mont-ExtraLightDEMO.otf`
   - `GothaProBla.otf`
   - `GotaProMed.otf`

2. **Logo** (in `c:\code\rabbi\assets\`):
   - `Kings Primary Black.png`

3. **Python Scripts**:
   - `c:\code\rabbi\main.py`
   - `c:\code\rabbi\requirements.txt`

---

## 8. Create Environment Variables Template

**Purpose:** Track required environment variables

### Create `.env.example` file:

```bash
# Copy this to .env.local and fill in your actual values

# Database (will be auto-filled by Vercel)
POSTGRES_URL=

# Google AI
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth
NEXTAUTH_SECRET=generate_random_string_here
NEXTAUTH_URL=http://localhost:3000
```

### Generate NEXTAUTH_SECRET:

Run this command to generate a secure random string:
```bash
openssl rand -base64 32
```

Or use Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 9. Checklist Before Starting Development

**Complete this checklist before proceeding to Week 1:**

- [ ] Google OAuth Client ID and Secret obtained
- [ ] Gemini API key obtained
- [ ] Vercel account created
- [ ] Node.js 20+ installed
- [ ] Python 3.11+ available (3.13.7 ✓)
- [ ] wkhtmltopdf installed and verified
- [ ] All font files present in `assets/`
- [ ] Logo file present in `assets/`
- [ ] `.env.example` file created
- [ ] `NEXTAUTH_SECRET` generated
- [ ] Git branch created for web app development

---

## 10. Record Your Credentials

**Create a secure note with these values** (use password manager, NOT a file in the repo):

```
GOOGLE_CLIENT_ID: [paste here]
GOOGLE_CLIENT_SECRET: [paste here]
GEMINI_API_KEY: [paste here]
NEXTAUTH_SECRET: [paste here]
```

You'll need these in Week 1 when setting up the Next.js project.

---

## Next Steps

Once all prerequisites are complete, proceed to:
- **[Week 1: Project Setup & Python Integration](./01-WEEK1-IMPLEMENTATION.md)**

---

**Estimated Time:** 30-45 minutes for all manual steps
