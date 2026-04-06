import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generatePdf } from '@/lib/pdf-generator';

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

    // Generate PDF using Puppeteer
    const pdfBuffer = await generatePdf({
      markdown,
      title,
      date: new Date(),
    });

    // Format filename with current date in Central Timezone
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      timeZone: 'America/Chicago',
    });
    const filename = `Kings Church - Small Group Discussion Guide - Week of ${currentDate}.pdf`;

    // Return PDF as streaming response (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
export const maxDuration = 60; // 60 seconds
