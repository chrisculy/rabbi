import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { marked } from 'marked';
import path from 'path';
import fs from 'fs';

interface PdfGeneratorOptions {
  markdown: string;
  title: string;
  date: Date;
}

export async function generatePdf(options: PdfGeneratorOptions): Promise<Buffer> {
  const { markdown, date } = options;

  // Convert markdown to HTML
  const htmlContent = await marked(markdown);

  // Build paths to assets
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  const logoPath = path.join(assetsDir, 'Kings Primary Black.png');

  // Convert logo to base64 for embedding
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString('base64');
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  // Convert fonts to base64 for embedding
  const montHeavyBuffer = fs.readFileSync(path.join(assetsDir, 'Mont-HeavyDEMO.otf'));
  const montHeavyBase64 = `data:font/otf;base64,${montHeavyBuffer.toString('base64')}`;

  const montExtraLightBuffer = fs.readFileSync(path.join(assetsDir, 'Mont-ExtraLightDEMO.otf'));
  const montExtraLightBase64 = `data:font/otf;base64,${montExtraLightBuffer.toString('base64')}`;

  const gothaBlackBuffer = fs.readFileSync(path.join(assetsDir, 'GothaProBla.otf'));
  const gothaBlackBase64 = `data:font/otf;base64,${gothaBlackBuffer.toString('base64')}`;

  const gothaMediumBuffer = fs.readFileSync(path.join(assetsDir, 'GothaProMed.otf'));
  const gothaMediumBase64 = `data:font/otf;base64,${gothaMediumBuffer.toString('base64')}`;

  // Format date
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Create complete HTML document with styling
  const htmlDoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Small Group Discussion Guide</title>
    <style>
        @font-face {
            font-family: 'Montserrat Heavy';
            src: url('${montHeavyBase64}') format('opentype');
        }
        @font-face {
            font-family: 'Montserrat ExtraLight';
            src: url('${montExtraLightBase64}') format('opentype');
        }
        @font-face {
            font-family: 'Gotham Pro Black';
            src: url('${gothaBlackBase64}') format('opentype');
        }
        @font-face {
            font-family: 'Gotham Pro Medium';
            src: url('${gothaMediumBase64}') format('opentype');
        }

        @page {
            size: letter;
            margin: 1in;
        }

        body {
            font-family: 'Montserrat ExtraLight', Arial, sans-serif;
            font-weight: 800;
            font-style: normal;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
            zoom: 0.8;
        }
        h1 {
            font-family: 'Montserrat Heavy', sans-serif;
            font-size: 20pt;
            font-weight: normal;
            margin-top: 0.5em;
            margin-bottom: 0.3em;
            color: #1a1a1a;
        }
        h2 {
            font-family: 'Gotham Pro Black', sans-serif;
            font-size: 16pt;
            font-weight: normal;
            margin-top: 0.8em;
            margin-bottom: 0.3em;
            color: #2a2a2a;
        }
        h3 {
            font-family: 'Gotham Pro Medium', sans-serif;
            font-size: 13pt;
            font-weight: normal;
            margin-top: 0.6em;
            margin-bottom: 0.2em;
            color: #3a3a3a;
        }
        p {
            margin-top: 0.3em;
            margin-bottom: 0.5em;
        }
        ul, ol {
            margin-top: 0.3em;
            margin-bottom: 0.5em;
            padding-left: 1.5em;
        }
        li {
            margin-bottom: 0.3em;
        }
        hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 1em 0;
        }
        strong {
            font-family: 'Gotham Pro Medium', sans-serif;
            font-weight: 700;
        }
        em {
            font-style: italic;
        }
        blockquote {
            border-left: 3px solid #ccc;
            padding-left: 1em;
            margin-left: 0;
            font-style: italic;
            color: #555;
        }
        .header-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .header-logo {
            width: 50%;
            vertical-align: top;
            padding: 0;
        }
        .header-date {
            width: 50%;
            vertical-align: top;
            text-align: right;
            padding: 0;
        }
        .logo-img {
            max-height: 80px;
            display: block;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="header-logo">
                <img src="${logoDataUrl}" alt="Kings Church Logo" class="logo-img">
            </td>
            <td class="header-date">
                <em style="white-space: nowrap;">${formattedDate}</em>
            </td>
        </tr>
    </table>
    <hr>
    ${htmlContent}
</body>
</html>`;

  const remoteExecutablePath = "https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar";
  const chromiumPath = await chromium.executablePath(remoteExecutablePath);
  console.log('Chromium executable path:', chromiumPath);
  if (!chromiumPath) {
    throw new Error('Chromium executable not found');
  }

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: chromiumPath,
    headless: true
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlDoc, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
      },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
