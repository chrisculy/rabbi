"""
YouTube Sermon Discussion Guide Generator

This script retrieves transcripts from YouTube sermon videos and generates
small group leader discussion guides using Google Gemini and ChatGPT.
It then evaluates both responses and creates a final PDF document.
"""

import os
import sys
from dotenv import load_dotenv
from google import genai
from google.genai import types
import markdown
import pdfkit
import re
from datetime import datetime
import yt_dlp

# Load environment variables
load_dotenv()

# Configure Google Genai client
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

# Define the path to the wkhtmltopdf executable
path_to_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'

# Configure pdfkit to use this path
pdfkit_config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)

# Ensure the wkhtmltopdf.exe exists
if not os.path.isfile(path_to_wkhtmltopdf):
    raise FileNotFoundError(f"wkhtmltopdf executable not found at {path_to_wkhtmltopdf}. Please install wkhtmltopdf and update the path accordingly.")


def extract_video_id(youtube_url):
    """Extract video ID from various YouTube URL formats."""
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            return match.group(1)
    
    # If no pattern matches, assume it's already a video ID
    return youtube_url


def get_youtube_transcript(video_url):
    """Retrieve transcript from YouTube video."""
    print("Fetching YouTube transcript...")
    
    video_id = extract_video_id(video_url)
    print(f"Video ID: {video_id}")
    
    try:
        ydl_opts = {
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Check for automatically generated captions
            if 'automatic_captions' in info and 'en' in info['automatic_captions']:
                englishCaptions = info['automatic_captions']['en']
                
                # get the captions in ttml format if available
                ttml_captions = [cap for cap in englishCaptions if cap['ext'] == 'ttml']
                if ttml_captions:
                    transcript_url = ttml_captions[0]['url']
                else:
                    print("Preferred ttml format not found; exiting.")
                    return None
            else:
                print("No English transcript found")
                return None
            
            # Download and parse the subtitle file
            import urllib.request
            with urllib.request.urlopen(transcript_url) as response:
                transcript_data = response.read().decode('utf-8')
            
            import xml.etree.ElementTree as ET
            try:
                # Try parsing as the preferred ttml format first (YouTube's format)
                xml_tree = ET.ElementTree(ET.fromstring(transcript_data))
                root = xml_tree.getroot()
                transcript_text = ' '.join([p.text for p in root.iter('{http://www.w3.org/ns/ttml}p') if p.text])
            except:
                print("Failed to parse ttml format; exiting.")
                return None

            print(f"✓ Transcript retrieved via yt-dlp ({len(transcript_text)} characters)")
            return transcript_text
            
    except Exception as e:
        print(f"yt-dlp method failed: {type(e).__name__}: {e}")
        return None


def create_discussion_guide_prompt(transcript):
    """Create the prompt for generating a discussion guide."""
    return f"""Based on the following sermon transcript, create a small group leader discussion guide suitable for a 20-40 minute discussion. 

The guide should follow the SOAP structure (Scripture, Observation, Application, Prayer) and include the following elements:
1. Scripture: 
    a. a brief summary of the sermon's main message and the sermon passage (2-3 sentences)
    b. Key themes and scripture references mentioned
3. Observation:
    a. 5-7 thoughtful discussion questions that:
        - Aid in answering the following questions each week (but can phrase differently as needed for the particular sermon passage):
            1. What do we learn about God? 
            2. What do we learn about humanity?
            3. What is God inviting us to believe or obey in this passage?
        - Help participants reflect on the sermon's passage
        - Connect the sermon and its passage to personal application
        - Encourage deeper theological exploration
        - Foster group conversation
4. Application:
    a. A practical application challenge for the week
5. Prayer:
    a. Suggested closing prayer points

Lay out the guide in a clear, easy-to-read structure that a small group leader can follow.

The output must be in Markdown format.

Please note that the sermon transcript may include some announcements at the beginning and an invitation to respond at the end; focus on the main sermon content.

BEGIN SERMON TRANSCRIPT.

{transcript[:8000]}

END SERMON TRANSCRIPT.
Please provide a well-structured discussion guide."""


def generate_with_gemini(prompt):
    """Generate discussion guide using Google Gemini."""
    print("Generating discussion guide with Gemini...")

    try:
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt
        )
        
        guide = response.text
        print("✓ Gemini guide generated")
        return guide
    except Exception as e:
        print(f"Error with Gemini: {e}")
        return None


