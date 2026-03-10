import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fetchYoutubeTranscript } from '@/lib/transcript-fetcher';
import { createGuide } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, biblePassages } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch transcript from YouTube
    const result = await fetchYoutubeTranscript(url);

    // Save to database
    const guide = await createGuide({
      userId: session.user.id,
      title: result.title,
      sourceType: 'youtube',
      sourceIdentifier: url,
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
    console.error('Error fetching YouTube transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
