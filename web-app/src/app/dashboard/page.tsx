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
          href="/dashboard/new/upload"
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 hover:border-blue-500 hover:bg-blue-50 transition"
        >
          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Upload Transcript</h3>
          <p className="mt-1 text-sm text-gray-600">Upload a local transcript file</p>
        </Link>

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
