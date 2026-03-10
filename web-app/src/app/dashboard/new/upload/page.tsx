'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewFromUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [biblePassages, setBiblePassages] = useState('');
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
      if (biblePassages.trim()) {
        formData.append('biblePassages', biblePassages.trim());
      }

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
        <div>
          <label htmlFor="biblePassages" className="block text-sm font-medium text-gray-700">
            Bible Passage(s)
          </label>
          <textarea
            id="biblePassages"
            value={biblePassages}
            onChange={(e) => setBiblePassages(e.target.value)}
            placeholder="e.g. John 3:16-21, Romans 8:1-11"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

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