def export_to_pdf(guide_markdown, video_title, video_publish_date, output_filename='discussion_guide.pdf'):
    """Export the markdown discussion guide to a PDF file."""
    print(f"\nExporting to PDF: {output_filename}")
    
    try:
        # Add metadata header to the markdown
        metadata = f"""---
**{video_title}**
*{video_publish_date.strftime("%B %d, %Y")}*

---

"""
        
        full_markdown = metadata + guide_markdown
        
        # Convert markdown to HTML
        html_content = markdown.markdown(
            full_markdown,
            extensions=['extra', 'nl2br', 'sane_lists']
        )
        
        # Wrap in a complete HTML document with styling
        html_doc = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Small Group Discussion Guide</title>
    <style>
        @page {{
            size: letter;
            margin: 1in;
            @bottom-center {{
                content: counter(page);
            }}
        }}
        body {{
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #333;
        }}
        h1 {{
            font-size: 20pt;
            font-weight: bold;
            margin-top: 0.5em;
            margin-bottom: 0.3em;
            color: #1a1a1a;
        }}
        h2 {{
            font-size: 16pt;
            font-weight: bold;
            margin-top: 0.8em;
            margin-bottom: 0.3em;
            color: #2a2a2a;
        }}
        h3 {{
            font-size: 13pt;
            font-weight: bold;
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
            font-weight: bold;
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
    {html_content}
</body>
</html>"""
        
        # Convert HTML to PDF using pdfkit
        options = {
            'page-size': 'Letter',
            'margin-top': '1in',
            'margin-right': '1in',
            'margin-bottom': '1in',
            'margin-left': '1in',
            'encoding': 'UTF-8',
            'enable-local-file-access': None
        }
        
        pdfkit.from_string(html_doc, output_filename, options=options, configuration=pdfkit_config)
        
        print(f"✓ PDF created successfully: {output_filename}")
        return output_filename
    except Exception as e:
        print(f"Error creating PDF: {e}")
        return None


def main():
    """Main function to orchestrate the discussion guide generation."""
    print("=== YouTube Sermon Discussion Guide Generator ===\n")
    
    # Get video URLs from command line arguments
    video_urls = sys.argv[1:]
    
    # If no command line arguments, prompt for input
    if not video_urls:
        video_url = input("Enter YouTube video URL: ").strip()
        if video_url:
            video_urls = [video_url]
        else:
            print("Error: No URL provided")
            return
    
    # Process each video URL
    total = len(video_urls)
    for idx, video_url in enumerate(video_urls, 1):
        if total > 1:
            print(f"\n{'='*60}")
            print(f"Processing video {idx} of {total}")
            print(f"{'='*60}\n")
        
        generate_sermon_discussion_guide_pdf(video_url)


def generate_sermon_discussion_guide_pdf(video_url):
    if not video_url:
        print("Error: No URL provided")
        return
    
    transcript = get_youtube_transcript(video_url)
    if not transcript:
        print("Failed to retrieve transcript. Exiting.")
        return
    
    prompt = create_discussion_guide_prompt(transcript)
    
    discussion_guide = generate_with_gemini(prompt)
    if not discussion_guide:
        print("Error: Gemini failed to generate guide.")
        return
    
    # get the youtube video's title and publication date to include in the metadata
    ydl_opts = {'quiet': True, 'skip_download': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(video_url, download=False)
        video_title = info_dict.get('title', 'Unknown Title')
        video_publish_date = info_dict.get('upload_date', 'Unknown Date')
        if video_publish_date != 'Unknown Date':
            video_publish_date = datetime.strptime(video_publish_date, '%Y%m%d')
        else:
            video_publish_date = datetime.now()

    output_filename = f'Kings Church - Small Group Discussion Guide - Week of {video_publish_date.strftime("%B %d, %Y")}.pdf'
    export_to_pdf(discussion_guide, video_title, video_publish_date, output_filename)
    
    print("\n=== Process Complete ===")
    print(f"Discussion guide saved as: {output_filename}")
    return output_filename


if __name__ == "__main__":
    main()
