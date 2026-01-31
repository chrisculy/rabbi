# Week 3: Editor, PDF Generation & Deployment

**Goal:** Implement WYSIWYG editor, PDF generation, and deploy to production

**Prerequisites:** Complete [Week 2](./02-WEEK2-IMPLEMENTATION.md) first

---

## Day 1: TipTap WYSIWYG Editor

### Step 1.1: Install TipTap Extensions

```bash
npm install @tiptap/extension-placeholder @tiptap/extension-underline @tiptap/extension-link
```

### Step 1.2: Create Editor Component

Create `src/components/MarkdownEditor.tsx`:

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg">
      {/* Toolbar */}
      <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('underline') ? 'bg-gray-300' : ''
          }`}
          title="Underline"
        >
          <u>U</u>
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 3"
        >
          H3
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1 rounded hover:bg-gray-200 ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="Quote"
        >
          " Quote
        </button>
        
        <div className="w-px bg-gray-300 mx-1" />
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Redo"
        >
          ↷ Redo
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
```

### Step 1.3: Create Guide Editor Page

Create `src/app/guide/[id]/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('@/components/MarkdownEditor'), {
  ssr: false,
});

interface Guide {
  id: string;
  title: string;
  transcript: string;
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
        a.download = `${guide.title}.pdf`;
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
    <div className="space-y-6">
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
```

### Step 1.4: Create Content Update API

Create `src/app/api/guides/[id]/content/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { updateGuideMarkdown } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markdown } = await request.json();

    await updateGuideMarkdown(params.id, markdown);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating guide content:', error);
    return NextResponse.json(
      { error: 'Failed to update guide' },
      { status: 500 }
    );
  }
}
```

---

## Day 2-3: PDF Generation

### Step 2.1: Create PDF Generation Script

Create `web-app/python-scripts/pdf_generator.py`:

