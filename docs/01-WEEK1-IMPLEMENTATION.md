# Week 1: Project Setup & Python Integration

**Goal:** Set up Next.js project with database and Python integration

**Prerequisites:** Complete [00-SETUP-AND-PREREQUISITES.md](./00-SETUP-AND-PREREQUISITES.md) first

---

## Day 1: Initialize Next.js Project

### Step 1.1: Create Next.js Application

```bash
cd c:/code/rabbi
npx create-next-app@latest web-app --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**Answer the prompts:**
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **Yes**
- App Router: **Yes**
- Import alias: **Yes** (`@/*`)

### Step 1.2: Project Structure

The command creates this structure:
```
web-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── components/
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.mjs
```

### Step 1.3: Navigate to Project

```bash
cd web-app
```

### Step 1.4: Install Core Dependencies

```bash
npm install @vercel/postgres next-auth @tiptap/react @tiptap/starter-kit tiptap-markdown
npm install --save-dev @types/node
```

### Step 1.5: Install Python Integration Dependencies

```bash
npm install @types/shelljs shelljs
```

---

## Day 2: Set Up Vercel Postgres Database

### Step 2.1: Create Vercel Project

```bash
vercel
```

**Follow prompts:**
- Set up and deploy: **Yes**
- Which scope: Select your account
- Link to existing project: **No**
- Project name: `sermon-discussion-guide` (or your choice)
- Directory: `./` (current directory)
- Override settings: **No**

### Step 2.2: Create Postgres Database

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project

2. **Navigate to Storage Tab**
   - Click "Storage" in top navigation
   - Click "Create Database"
   - Select "Postgres"
   - Database name: `sermon-guides-db`
   - Region: Choose closest to you
   - Click "Create"

3. **Connect Database to Project**
   - Select your project from project list
   - Click "Connect"

### Step 2.3: Pull Environment Variables Locally

```bash
vercel env pull .env.local
```

This downloads the database connection string to `.env.local`

### Step 2.4: Add Additional Environment Variables

Edit `.env.local` and add your credentials from prerequisites:

```bash
# Database (already populated by Vercel)
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...

# Google AI
GEMINI_API_KEY=your_actual_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here

# NextAuth
NEXTAUTH_SECRET=your_actual_secret_here
NEXTAUTH_URL=http://localhost:3000
```

**⚠️ Important:** Never commit `.env.local` to Git!

---

## Day 3: Create Database Schema

### Step 3.1: Create Database Setup Script

Create `src/lib/db-setup.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  profile_picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Guides table
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  source_type VARCHAR(20),
  source_identifier TEXT,
  transcript TEXT,
  markdown_content TEXT,
  pdf_data BYTEA,
  pdf_generated_at TIMESTAMP,
  publish_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'draft'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
```

### Step 3.2: Create Database Utility

Create `src/lib/db.ts`:

```typescript
import { sql } from '@vercel/postgres';

export async function query(text: string, params?: any[]) {
  try {
    const result = await sql.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getUser(googleId: string) {
  const result = await sql`
    SELECT * FROM users WHERE google_id = ${googleId}
  `;
  return result.rows[0];
}

export async function createUser(data: {
  googleId: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
}) {
  const result = await sql`
    INSERT INTO users (google_id, email, name, profile_picture_url)
    VALUES (${data.googleId}, ${data.email}, ${data.name}, ${data.profilePictureUrl})
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateUserLastLogin(googleId: string) {
  await sql`
    UPDATE users SET last_login = NOW() WHERE google_id = ${googleId}
  `;
}

export async function getGuidesByUser(userId: string, limit = 10) {
  const result = await sql`
    SELECT id, title, source_type, publish_date, created_at, status
    FROM guides
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function getGuide(guideId: string, userId: string) {
  const result = await sql`
    SELECT * FROM guides
    WHERE id = ${guideId} AND user_id = ${userId}
  `;
  return result.rows[0];
}

export async function createGuide(data: {
  userId: string;
  title: string;
  sourceType: 'youtube' | 'upload';
  sourceIdentifier: string;
  transcript: string;
  publishDate?: Date;
}) {
  const result = await sql`
    INSERT INTO guides (user_id, title, source_type, source_identifier, transcript, publish_date, status)
    VALUES (${data.userId}, ${data.title}, ${data.sourceType}, ${data.sourceIdentifier}, ${data.transcript}, ${data.publishDate || null}, 'processing')
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateGuideMarkdown(guideId: string, markdown: string) {
  const result = await sql`
    UPDATE guides
    SET markdown_content = ${markdown}, status = 'completed', updated_at = NOW()
    WHERE id = ${guideId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteGuide(guideId: string, userId: string) {
  await sql`
    DELETE FROM guides WHERE id = ${guideId} AND user_id = ${userId}
  `;
}
```

### Step 3.3: Run Database Migration

Create `scripts/migrate.ts`:

```typescript
import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, '../src/lib/db-setup.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await sql.query(schema);
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
```

Add migration script to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "migrate": "tsx scripts/migrate.ts"
  }
}
```

Install tsx to run TypeScript scripts:

```bash
npm install --save-dev tsx
```

Run migration:

```bash
npm run migrate
```

**Expected output:** ✅ Database migration completed successfully

---

## Day 4-5: Python Integration Setup

### Step 4.1: Copy Python Scripts to Web App

```bash
# From c:/code/rabbi/ (parent directory)
mkdir web-app/python-scripts
cp main.py web-app/python-scripts/
cp requirements.txt web-app/python-scripts/
cp -r assets web-app/public/assets
```

### Step 4.2: Refactor Python Scripts

Create `web-app/python-scripts/transcript_fetcher.py`:

```python
#!/usr/bin/env python3
"""
Standalone script to fetch YouTube transcripts or parse local files.
Usage: python transcript_fetcher.py <youtube_url_or_file_path>
Returns JSON: {"transcript": "...", "title": "...", "date": "YYYY-MM-DD"}
"""
import sys
import json
from datetime import datetime
import yt_dlp
import re
import os

def extract_video_id(youtube_url):
    """Extract video ID from various YouTube URL formats."""
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            return match.group(1)
    
    return youtube_url

def get_youtube_transcript(video_url):
    """Retrieve transcript from YouTube video."""
    video_id = extract_video_id(video_url)
    
    try:
        ydl_opts = {
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Get metadata
            video_title = info.get('title', 'Unknown Title')
            video_publish_date = info.get('upload_date', None)
            if video_publish_date:
                video_publish_date = datetime.strptime(video_publish_date, '%Y%m%d').strftime('%Y-%m-%d')
            
            # Get transcript
            if 'automatic_captions' in info and 'en' in info['automatic_captions']:
                english_captions = info['automatic_captions']['en']
                ttml_captions = [cap for cap in english_captions if cap['ext'] == 'ttml']
                
                if not ttml_captions:
                    return None
                
                transcript_url = ttml_captions[0]['url']
            else:
                return None
            
            # Download and parse transcript
            import urllib.request
            import xml.etree.ElementTree as ET
            
            with urllib.request.urlopen(transcript_url) as response:
                transcript_data = response.read().decode('utf-8')
            
            xml_tree = ET.ElementTree(ET.fromstring(transcript_data))
            root = xml_tree.getroot()
            transcript_text = ' '.join([p.text for p in root.iter('{http://www.w3.org/ns/ttml}p') if p.text])
            
            return {
                "transcript": transcript_text,
                "title": video_title,
                "date": video_publish_date
            }
            
    except Exception as e:
        return None

def read_local_transcript(file_path):
    """Read transcript from a local text file."""
    if not os.path.isfile(file_path):
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Parse 4-tuples and extract transcript text
    transcript_lines = []
    for i in range(0, len(lines), 4):
        if i + 2 < len(lines):
            transcript_text = lines[i + 2].strip()
            if transcript_text:
                transcript_lines.append(transcript_text)
    
    transcript = '\n'.join(transcript_lines)
    
    # Extract date from filename (format: MM.DD.YY)
    filename = os.path.splitext(os.path.basename(file_path))[0]
    date_match = re.search(r'(\d{2})\.(\d{2})\.(\d{2})', filename)
    
    publish_date = None
    if date_match:
        month, day, year = map(int, date_match.groups())
        year += 2000
        publish_date = f"{year:04d}-{month:02d}-{day:02d}"
    
    return {
        "transcript": transcript,
        "title": filename,
        "date": publish_date
    }

def is_youtube_url(input_string):
    """Check if the input string is a YouTube URL."""
    youtube_patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be',
    ]
    return any(re.search(pattern, input_string) for pattern in youtube_patterns)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    input_source = sys.argv[1]
    
    result = None
    if is_youtube_url(input_source):
        result = get_youtube_transcript(input_source)
    else:
        result = read_local_transcript(input_source)
    
    if result:
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "Failed to retrieve transcript"}))
        sys.exit(1)
```

### Step 4.3: Create Guide Generation Script

Create `web-app/python-scripts/guide_generator.py`:

```python
#!/usr/bin/env python3
"""
Standalone script to generate discussion guide from transcript.
Usage: python guide_generator.py <transcript_text>
Returns JSON: {"markdown": "..."}
"""
import sys
import json
import os
from google import genai
import mdformat
import re

def create_discussion_guide_prompt(transcript):
    """Create the prompt for generating a discussion guide."""
    return f"""Based on the following sermon transcript, create a small group leader discussion guide suitable for a 20-40 minute discussion. 

The guide should follow the SOAP structure (Scripture, Observation, Application, Prayer) and include the following elements:

A title in the format "Small Group Discussion Guide: [Sermon Passage]"

1. Scripture: 
    a. a brief summary of the sermon passage (focus more on summarizing the sermon's passage than the sermon itself) (2-3 sentences)
    b. Key themes and scripture references mentioned
3. Observation:
    a. 5-7 thoughtful discussion questions that:
        - Help participants reflect on the sermon's passage
        - Connect the sermon and its passage to personal application
        - Encourage deeper theological exploration
        - Foster group conversation
         - Aid in answering the following questions each week (but can phrase differently as needed for the particular sermon passage):
            1. What do we learn about God? 
            2. What do we learn about humanity?
            3. What is God inviting us to believe or obey in this passage?
4. Application:
    a. A practical application challenge for the week
5. Prayer:
    a. Suggested closing prayer points

Lay out the guide in a clear, easy-to-read structure that a small group leader can follow. Please do not reference the structure of the guide in the guide itself (e.g. "This guide is intended for a 20-40 minute discussion", "Use this guide to facilitate conversation", etc.)

Please note that the sermon transcript may include some announcements at the beginning and an invitation to respond at the end; focus on the main sermon content.

The output must be in Markdown format.

BEGIN SERMON TRANSCRIPT.

{transcript}

END SERMON TRANSCRIPT.
Please provide a well-structured discussion guide."""

def generate_with_gemini(prompt, api_key):
    """Generate discussion guide using Google Gemini."""
    try:
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config={"temperature": 0.8}
        )
        
        guide = response.text
        
        # Format the markdown
        guide = mdformat.text(
            guide,
            options={
                "wrap": "keep",
                "number": True,
                "end_of_line": "lf"
            })
        
        # Ensure proper list spacing
        guide = re.sub(r'^(\s*[\*\-\+])\s{2,}', r'\1 ', guide, flags=re.MULTILINE)
        guide = re.sub(r'^(\s*\d+\.)\s{2,}', r'\1 ', guide, flags=re.MULTILINE)
        guide = re.sub(r'(?<!\n)\n(#{1,6}\s)', r'\n\n\1', guide)
        
        return guide
    except Exception as e:
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No transcript provided"}))
        sys.exit(1)
    
    transcript = sys.argv[1]
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        print(json.dumps({"error": "GEMINI_API_KEY not found"}))
        sys.exit(1)
    
    prompt = create_discussion_guide_prompt(transcript)
    markdown = generate_with_gemini(prompt, api_key)
    
    if markdown:
        print(json.dumps({"markdown": markdown}))
    else:
        print(json.dumps({"error": "Failed to generate guide"}))
        sys.exit(1)
```

### Step 4.4: Create Python Execution Helper

Create `src/lib/python-executor.ts`:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const PYTHON_SCRIPTS_DIR = path.join(process.cwd(), 'python-scripts');

export async function fetchTranscript(source: string): Promise<{
  transcript: string;
  title: string;
  date: string | null;
}> {
  try {
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'transcript_fetcher.py');
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${source}"`,
      { env: { ...process.env } }
    );
    
    if (stderr) {
      console.error('Python stderr:', stderr);
    }
    
    const result = JSON.parse(stdout);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

export async function generateGuide(transcript: string): Promise<string> {
  try {
    const scriptPath = path.join(PYTHON_SCRIPTS_DIR, 'guide_generator.py');
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${transcript.replace(/"/g, '\\"')}"`,
      {
        env: { ...process.env, GEMINI_API_KEY: process.env.GEMINI_API_KEY },
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
      }
    );
    
    if (stderr) {
      console.error('Python stderr:', stderr);
    }
    
    const result = JSON.parse(stdout);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result.markdown;
  } catch (error) {
    console.error('Error generating guide:', error);
    throw error;
  }
}
```

### Step 4.5: Test Python Integration

Create `scripts/test-python.ts`:

```typescript
import { fetchTranscript, generateGuide } from '../src/lib/python-executor';

async function test() {
  console.log('🧪 Testing Python integration...\n');
  
  // Test 1: Fetch YouTube transcript
  console.log('Test 1: Fetching YouTube transcript...');
  try {
    const result = await fetchTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('✅ Success!');
    console.log('Title:', result.title);
    console.log('Transcript length:', result.transcript.length);
  } catch (error) {
    console.log('❌ Failed:', error);
  }
  
  console.log('\nTests complete!');
}

test();
```

Add test script to `package.json`:

```json
{
  "scripts": {
    "test:python": "tsx scripts/test-python.ts"
  }
}
```

Run test:

```bash
npm run test:python
```

---

## Week 1 Completion Checklist

- [ ] Next.js project created with TypeScript and Tailwind
- [ ] Vercel Postgres database created and connected
- [ ] Environment variables configured in `.env.local`
- [ ] Database schema created and migrated
- [ ] Database utility functions implemented
- [ ] Python scripts copied and refactored
- [ ] Python execution helper created
- [ ] Python integration tested successfully

---

## Troubleshooting

### Python import errors
```bash
cd python-scripts
pip install -r requirements.txt
```

### Database connection errors
- Verify `.env.local` has correct `POSTGRES_URL`
- Run `vercel env pull .env.local` again

### TypeScript errors
```bash
npm install --save-dev @types/node @types/react
```

---

## Next Steps

Proceed to **[Week 2: Frontend & Core Features](./02-WEEK2-IMPLEMENTATION.md)**
