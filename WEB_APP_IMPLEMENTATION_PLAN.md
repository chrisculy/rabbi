# Web Application Implementation Plan
## Sermon Discussion Guide Generator

**Date:** January 30, 2026  
**Version:** 1.0

---

## Executive Summary

This document outlines the plan to transform the current Python CLI application into a full-featured web application accessible to non-technical users. The web app will maintain all current functionality while adding user authentication, a web-based interface, WYSIWYG Markdown editing, and seamless PDF generation.

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

## Proposed Architecture

### Technology Stack

#### Backend
- **Framework:** Flask or FastAPI (Python)
  - Rationale: Preserves existing Python codebase, minimal refactoring needed
  - Recommendation: **FastAPI** for built-in async support and automatic API documentation
- **API Design:** RESTful API
- **File Storage:** Cloud storage for temporary files (Google Cloud Storage free tier or Cloudflare R2)

#### Frontend
- **Framework:** React with Vite or Next.js
  - Rationale: Rich ecosystem, component reusability, good developer experience
  - Recommendation: **Next.js** for server-side rendering and simplified deployment
- **UI Library:** Tailwind CSS + Shadcn/ui components
- **State Management:** React Context API or Zustand (for simplicity)

#### Markdown Editor
- **WYSIWYG Editor:** TipTap or Toast UI Editor
  - Recommendation: **TipTap** (extensible, React-friendly, good Markdown support)
  - Features: Real-time preview, Markdown shortcuts, toolbar

#### PDF Generation
- **Option 1:** Server-side with pdfkit (keep existing implementation)
- **Option 2:** Browser-based with Puppeteer/Playwright on backend
- **Recommendation:** Keep pdfkit for consistency, with Playwright as fallback for complex rendering

#### Database
- **Option 1:** Supabase (PostgreSQL with built-in auth)
- **Option 2:** MongoDB Atlas (free tier)
- **Recommendation:** **Supabase** for integrated auth, storage, and real-time features

#### Authentication
- **Provider:** Google OAuth 2.0
- **Implementation:** NextAuth.js (if using Next.js) or Authlib (if using FastAPI)

---

## Key Features & Implementation

### 1. User Authentication

#### Google Sign-In Flow
```
User clicks "Sign in with Google"
  ↓
Redirected to Google OAuth consent screen
  ↓
User authorizes application
  ↓
App receives OAuth token + user profile
  ↓
Create/update user record in database
  ↓
Issue session token/JWT
  ↓
Redirect to dashboard
```