```python
#!/usr/bin/env python3
"""
Standalone script to generate PDF from markdown.
Usage: python pdf_generator.py <markdown_content> <title> <date> <output_path>
"""
import sys
import os
from datetime import datetime
import markdown
import pdfkit
from io import BytesIO

def export_to_pdf_file(guide_markdown, video_title, video_publish_date, output_filename):
    """Export markdown to PDF file."""
    # Get absolute paths to assets
    assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'assets'))
    logo_path = os.path.join(assets_dir, 'Kings Primary Black.png')
    logo_url = f'file:///{logo_path.replace(os.sep, "/")}'
    
    # Font paths
    mont_heavy = f'file:///{os.path.join(assets_dir, "Mont-HeavyDEMO.otf").replace(os.sep, "/")}'
    mont_extralight = f'file:///{os.path.join(assets_dir, "Mont-ExtraLightDEMO.otf").replace(os.sep, "/")}'
    gotha_black = f'file:///{os.path.join(assets_dir, "GothaProBla.otf").replace(os.sep, "/")}'
    gotha_medium = f'file:///{os.path.join(assets_dir, "GotaProMed.otf").replace(os.sep, "/")}'
    
    # Convert markdown to HTML
    html_content = markdown.markdown(
        guide_markdown,
        extensions=['extra', 'nl2br', 'sane_lists']
    )
    
    # Create complete HTML document
    html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Small Group Discussion Guide</title>
    <style>
        @font-face {{
            font-family: 'Montserrat Heavy';
            src: url('{mont_heavy}') format('opentype');
        }}
        @font-face {{
            font-family: 'Montserrat ExtraLight';
            src: url('{mont_extralight}') format('opentype');
        }}
        @font-face {{
            font-family: 'Gotham Pro Black';
            src: url('{gotha_black}') format('opentype');
        }}
        @font-face {{
            font-family: 'Gotham Pro Medium';
            src: url('{gotha_medium}') format('opentype');
        }}
        
        @page {{
            size: letter;
            margin: 1in;
            @bottom-center {{
                content: counter(page);
            }}
        }}

        body {{
            font-family: 'Montserrat ExtraLight', Arial, sans-serif;
            font-weight: 800;
            font-style: normal;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{
            font-family: 'Montserrat Heavy', sans-serif;
            font-size: 20pt;
            font-weight: normal;
            margin-top: 0.5em;
            margin-bottom: 0.3em;
            color: #1a1a1a;
        }}
        h2 {{
            font-family: 'Gotham Pro Black', sans-serif;
            font-size: 16pt;
            font-weight: normal;
            margin-top: 0.8em;
            margin-bottom: 0.3em;
            color: #2a2a2a;
        }}
        h3 {{
            font-family: 'Gotham Pro Medium', sans-serif;
            font-size: 13pt;
            font-weight: normal;
            margin-top: 0.6em;
            margin-bottom: 0.2em;
            color: #3a3a3a;
        }}
        p {{
            margin-top: 0.3em;
            margin-bottom: 0.5em;
        }}
        ul, ol {{
            margin-top: 0.3em;
            margin-bottom: 0.5em;
            padding-left: 1.5em;
        }}
        li {{
            margin-bottom: 0.3em;
        }}
        hr {{
            border: none;
            border-top: 1px solid #ccc;
            margin: 1em 0;
        }}
        strong {{
            font-family: 'Gotham Pro Medium', sans-serif;
            font-weight: 700;
        }}
        em {{
            font-style: italic;
        }}
        blockquote {{
            border-left: 3px solid #ccc;
            padding-left: 1em;
            margin-left: 0;
            font-style: italic;
            color: #555;
        }}
    </style>
</head>
<body>
    <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; vertical-align: top; padding: 0;">
                <img src="{logo_url}" alt="Kings Church Logo" style="max-height: 80px; display: block;">
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right; padding: 0;">
                <em style="white-space: nowrap;">{video_publish_date.strftime("%B %d, %Y")}</em>
            </td>
        </tr>
    </table>
    <hr style="border: none; border-top: 1px solid #ccc; margin: 1em 0;">
    {html_content}
</body>
</html>"""
    
    # Configure pdfkit
    path_to_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
    if not os.path.isfile(path_to_wkhtmltopdf):
        # Try common alternative locations
        alternative_paths = [
            r'C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe',
            r'wkhtmltopdf',  # If in PATH
        ]
        for alt_path in alternative_paths:
            if os.path.isfile(alt_path) or os.system(f'where {alt_path}') == 0:
                path_to_wkhtmltopdf = alt_path
                break
    
    config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)
    
    options = {
        'page-size': 'Letter',
        'margin-top': '1in',
        'margin-right': '1in',
        'margin-bottom': '1in',
        'margin-left': '1in',
        'encoding': 'UTF-8',
        'enable-local-file-access': None
    }
    
    pdfkit.from_string(html_doc, output_filename, options=options, configuration=config)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python pdf_generator.py <markdown> <title> <date> <output>")
        sys.exit(1)
    
    markdown_content = sys.argv[1]
    title = sys.argv[2]
    date_str = sys.argv[3] if len(sys.argv) > 3 else None
    output_path = sys.argv[4] if len(sys.argv) > 4 else 'output.pdf'
    
    publish_date = datetime.fromisoformat(date_str) if date_str else datetime.now()
    
    try:
        export_to_pdf_file(markdown_content, title, publish_date, output_path)
        print(f"PDF generated: {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
```

### Step 2.2: Create PDF Generation API

Create `src/app/api/pdf/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markdown, title } = await request.json();

    if (!markdown || !title) {
      return NextResponse.json(
        { error: 'Markdown and title are required' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const tempDir = path.join(process.cwd(), 'temp');
    const outputPath = path.join(tempDir, `guide-${timestamp}.pdf`);

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Call Python script
    const scriptPath = path.join(process.cwd(), 'python-scripts', 'pdf_generator.py');
    const date = new Date().toISOString();
    
    const command = `python "${scriptPath}" "${markdown.replace(/"/g, '\\"')}" "${title}" "${date}" "${outputPath}"`;
    
    await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    // Read generated PDF
    const pdfBuffer = await fs.readFile(outputPath);

    // Clean up temp file
    await fs.unlink(outputPath);

    // Return PDF as streaming response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// Increase timeout for PDF generation
