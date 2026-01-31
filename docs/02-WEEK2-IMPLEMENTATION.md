# Week 2: Frontend & Core Features

**Goal:** Build the user interface, authentication, and core API endpoints

**Prerequisites:** Complete [Week 1](./01-WEEK1-IMPLEMENTATION.md) first

---

## Day 1: Authentication with NextAuth.js

### Step 1.1: Install NextAuth.js

```bash
npm install next-auth
```

### Step 1.2: Create NextAuth Configuration

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUser, createUser, updateUserLastLogin } from '@/lib/db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile) {
        try {
          // Check if user exists
          const existingUser = await getUser(profile.sub);
          
          if (existingUser) {
            // Update last login
            await updateUserLastLogin(profile.sub);
          } else {
            // Create new user
            await createUser({
              googleId: profile.sub,
              email: user.email!,
              name: user.name || '',
              profilePictureUrl: user.image || undefined,
            });
          }
          
          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token?.sub) {
        const user = await getUser(token.sub);
        if (user) {
          session.user.id = user.id;
          session.user.googleId = user.google_id;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Step 1.3: Extend NextAuth Types

Create `src/types/next-auth.d.ts`:

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      googleId: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

### Step 1.4: Create Sign-In Page

Create `src/app/auth/signin/page.tsx`:

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sermon Discussion Guide Generator</h1>
          <p className="mt-2 text-gray-600">Sign in to get started</p>
        </div>
        
        <button
          onClick={() => signIn('google', { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-white border-2 border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
```

### Step 1.5: Create Session Provider

Create `src/app/providers.tsx`:

```typescript
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sermon Discussion Guide Generator',
  description: 'AI-powered discussion guides for small groups',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Day 2: Dashboard Layout

### Step 2.1: Create Protected Route Middleware

Create `src/middleware.ts`:

```typescript
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/guide/:path*'],
};
```

### Step 2.2: Create Dashboard Layout

Create `src/app/dashboard/layout.tsx`:

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Discussion Guide Generator
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="h-8 w-8 rounded-full"
                />
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
```

### Step 2.3: Create Dashboard Home Page

Create `src/app/dashboard/page.tsx`:

```typescript
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Guide {
  id: string;
  title: string;
  source_type: string;
  publish_date: string | null;
  created_at: string;
  status: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuides();
  }, []);

  async function fetchGuides() {
    try {
      const response = await fetch('/api/guides');
      if (response.ok) {
        const data = await response.json();
        setGuides(data.guides);
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
        </h2>
        <p className="mt-2 text-gray-600">
          Create a new discussion guide or continue working on an existing one.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/new/youtube"
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">New from YouTube</h3>
          <p className="mt-1 text-sm text-gray-600">Fetch transcript from YouTube URL</p>
        </Link>

        <Link
          href="/dashboard/new/upload"
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Upload Transcript</h3>
          <p className="mt-1 text-sm text-gray-600">Upload a local transcript file</p>
        </Link>
      </div>

      {/* Recent Guides */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Guides</h3>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : guides.length === 0 ? (
          <p className="text-gray-600">No guides yet. Create your first one above!</p>
        ) : (
          <div className="space-y-4">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={`/guide/${guide.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{guide.title}</h4>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">{guide.source_type}</span>
                      {guide.publish_date && (
                        <span>{new Date(guide.publish_date).toLocaleDateString()}</span>
                      )}
                      <span className="capitalize">{guide.status}</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(guide.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Day 3: API Routes for Transcript Processing

### Step 3.1: YouTube Transcript API

Create `src/app/api/transcript/youtube/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchTranscript } from '@/lib/python-executor';
import { createGuide } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch transcript using Python script
    const result = await fetchTranscript(url);

    // Save to database
    const guide = await createGuide({
      userId: session.user.id,
      title: result.title,
      sourceType: 'youtube',
      sourceIdentifier: url,
      transcript: result.transcript,
      publishDate: result.date ? new Date(result.date) : undefined,
    });

    return NextResponse.json({
      success: true,
      guide: {
        id: guide.id,
        title: guide.title,
        transcript: guide.transcript,
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
```

### Step 3.2: File Upload API

Create `src/app/api/transcript/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createGuide } from '@/lib/db';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fetchTranscript } from '@/lib/python-executor';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['.txt', '.srt'];
    const fileExt = path.extname(file.name).toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join(process.cwd(), 'temp', `${Date.now()}-${file.name}`);
    await writeFile(tempPath, buffer);

    try {
      // Parse transcript using Python script
      const result = await fetchTranscript(tempPath);

      // Save to database
      const guide = await createGuide({
        userId: session.user.id,
        title: result.title || file.name,
        sourceType: 'upload',
        sourceIdentifier: file.name,
        transcript: result.transcript,
        publishDate: result.date ? new Date(result.date) : undefined,
      });

      // Clean up temp file
      await unlink(tempPath);

      return NextResponse.json({
        success: true,
        guide: {
          id: guide.id,
          title: guide.title,
          transcript: guide.transcript,
        },
      });
    } catch (error) {
      // Clean up temp file on error
      await unlink(tempPath);
      throw error;
    }
  } catch (error) {
    console.error('Error uploading transcript:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
```

Create temp directory:

```bash
mkdir web-app/temp
echo "*" > web-app/temp/.gitignore
```

---

## Day 4: Guide Generation API

### Step 4.1: Create Generate API Route

Create `src/app/api/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateGuide } from '@/lib/python-executor';
import { updateGuideMarkdown } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guideId, transcript } = await request.json();

    if (!guideId || !transcript) {
      return NextResponse.json(
        { error: 'Guide ID and transcript are required' },
        { status: 400 }
      );
    }

    // Generate discussion guide using Python script
    const markdown = await generateGuide(transcript);

    // Update guide in database
    await updateGuideMarkdown(guideId, markdown);

    return NextResponse.json({
      success: true,
      markdown,
    });
  } catch (error) {
    console.error('Error generating guide:', error);
    return NextResponse.json(
      { error: 'Failed to generate guide' },
      { status: 500 }
    );
  }
}

// Increase timeout for this route (Vercel default is 10s)
export const maxDuration = 60; // 60 seconds
```

### Step 4.2: Create Guides List API

Create `src/app/api/guides/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getGuidesByUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guides = await getGuidesByUser(session.user.id);

    return NextResponse.json({ guides });
  } catch (error) {
    console.error('Error fetching guides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guides' },
      { status: 500 }
    );
  }
}
```

### Step 4.3: Create Single Guide API

Create `src/app/api/guides/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getGuide, deleteGuide } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guide = await getGuide(params.id, session.user.id);

    if (!guide) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ guide });
  } catch (error) {
    console.error('Error fetching guide:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guide' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteGuide(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting guide:', error);
    return NextResponse.json(
      { error: 'Failed to delete guide' },
      { status: 500 }
    );
  }
}
```

---

## Day 5: Input Forms

### Step 5.1: YouTube Input Form

Create `src/app/dashboard/new/youtube/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewFromYouTube() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/transcript/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      const data = await response.json();
      router.push(`/guide/${data.guide.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">New from YouTube</h2>
        <p className="mt-2 text-gray-600">
          Enter a YouTube URL to fetch the sermon transcript
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            YouTube URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Fetching transcript...' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Step 5.2: Upload Form

Create `src/app/dashboard/new/upload/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewFromUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcript/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      const data = await response.json();
      router.push(`/guide/${data.guide.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Upload Transcript</h2>
        <p className="mt-2 text-gray-600">
          Upload a transcript file (.txt or .srt format)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-12 text-center transition ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <input
            type="file"
            id="file"
            accept=".txt,.srt"
            onChange={handleChange}
            className="hidden"
          />
          
          {file ? (
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="mt-1 text-sm text-gray-600">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-4 text-sm text-gray-600">
                Drag and drop your file here, or
              </p>
              <label
                htmlFor="file"
                className="mt-2 inline-block cursor-pointer text-sm text-blue-600 hover:text-blue-800"
              >
                browse
              </label>
              <p className="mt-2 text-xs text-gray-500">
                .txt or .srt files up to 5MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!file || loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Week 2 Completion Checklist

- [ ] NextAuth.js configured with Google OAuth
- [ ] Sign-in page created
- [ ] Dashboard layout implemented
- [ ] Dashboard home page with recent guides
- [ ] YouTube transcript API endpoint
- [ ] File upload API endpoint
- [ ] Guide generation API endpoint
- [ ] Guides listing API endpoint
- [ ] Single guide API endpoint
- [ ] YouTube input form
- [ ] Upload input form

---

## Testing Week 2

1. **Test Authentication:**
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000/auth/signin
   - Sign in with Google
   - Verify redirect to dashboard

2. **Test YouTube Transcript:**
   - Go to "New from YouTube"
   - Enter a YouTube URL
   - Verify transcript is fetched

3. **Test File Upload:**
   - Go to "Upload Transcript"
   - Upload a .txt file
   - Verify file is processed

---

## Next Steps

Proceed to **[Week 3: Editor, PDF & Deployment](./03-WEEK3-IMPLEMENTATION.md)**