#### API Key Management Challenge
**Important Note:** Google accounts do not automatically include Gemini API keys. Users must create them separately at [Google AI Studio](https://aistudio.google.com/app/apikey).

**Solution Options:**

**Option A: User-Provided API Key (Recommended for MVP)**
- After Google sign-in, prompt user to enter their Gemini API key
- Store encrypted in database per user
- Provide clear instructions with link to get key
- Validate key on first use
- Pros: Simple, secure, user controls their own quota
- Cons: Extra setup step for users

**Option B: Shared Application API Key**
- Application uses single API key for all users
- Implement rate limiting per user
- Monitor usage and costs
- Pros: Simpler for end users, no individual setup
- Cons: Potential cost concerns, quota sharing, security risks

**Option C: Google Cloud Billing Integration**
- Use Google Cloud Identity-Aware Proxy
- Users link their Google Cloud project
- Per-user billing through Google
- Pros: Complete user isolation, no shared costs
- Cons: Complex implementation, requires users to have Google Cloud account

**Recommendation for Phase 1:** Use Option A (user-provided API key) for MVP, with Option B as potential Phase 2 enhancement if demand justifies the cost management complexity.

### 2. Input Processing

#### YouTube URL Input
- **Frontend:** Input field with validation (URL format check)
- **Backend Endpoint:** `POST /api/transcript/youtube`
- **Process:**
  1. Validate YouTube URL format
  2. Extract video ID
  3. Call existing `get_youtube_transcript()` function
  4. Return transcript + video metadata (title, date)
  5. Save to database with status 'processing'

#### File Upload
- **Frontend:** Drag-and-drop zone or file picker
- **Accepted Formats:** .txt, .srt (transcript formats)
- **Backend Endpoint:** `POST /api/transcript/upload`
- **Process:**
  1. Validate file size (max 5MB) and format
  2. Parse transcript using existing `read_local_transcript()` function
  3. Extract metadata from filename if possible
  4. Return parsed transcript
  5. Save to database with status 'processing'

### 3. AI Guide Generation

- **Backend Endpoint:** `POST /api/generate`
- **Input:** Transcript text + user preferences
- **Process:**
  1. Retrieve user's stored API key
  2. Call `generate_with_gemini()` with transcript
  3. Format markdown using `mdformat`
  4. Return generated markdown
  5. Store in database linked to user account

**Real-time Updates:** Implement WebSocket or Server-Sent Events (SSE) for generation progress:
```
"Analyzing transcript..." → "Generating guide..." → "Formatting..." → "Complete!"
```

### 4. WYSIWYG Markdown Editor

#### Editor Features
- **Live Preview:** Split view (editor | preview)
- **Toolbar:** Bold, italic, headers, lists, links, blockquotes
- **Keyboard Shortcuts:** Standard Markdown shortcuts
- **Auto-save:** Save to database every 30 seconds
- **Export Options:** Download as .md file

#### Implementation with TipTap
```javascript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Markdown from 'tiptap-markdown'

const editor = useEditor({
  extensions: [
    StarterKit,
    Markdown,
  ],
  content: initialMarkdown,
  onUpdate: ({ editor }) => {
    handleAutoSave(editor.storage.markdown.getMarkdown())
  },
})
```

### 5. PDF Generation & Download

#### Implementation: In-Memory Generation with Streaming Response

**Backend Endpoint:** `POST /api/pdf/generate`

**Process:**
1. Receive markdown content from frontend
2. Use existing `export_to_pdf()` function modified to write to BytesIO buffer
3. Generate PDF in memory (no disk/cloud storage)
4. Stream PDF binary data as HTTP response with appropriate headers
5. Frontend receives binary data and triggers browser download

**Implementation Example:**
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from io import BytesIO
import pdfkit

@app.post("/api/pdf/generate")
async def generate_pdf(request: PDFRequest):
    # Generate HTML from markdown
    html_content = convert_markdown_to_html(request.markdown)
    
    # Configure pdfkit to write to BytesIO buffer
    pdf_buffer = BytesIO()
    pdfkit.from_string(
        html_content, 
        pdf_buffer,
        options=pdf_options,
        configuration=pdfkit_config
    )
    pdf_buffer.seek(0)
    
    # Return as streaming response
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}.pdf"
        }
    )
