# Web Application Implementation Plan

## Sermon Discussion Guide Generator

**Date:** January 30, 2026  
**Version:** 2.0 (Streamlined for 1-2 users)

---

## Executive Summary

This document outlines the plan to transform the current Python CLI application into a full-featured web application accessible to non-technical users. The web app will maintain all current functionality while adding user authentication, a web-based interface, WYSIWYG Markdown editing, and seamless PDF generation.

**Scale:** This application is designed for **1-2 users** generating approximately **4-12 discussion guides per month**. The architecture and hosting recommendations are optimized for this small-scale usage while maintaining flexibility for future growth if needed.

---

## Technology Stack

**Optimized for simplicity and zero cost:**

- **Frontend:** Next.js with React + Tailwind CSS
- **Backend:** Next.js API routes (no separate backend needed)
- **Database:** Vercel Postgres (free tier)
- **Authentication:** Google OAuth via NextAuth.js
- **Markdown Editor:** TipTap
- **PDF Generation:** pdfkit (in-memory generation)
- **Hosting:** Vercel (free tier)
- **Cost:** $0/month

---

## Current State Analysis

### Existing Features

- ✅ YouTube transcript retrieval
- ✅ Local transcript file processing
- ✅ AI-powered discussion guide generation (Google Gemini)
- ✅ Professional PDF export with custom fonts and branding
- ✅ Batch processing capability

### Current Limitations

- Requires technical knowledge (Git, Python, environment setup)
- Requires manual API key configuration
- No user interface
- No saved history or user accounts
- No editing capability after generation

---

## Architecture Overview

### Full-Stack Next.js Application

**Why Next.js for everything:**

- Single codebase for frontend and backend
- API routes handle Python script integration
- Built-in deployment to Vercel
- Zero configuration needed

**How Python integration works:**

- Python scripts deployed alongside Next.js app
- API routes spawn Python processes or use child_process
- Alternative: Convert core Python logic to JavaScript/TypeScript if needed (future consideration)

**Components:**

- **Frontend Pages:** React components with TipTap editor
- **API Routes:** `/api/transcript`, `/api/generate`, `/api/pdf`
- **Python Scripts:** Existing `main.py` functions refactored into callable modules
- **Database:** Vercel Postgres for user data and guide history
- **Authentication:** NextAuth.js with Google provider

---

## Key Features & Implementation

### 1. User Authentication

**Google Sign-In with NextAuth.js**

- User clicks "Sign in with Google"
- OAuth flow creates/updates user in database
- Session managed with HTTPOnly cookies

#### API Key Management

**Approach: Shared Application API Key**

The application will use a single Gemini API key for all users:

- Stored as environment variable in Vercel
- No user setup required
- Cost: ~$0.10-0.50/month for 4-12 guides (within free tier)
- Simple and transparent for 1-2 users

### 2. Input Processing

#### YouTube URL Input

- Input field with URL validation
- API endpoint extracts video ID and fetches transcript
- Returns transcript + metadata (title, date)

#### File Upload

- Drag-and-drop or file picker
- Accepts .txt, .srt files (max 5MB)
- Parses transcript using existing Python function
- Extracts metadata from filename

### 3. AI Guide Generation

- **Backend Endpoint:** `POST /api/generate`
- **Input:** Transcript text
- **Process:**
  1. Use shared Gemini API key from environment
  2. Call `generate_with_gemini()` with transcript
  3. Format markdown using `mdformat`
  4. Return generated markdown
  5. Store in database linked to user account

**Progress Indication:** Simple loading spinner with "Generating guide..." message (no real-time updates needed for 1-2 users)

- Takes transcript as input
- Calls Gemini API with shared key
- Formats markdown and returns to frontend
- Saves to database
- Shows loading spinner during generation
- Standard configuration, no custom plugins needed

### 5. PDF Generation & Download

**In-Memory Generation with Streaming**

- Generate PDF from markdown in server memory (BytesIO)
- Stream directly to browser as download
- No cloud storage needed
- Takes 30-60 seconds, show loading indicator
- Optional: Cache in database to avoid regeneration

**Implementation:**

- Modify existing `export_to_pdf()` to write to buffer
- Return as streaming HTTP response
- Set 120-second timeout

### 6. User Dashboard

#### Features

