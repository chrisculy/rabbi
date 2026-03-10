'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), {
  ssr: false,
});

interface Guide {
  id: string;
  title: string;
  transcript: string;
  bible_passages: string | null;
  markdown_content: string | null;
  status: string;
}

export default function GuidePage() {
  const params = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchGuide();
  }, [params.id]);

  async function fetchGuide() {
    try {
      const response = await fetch(`/api/guides/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setGuide(data.guide);
        setContent(data.guide.markdown_content || '');

        // If no markdown yet, auto-generate
        if (!data.guide.markdown_content && data.guide.status === 'processing') {
          await generateGuide(data.guide);
        }
      }
    } catch (error) {
      console.error('Error fetching guide:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateGuide(guideData: Guide) {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: guideData.id,
          transcript: guideData.transcript,
          biblePassages: guideData.bible_passages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.markdown);
        setGuide({ ...guideData, markdown_content: data.markdown, status: 'completed' });
      }
    } catch (error) {
      console.error('Error generating guide:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!guide) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/guides/${guide.id}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: content }),
      });

      if (response.ok) {
        // Show success indicator
        setTimeout(() => setSaving(false), 500);
      }
    } catch (error) {
      console.error('Error saving guide:', error);
      setSaving(false);
    }
  }

  async function handleDownloadPdf() {
    if (!guide) return;

    setDownloadingPdf(true);
    try {
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: content,
          title: guide.title,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Format filename with current date
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit',
        });
        a.download = `Kings Church - Small Group Discussion Guide - Week of ${currentDate}.pdf`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDelete() {
    if (!guide || !confirm('Are you sure you want to delete this guide?')) return;

    try {
      const response = await fetch(`/api/guides/${guide.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting guide:', error);
    }
  }

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!content || !guide?.markdown_content) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 30000);

    return () => clearTimeout(timer);
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading guide...</p>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating discussion guide...</p>
          <p className="mt-2 text-sm text-gray-500">This may take 30-60 seconds</p>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Guide not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back to Dashboard Link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{guide.title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {guide.status === 'completed' ? 'Ready to edit' : 'Processing...'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Editor */}
      <MarkdownEditor
        content={content}
        onChange={setContent}
        placeholder="Your discussion guide will appear here..."
      />

      {/* Auto-save indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-800">
          Saving changes...
        </div>
      )}
    </div>
  );
}