```

**Frontend Download Handling:**
```javascript
const downloadPdf = async (markdown) => {
  const response = await fetch('/api/pdf/generate', {
    method: 'POST',
    body: JSON.stringify({ markdown }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'discussion-guide.pdf';
  a.click();
  window.URL.revokeObjectURL(url);
};
```

**Pros:**
- No storage costs or management
- Better privacy (no files persisted)
- Simpler architecture
- Immediate download
- Reuses existing pdfkit code

**Cons:**
- Long-running request (30-60 seconds for complex PDFs)
- Requires careful timeout configuration
- No ability to "download again" without regenerating

**Mitigations:**
- Set appropriate timeout limits (120 seconds)
- Show loading indicator with progress updates
- Optionally cache generated PDFs in database for re-download (see below)

**Optional Enhancement: Database Caching**
For users who want to download the same PDF multiple times:
- Store PDF binary data in database `guides` table
- First generation: Create PDF, store in DB, return to user
- Subsequent downloads: Check if PDF exists in DB, return immediately
- Set retention policy (e.g., auto-delete after 30 days)

**Code Refactoring Required:**
The existing `export_to_pdf()` function needs to be modified to support in-memory generation:

```python
# Current implementation writes to file
def export_to_pdf(guide_markdown, video_title, video_publish_date, output_filename):
    pdfkit.from_string(html_doc, output_filename, options=options, configuration=pdfkit_config)
    
# New implementation for web app
def generate_pdf_buffer(guide_markdown, video_title, video_publish_date):
    from io import BytesIO
    pdf_buffer = BytesIO()
    
    # Generate HTML (same logic as before)
    html_doc = create_html_document(guide_markdown, video_title, video_publish_date)
    
    # Write to buffer instead of file
    pdfkit.from_string(html_doc, pdf_buffer, options=options, configuration=pdfkit_config)
    pdf_buffer.seek(0)
    
    return pdf_buffer
```

Note: pdfkit supports writing to file-like objects (BytesIO), making this a straightforward refactor.

#### Font & Asset Management
- Store custom fonts and logo directly on application server
- Include fonts in deployment package (Docker image or serverless function bundle)
- Use absolute file paths for wkhtmltopdf (existing implementation)
- For serverless deployments: Store fonts in `/tmp` directory or Lambda layers

### 6. User Dashboard

#### Features
- **Recent Guides:** List of generated guides (title, date, status)
- **Quick Actions:** "New from YouTube" | "Upload Transcript"
- **Search:** Search past guides by title or content
- **Actions per Guide:**
  - View/Edit markdown
  - Generate & Download PDF (on-demand)
  - Duplicate guide
  - Delete
- **Settings:**
  - Update Gemini API key
  - Choose default font preferences
  - Upload custom church logo

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
  gemini_api_key_encrypted TEXT,  -- Encrypted API key
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  preferences JSONB  -- Font choices, logo URL, etc.
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

### Transcripts Table (Optional - for caching)
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id VARCHAR(50) UNIQUE,
  transcript_text TEXT,
  video_title VARCHAR(500),
  video_publish_date DATE,
  cached_at TIMESTAMP DEFAULT NOW()
);
```

---

## Hosting & Deployment Strategy

### Recommended Architecture: Full-Stack on Vercel

#### Why Vercel?
- ✅ Free tier with generous limits
- ✅ Supports Next.js (frontend + API routes)
- ✅ Auto-scaling
- ✅ Built-in CI/CD from GitHub
- ✅ Custom domain support
- ✅ Serverless functions for backend API

#### Alternative: Split Deployment

**Frontend:** Vercel or Netlify
- Deploy Next.js/React app
- Connect to GitHub repo
- Auto-deploy on push to main branch

**Backend:** Railway or Fly.io
- Deploy FastAPI/Flask app as Docker container
- Railway free tier: $5 credit/month (~500 hours)
- Fly.io free tier: 3 shared VMs, 256MB RAM each

### Database: Supabase (Free Tier)
- 500MB database space
- 50,000 monthly active users
- 2GB bandwidth
- Unlimited API requests
- Note: If caching PDFs in database, monitor storage usage

### Cloud Storage: Cloudflare R2 (Optional)
- Not required for PDF storage (generated in-memory)
- Can be used for: User-uploaded logos, custom fonts (optional)
- Alternative: Store fonts directly in application deployment package

### Additional Services

**Environment Variables:**
- Store in Vercel/Railway dashboard
- Use for: Database URL, OAuth secrets, encryption keys

**Monitoring & Logging:**
- Vercel Analytics (free)
- Sentry for error tracking (free tier: 5K events/month)

**CDN:**
- Vercel Edge Network (included)
- Cloudflare (additional layer, free tier)

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-3)
**Goal:** Basic working web app with core features

**Week 1: Backend Foundation**
- [ ] Set up project structure (monorepo or separate repos)
- [ ] Refactor core functions into API endpoints
- [ ] Implement FastAPI routes for:
  - YouTube transcript retrieval
  - File upload and parsing
  - AI guide generation
  - PDF generation
- [ ] Set up Supabase database
- [ ] Implement database models and migrations
- [ ] Deploy backend to Railway/Fly.io

**Week 2: Frontend & Auth**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and component library
- [ ] Implement Google OAuth authentication
- [ ] Create user settings page for API key entry
- [ ] Build dashboard layout (header, sidebar, main content)
- [ ] Implement transcript input forms (YouTube URL + file upload)

**Week 3: Editor & PDF**
- [ ] Integrate TipTap editor component
- [ ] Implement markdown display and editing
- [ ] Build in-memory PDF generation endpoint
- [ ] Implement streaming response for PDF download
- [ ] Add download functionality with progress indicator
- [ ] Connect all frontend pages to backend APIs
- [ ] Basic error handling and loading states
- [ ] Test PDF generation with various content sizes

**Deliverable:** Working web app with all core features, deployed on free hosting

### Phase 2: Enhancement (Weeks 4-5)
**Goal:** Improve UX and add convenience features

- [ ] User dashboard with guide history
- [ ] Search and filter past guides
- [ ] Auto-save functionality in editor
- [ ] Improved loading states and animations
- [ ] Better error messages and validation
- [ ] Mobile-responsive design
- [ ] Batch processing UI (multiple videos at once)
- [ ] Email notifications when PDF is ready

### Phase 3: Polish & Launch (Week 6)
**Goal:** Production-ready application

- [ ] Security audit (API key encryption, input sanitization)
- [ ] Performance optimization (caching, lazy loading)
- [ ] Comprehensive testing (unit, integration, E2E)
- [ ] User documentation and help center
- [ ] Custom domain setup
- [ ] Beta testing with select users
- [ ] Monitoring and analytics setup
- [ ] Public launch

### Phase 4: Advanced Features (Post-Launch)
**Optional enhancements based on user feedback:**

- [ ] Collaborative editing (multiple users on same guide)
- [ ] Custom templates and styles
- [ ] Export to additional formats (Word, Google Docs)
- [ ] Integration with church management systems
- [ ] Mobile app (React Native or PWA)
- [ ] Bulk import of historical sermons
- [ ] Analytics dashboard (usage stats, popular topics)
- [ ] Social sharing features

---

## Development Environment Setup

### Prerequisites
- Node.js 20+ and npm/pnpm
- Python 3.11+
- Git
- Supabase CLI (for local database)
- Docker (optional, for backend container testing)

### Local Development Workflow

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload  # Runs on localhost:8000
```

**Frontend:**
```bash
cd frontend
pnpm install
pnpm dev  # Runs on localhost:3000
```

**Database:**
```bash
supabase start  # Runs local Postgres instance
supabase db reset  # Reset and apply migrations
```

### Environment Variables Required

**Backend (.env):**
```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=AIza...  # Fallback for testing only
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
JWT_SECRET=...
ENCRYPTION_KEY=...  # For API key encryption
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

---

## Security Considerations

### API Key Storage
- **Encrypt user-provided Gemini API keys** using Fernet (Python) or similar
- Store only encrypted version in database
- Decrypt only when needed for API calls
- Never expose in API responses or logs

### Authentication
- Use HTTPOnly cookies for session tokens
- Implement CSRF protection
- Set up rate limiting (10 requests/minute per user)
- Validate all user inputs

### File Uploads
- Scan uploaded files for malware (if possible in free tier)
- Limit file size (5MB max)
- Restrict file types (.txt, .srt only)
- Sanitize filenames before storing in database

### API Security
- CORS configuration (allow only frontend domain)
- API rate limiting
- Input validation and sanitization
- SQL injection prevention (use parameterized queries)
- XSS prevention (sanitize markdown output)

---

## Cost Analysis

### Free Tier Limits (Monthly)

| Service | Free Tier | Expected Usage | Cost if Exceeded |
|---------|-----------|----------------|------------------|
| Vercel | 100GB bandwidth, 100ms serverless exec time | Low (mostly static content) | $20/month for Pro |
| Railway | $5 credit (~500 hrs) | ~720 hrs/month (over limit) | $0.01/hr = ~$2/month overage |
| Supabase | 500MB DB, 2GB bandwidth | 50-100 MB DB (if caching PDFs), < 1GB bandwidth | $25/month for Pro |
| Google Gemini API | Free tier varies | ~5-10K tokens/guide | Pay-as-you-go after free tier |

**Total Expected Monthly Cost:** $0-5 (within free tiers for small user base)

**Break-even Analysis:**
- If users provide own API keys: $0-2/month (infrastructure only)
- If app provides API key: Depends on usage, estimated $10-50/month for 100-500 guides

**Recommendation:** Start with user-provided API keys to keep costs at $0, monitor usage, and consider shared API key if users request it and usage justifies cost.

---

## Monitoring & Maintenance

### Metrics to Track
- Number of active users
- Guides generated per day/week/month
- PDF generation requests and average generation time
- Average API response times
- Error rates by endpoint
- Database storage usage
- API costs (Gemini)

### Monitoring Tools (Free Tiers)
- **Sentry:** Error tracking and performance monitoring
- **Vercel Analytics:** Page views, loading times
- **Google Analytics:** User behavior (if needed)

### Maintenance Tasks
- **Weekly:** Review error logs, check database storage usage, monitor PDF generation times
- **Monthly:** Update dependencies, review security alerts, clean up old draft guides
- **Quarterly:** Performance optimization, database cleanup (vacuum), review timeout configurations

---

## Risks & Mitigations

### Risk 1: API Key Management
**Risk:** Users don't have or won't create Gemini API keys  
**Mitigation:** Clear onboarding flow with video tutorial; Consider shared API key option in future

### Risk 2: PDF Generation Performance
**Risk:** Server-side PDF generation is slow/resource-intensive, long-running requests may timeout  
**Mitigation:** 
- Configure appropriate timeouts (120s for Vercel Pro, 60s for Railway)
- Show loading indicator with estimated time
- Cache generated PDFs in database for re-downloads
- Consider upgrading to Railway/Fly.io for longer timeout limits if needed
- Alternative: Implement background job queue (Celery/BullMQ) with polling (more complex)

### Risk 3: Free Tier Limitations
**Risk:** Exceed free tier limits as user base grows  
**Mitigation:** Monitor usage closely, implement usage caps per user, plan for paid tier upgrade

### Risk 4: YouTube API Changes
**Risk:** YouTube may change transcript access  
**Mitigation:** Use yt-dlp which adapts quickly, have manual transcript upload as fallback

### Risk 5: Font/Asset Copyright
**Risk:** Custom fonts not licensed for server-side PDF generation  
**Mitigation:** Verify licensing allows server-side use, consider web-safe alternatives, or purchase appropriate license

### Risk 6: Request Timeouts
**Risk:** PDF generation exceeds serverless function timeout limits  
**Mitigation:** 
- Test PDF generation time with real content
- Use Railway/Fly.io instead of Vercel serverless if timeouts are an issue
- Implement background job queue as fallback (notify user when ready)
- Optimize PDF generation (simpler HTML, pre-load fonts)

---

## Success Metrics

### Phase 1 (MVP)
- [ ] 10 beta users successfully generate guides
- [ ] < 5 seconds average page load time
- [ ] Zero critical security vulnerabilities
- [ ] 95% uptime

### Phase 2 (Enhancement)
- [ ] 50+ registered users
- [ ] 100+ guides generated
- [ ] 80% user satisfaction (survey)
- [ ] < 3% error rate

### Phase 3 (Launch)
- [ ] 200+ registered users
- [ ] 500+ guides generated
- [ ] Featured on church tech blog/newsletter
- [ ] 90% of users return within 30 days

---

## Conclusion

This plan provides a comprehensive roadmap to transform the CLI application into a user-friendly web application while staying within free hosting tiers. The phased approach allows for iterative development and user feedback incorporation.

**Key Success Factors:**
1. Keep initial scope focused (MVP first)
2. Leverage existing Python codebase
3. Use proven, well-documented technologies
4. Prioritize user experience and simplicity
5. Monitor costs and usage closely

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Create GitHub project board with tasks
4. Begin Phase 1, Week 1 development

---

## Appendix

### Alternative Tech Stack Considerations

**Why not Django?**
- Heavier framework, more opinionated
- FastAPI is faster and more modern for APIs

**Why not Vue/Svelte instead of React?**
- React has larger ecosystem for Markdown editors
- Next.js provides excellent DX and deployment story

**Why not Firebase instead of Supabase?**
- Supabase is fully open-source
- PostgreSQL is more familiar for complex queries
- Similar free tier offerings

### Resources

**Documentation:**
- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/docs)
- [TipTap](https://tiptap.dev/)
- [Supabase](https://supabase.com/docs)
- [Vercel Deployment](https://vercel.com/docs)

**Example Projects:**
- [Next.js + FastAPI Template](https://github.com/tiangolo/full-stack-fastapi-template)
- [TipTap Markdown Editor Demo](https://tiptap.dev/docs/examples/markdown-shortcuts)
- [NextAuth.js Google OAuth](https://next-auth.js.org/providers/google)

**Community:**
- r/webdev for general web development questions
- r/nextjs for Next.js-specific questions
- r/FastAPI for backend API questions
- Stack Overflow for debugging

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Maintained By:** GitHub Copilot
