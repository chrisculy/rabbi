import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createGuide } from '@/lib/db';
import { writeFile, unlink, mkdir } from 'fs/promises';
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

    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    await mkdir(tempDir, { recursive: true });

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = path.join(tempDir, `${Date.now()}-${file.name}`);
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
