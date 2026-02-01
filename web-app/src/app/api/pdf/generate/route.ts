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
    const markdownPath = path.join(tempDir, `guide-${timestamp}.md`);
    const outputPath = path.join(tempDir, `guide-${timestamp}.pdf`);

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Write markdown to temporary file
    await fs.writeFile(markdownPath, markdown, 'utf-8');

    // Call Python script
    const scriptPath = path.join(process.cwd(), 'python-scripts', 'pdf_generator.py');
    const date = new Date().toISOString();

    const command = `python "${scriptPath}" "${markdownPath}" "${title}" "${date}" "${outputPath}"`;

    await execAsync(command, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    // Read generated PDF
    const pdfBuffer = await fs.readFile(outputPath);

    // Clean up temp files
    await fs.unlink(outputPath);
    await fs.unlink(markdownPath);

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