- **Recent Guides:** List of 10 most recent guides (title, date)
- **Quick Actions:** "New from YouTube" | "Upload Transcript"
- **Actions per Guide:**
  - View/Edit markdown
  - Generate & Download PDF
  - Delete

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_picture_url TEXT,
  -- gemini_api_key_encrypted removed (using shared app key)
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
  -- preferences removed (keeping it simple)
);
```

### Guides Table

```sql
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  source_type VARCHAR(20),  -- 'youtube' or 'upload'
  source_identifier TEXT,  -- YouTube URL or filename
  transcript TEXT,
  markdown_content TEXT,
  pdf_data BYTEA,  -- Optional: cached PDF binary (NULL until first generation)
  pdf_generated_at TIMESTAMP,  -- When PDF was last generated
  publish_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20)  -- 'draft', 'completed', 'archived'
);
```

---

## Hosting & Deployment Strategy

### Hosting: Vercel (Free Tier)

**Complete application hosted on Vercel:**

- ✅ Next.js application with API routes
- ✅ Python runtime support (via Vercel serverless functions)
- ✅ Automatic deployments from GitHub
- ✅ Zero configuration needed
- ✅ Free SSL certificate
- ✅ 100% free for this usage level

### Database: Vercel Postgres (Free Tier)

- 256MB storage (more than enough for 1-2 users)
- 60 hours compute/month
- Integrated with Vercel deployment
- **Usage estimate:** <5MB for 100+ guides

### Asset Storage

- Fonts: Bundled in application deployment
- Church logo: Stored in `/public` directory
- No external cloud storage needed

### Additional Services

**Environment Variables:**

- Stored in Vercel dashboard
- Never commit secrets to Git

**Monitoring:**

- Vercel provides basic logs (sufficient for 1-2 users)
- No additional monitoring needed

---

## Implementation Plan

### Weeks 1-3: Complete Working Application

**Goal:** Fully functional web app - this is the final product for 1-2 users

**Week 1: Project Setup & Python Integration**

- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Vercel Postgres database
- [ ] Create database schema (users, guides tables)
- [ ] Refactor Python scripts into callable modules
- [ ] Test Python integration with Next.js API routes
- [ ] Set up environment variables

**Week 2: Frontend & Core Features**

- [ ] Set up Tailwind CSS
- [ ] Implement Google OAuth with NextAuth.js
- [ ] Build main layout and dashboard
- [ ] Create input forms (YouTube URL + file upload)
- [ ] Build API routes:
  - `/api/transcript/youtube` - fetch YouTube transcript
  - `/api/transcript/upload` - parse uploaded file
  - `/api/generate` - generate discussion guide with Gemini
- [ ] Connect frontend to API routes

**Week 3: Editor, PDF & Deployment**

- [ ] Integrate TipTap WYSIWYG editor
- [ ] Implement auto-save to database
- [ ] Build PDF generation API route (`/api/pdf/generate`)
- [ ] Create in-memory PDF generation with streaming download
- [ ] Add loading indicators
- [ ] Implement guide history view
- [ ] Error handling and validation
- [ ] Deploy to Vercel
- [ ] Test end-to-end workflow

**Deliverable:** Fully functional web application deployed and ready to use

### Future Enhancements (Only if Needed)

After using the application, consider only if requested:

- [ ] Search functionality for guides
- [ ] Custom styling options
- [ ] Duplicate/template guides

---

## Development Environment Setup

### Prerequisites

- Node.js 20+ and npm/pnpm
- Python 3.11+
- Git
- Vercel CLI (optional for local testing)

### Local Development Workflow

```bash
# Install dependencies
npm install

# Set up environment variables (create .env.local)
cp .env.example .env.local

# Run development server
npm run dev  # Runs on localhost:3000

# Deploy to Vercel
vercel deploy
```

### Environment Variables Required

**.env.local:**

```bash
# Database (auto-configured by Vercel)
POSTGRES_URL=postgresql://...

# Google AI
GEMINI_API_KEY=AIza...

# Authentication
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## Security

### Essential Security Measures

- **API Key:** Stored in Vercel environment variables (never in code)
- **Authentication:** NextAuth.js with Google OAuth
- **Session:** HTTPOnly cookies
- **File Uploads:**
  - 5MB max size
  - .txt and .srt files only
  - Validate content before processing
- **Input Validation:** Sanitize all user inputs
- **CORS:** Configure for your domain only

---

## Cost Analysis

---

## Monitoring & Maintenance

**For 1-2 users: Minimal effort required**

- **Check Vercel dashboard if something breaks** - logs available there
- **Monthly:** Run `npm update` if security alerts appear in GitHub
- **That's it.** No complex monitoring needed.

---

## Risks & Mitigations

### PDF Generation Timeouts

**Risk:** PDF generation may take 30-60 seconds  
**Mitigation:** Show loading indicator, set timeout to 120 seconds

### YouTube API Changes

**Risk:** YouTube may change transcript access  
**Mitigation:** Using yt-dlp which adapts quickly; manual upload as fallback

### Font Licensing

**Risk:** Custom fonts may not be licensed for server use  
**Mitigation:** Verify licensing before deployment

---

## Success Criteria

- [ ] Users can sign in with Google
- [ ] Can process YouTube URLs and uploaded transcripts
- [ ] Generates discussion guides with AI
- [ ] WYSIWYG editor works smoothly
- [ ] PDFs download successfully
- [ ] Users prefer it over the CLI tool

---

## Conclusion

This plan provides a comprehensive roadmap to transform the CLI application into a user-friendly web application while staying within free hosting tiers.

**Optimized for 1-2 Users:**

- Total monthly cost: **$0** (all within free tiers)
- Implementation time: **2-3 weeks** for fully functional MVP
- Maintenance: **Minimal** (monthly security updates only)
- Complexity: **Low** (use shared API key, skip advanced features)

**Key Success Factors:**

1. Keep it simple (don't over-engineer for 1-2 users)
2. Reuse existing Python code where possible
3. Single deployment (Next.js on Vercel)
4. Zero ongoing costs
5. Minimal maintenance burden

**Next Steps:**

1. Review this plan
2. Set up Next.js project
3. Follow 3-week implementation schedule
4. Deploy to Vercel

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Google OAuth](https://next-auth.js.org/providers/google)
- [TipTap Editor](https://tiptap.dev/)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Vercel Deployment](https://vercel.com/docs)

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Maintained By:** GitHub Copilot