export const maxDuration = 120; // 120 seconds
```

---

## Day 4: Final Testing

### Step 4.1: Create Landing Page

Update `src/app/page.tsx`:

```typescript
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Sermon Discussion Guide Generator
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl">
          AI-powered discussion guides for small groups. Transform sermon transcripts
          into thoughtful, engaging discussion materials in minutes.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signin"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg text-white hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/about"
            className="rounded-lg border-2 border-gray-300 px-8 py-3 text-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Learn More
          </Link>
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
```

### Step 4.2: Test Complete Workflow

```bash
npm run dev
```

**Test Checklist:**
- [ ] Sign in with Google
- [ ] Create guide from YouTube URL
- [ ] Create guide from uploaded file
- [ ] Edit guide in WYSIWYG editor
- [ ] Auto-save works
- [ ] Generate and download PDF
- [ ] Delete guide

---

## Day 5: Deployment to Vercel

### Step 5.1: Update Vercel Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/generate/route.ts": {
      "maxDuration": 60
    },
    "app/api/pdf/generate/route.ts": {
      "maxDuration": 120
    }
  }
}
```

### Step 5.2: Add Python to Vercel

Update `package.json` to include Python dependencies:

```json
{
  "scripts": {
    "vercel-build": "npm run build && pip install -r python-scripts/requirements.txt --target python-scripts"
  }
}
```

Create `python-scripts/requirements.txt` if not exists:

```
yt-dlp==2025.12.08
google-genai==1.56.0
markdown==3.7
pdfkit==1.0.0
mdformat==0.7.21
```

### Step 5.3: Configure Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your project

2. **Navigate to Settings → Environment Variables**

3. **Add these variables:**
   - `GEMINI_API_KEY`: Your Gemini API key
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `NEXTAUTH_SECRET`: Your NextAuth secret
   - `NEXTAUTH_URL`: `https://your-app-name.vercel.app`

4. **Save changes**

### Step 5.4: Update OAuth Redirect URLs

1. **Go to Google Cloud Console**
   - Navigate to your OAuth credentials
   - Add Vercel URL to authorized redirect URIs:
     - `https://your-app-name.vercel.app/api/auth/callback/google`

### Step 5.5: Deploy

```bash
# Commit all changes
git add .
git commit -m "Complete web application implementation"
git push origin web-app-development

# Deploy to Vercel
vercel --prod
```

**Or deploy from Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to "Deployments"
4. Click "Deploy" for the latest commit

### Step 5.6: Verify Deployment

Visit your deployed URL and test:
- [ ] Sign in works with production URL
- [ ] YouTube transcript fetching works
- [ ] File upload works
- [ ] Guide generation works
- [ ] Editor works
- [ ] PDF generation works

---

## Week 3 Completion Checklist

- [ ] TipTap editor component created
- [ ] Guide editor page implemented
- [ ] Content auto-save functionality
- [ ] PDF generation Python script created
- [ ] PDF generation API endpoint
- [ ] Landing page created
- [ ] Complete workflow tested locally
- [ ] Environment variables configured in Vercel
- [ ] OAuth redirect URLs updated
- [ ] Application deployed to production
- [ ] Production deployment tested

---

## Troubleshooting Production Issues

### PDF Generation Fails on Vercel

**Issue:** wkhtmltopdf not available on Vercel serverless functions

**Solution:** Consider using an alternative PDF library that works in serverless environments:

```bash
npm install puppeteer-core @sparticuz/chromium
```

Create alternative PDF generator using Puppeteer if needed.

### Timeout Errors

- Increase `maxDuration` in `vercel.json`
- Consider upgrading to Pro plan for longer timeouts (300s vs 60s)

### Database Connection Errors

- Verify `POSTGRES_URL` is set in Vercel
- Check Vercel Postgres is connected to project

---

## Post-Deployment

### Monitor Application

Visit Vercel Dashboard → Your Project → Analytics to see:
- Request counts
- Error rates
- Performance metrics

### Update DNS (Optional)

To use custom domain:
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Congratulations! 🎉

You've successfully built and deployed the Sermon Discussion Guide Generator web application!

**What you've accomplished:**
- ✅ Full-stack Next.js application
- ✅ Google OAuth authentication
- ✅ YouTube transcript fetching
- ✅ File upload and parsing
- ✅ AI-powered guide generation
- ✅ WYSIWYG Markdown editor
- ✅ PDF generation and download
- ✅ Production deployment on Vercel

**Total Cost:** $0/month (all free tiers)

**Next steps:**
- Share with your 1-2 users
- Gather feedback
- Iterate and improve as needed
