'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Guide {
  id: string;
  title: string;
  source_type: string;
  publish_date: string | null;
  created_at: string;
  status: string;
}

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-2">
          Rabbi
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Small Group Guide Generator
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered discussion guides for small groups. Transform sermon transcripts
          into thoughtful, engaging discussion materials in minutes.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex items-center justify-center gap-3 rounded-lg bg-white border-2 border-gray-300 px-8 py-3 text-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
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

      <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-5xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">YouTube Integration</h3>
          <p className="mt-2 text-gray-600">
            Fetch transcripts directly from YouTube sermon videos
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered</h3>
          <p className="mt-2 text-gray-600">
            Generate discussion guides with Google Gemini AI
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Easy Editing</h3>
          <p className="mt-2 text-gray-600">
            WYSIWYG editor with PDF export
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/assets/kings.png"
                alt="Rabbi Logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Rabbi - Small Group Guide Generator
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
      </main>
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return session ? <Dashboard /> : <LandingPage />;
}
