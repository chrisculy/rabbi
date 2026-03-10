import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createGuide } from '@/lib/db';
import { readLocalTranscript } from '@/lib/transcript-fetcher';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const biblePassages = formData.get('biblePassages') as string | null;

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

    // Read file content
    const fileContent = await file.text();

    try {
      // Parse transcript from file content
      const result = await readLocalTranscript(fileContent, file.name);

      // Save to database
      const guide = await createGuide({
        userId: session.user.id,
        title: result.title || file.name,
        sourceType: 'upload',
        sourceIdentifier: file.name,
        transcript: result.transcript,
        biblePassages: biblePassages || undefined,
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
