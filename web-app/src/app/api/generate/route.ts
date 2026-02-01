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
