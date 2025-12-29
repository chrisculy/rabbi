"""
Sermon Discussion Guide Generator

This script retrieves transcripts from YouTube sermon videos or local text files and generates
small group leader discussion guides using Google Gemini.
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

use_temporary_gemini_markdown_cache = False
use_temporary_html_cache = False

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
    a. a brief summary of the sermon passage (focus more on summarizing the sermon's passage than the sermon itself) (2-3 sentences)
    b. Key themes and scripture references mentioned
3. Observation:
    a. 5-7 thoughtful discussion questions that:
        - Help participants reflect on the sermon's passage
        - Connect the sermon and its passage to personal application
        - Encourage deeper theological exploration
        - Foster group conversation
         - Aid in answering the following questions each week (but can phrase differently as needed for the particular sermon passage):
            1. What do we learn about God? 
            2. What do we learn about humanity?
            3. What is God inviting us to believe or obey in this passage?
4. Application:
    a. A practical application challenge for the week
5. Prayer:
    a. Suggested closing prayer points

Lay out the guide in a clear, easy-to-read structure that a small group leader can follow. Please do not include any reference to the AI or the tool used to generate the guide. Also do not reference the prompt itself in the guide (e.g. "This guide is intended for a 20-40 minute discussion", etc.)

Please note that the sermon transcript may include some announcements at the beginning and an invitation to respond at the end; focus on the main sermon content.

The output must be in Markdown format.

BEGIN SERMON TRANSCRIPT.

{transcript}

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
        # When enabled, save/load HTML to a cache file to avoid regenerating (used for testing)
        html_doc = None
        if (use_temporary_html_cache):
            html_filename = 'discussion_guide.html'
            
            if os.path.exists(html_filename):
                print(f"Loading existing HTML from {html_filename}")
                with open(html_filename, 'r', encoding='utf-8') as f:
                    html_doc = f.read()
                print("✓ HTML loaded from file")

        if not html_doc:
            # Get absolute path to logo file for wkhtmltopdf
            logo_path = os.path.abspath('assets/Kings Primary Black.png')
            
            # Convert to file:// URL format for wkhtmltopdf
            logo_url = f'file:///{logo_path.replace(os.sep, "/")}'
            
            # Get absolute paths to font files
            assets_dir = os.path.abspath('assets')
            mont_heavy = f'file:///{os.path.join(assets_dir, "Mont-HeavyDEMO.otf").replace(os.sep, "/")}'
            mont_extralight = f'file:///{os.path.join(assets_dir, "Mont-ExtraLightDEMO.otf").replace(os.sep, "/")}'
            gotha_black = f'file:///{os.path.join(assets_dir, "GothaProBla.otf").replace(os.sep, "/")}'
            gotha_medium = f'file:///{os.path.join(assets_dir, "GothaProMed.otf").replace(os.sep, "/")}'
            
            # Convert markdown to HTML
            html_content = markdown.markdown(
                guide_markdown,
                extensions=['extra', 'nl2br', 'sane_lists']
            )
            
            # Wrap in a complete HTML document with styling
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

        if use_temporary_html_cache and not os.path.exists(html_filename):
            with open(html_filename, 'w', encoding='utf-8') as f:
                f.write(html_doc)
            print(f"✓ HTML saved to {html_filename}")

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


def is_youtube_url(input_string):
    """Check if the input string is a YouTube URL."""
    youtube_patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be',
    ]
    return any(re.search(pattern, input_string) for pattern in youtube_patterns)


def read_local_transcript(file_path):
    """Read transcript from a local text file.
    
    Expected format: 4-tuples where each tuple consists of:
    - Line 1: Timestamp range
    - Line 2: Speaker
    - Line 3: Transcript text
    - Line 4: Blank line
    """
    print(f"Reading transcript from local file: {file_path}")
    
    try:
        if not os.path.isfile(file_path):
            print(f"Error: File not found: {file_path}")
            return None
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Parse 4-tuples and extract transcript text (every 3rd line in groups of 4)
        transcript_lines = []
        for i in range(0, len(lines), 4):
            if i + 2 < len(lines):  # Ensure we have at least 3 lines
                transcript_text = lines[i + 2].strip()  # 3rd line (index 2) is the transcript text
                if transcript_text:  # Only add non-empty lines
                    transcript_lines.append(transcript_text)
        
        transcript = '\n'.join(transcript_lines)
        
        print(f"✓ Transcript loaded from file ({len(transcript)} characters)")
        return transcript
    except Exception as e:
        print(f"Error reading file: {e}")
        return None


def main():
    """Main function to orchestrate the discussion guide generation."""
    print("=== Sermon Discussion Guide Generator ===\n")
    
    # Get inputs from command line arguments
    inputs = sys.argv[1:]
    
    # If no command line arguments, prompt for input
    if not inputs:
        user_input = input("Enter YouTube video URL or local transcript file path: ").strip()
        if user_input:
            inputs = [user_input]
        else:
            print("Error: No input provided")
            return
    
    # Process each input
    total = len(inputs)
    for idx, input_item in enumerate(inputs, 1):
        if total > 1:
            print(f"\n{'='*60}")
            print(f"Processing input {idx} of {total}")
            print(f"{'='*60}\n")
        
        generate_sermon_discussion_guide_pdf(input_item)


def generate_sermon_discussion_guide_pdf(input_source):
    if not input_source:
        print("Error: No input provided")
        return
    
    # Determine if input is a YouTube URL or local file
    if is_youtube_url(input_source):
        # YouTube URL processing
        transcript = get_youtube_transcript(input_source)
        if not transcript:
            print("Failed to retrieve transcript. Exiting.")
            return
        
        # Get the youtube video's title and publication date to include in the metadata
        ydl_opts = {'quiet': True, 'skip_download': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(input_source, download=False)
            video_title = info_dict.get('title', 'Unknown Title')
            video_publish_date = info_dict.get('upload_date', 'Unknown Date')
            if video_publish_date != 'Unknown Date':
                video_publish_date = datetime.strptime(video_publish_date, '%Y%m%d')
            else:
                video_publish_date = datetime.now()
    else:
        # Local file processing
        transcript = read_local_transcript(input_source)
        if not transcript:
            print("Failed to read transcript from file. Exiting.")
            return
        
        # Use filename and current date for metadata
        video_title = os.path.splitext(os.path.basename(input_source))[0]

        # Attempt to load publication date from file name (format: MM.DD.YY)
        filename = os.path.splitext(os.path.basename(input_source))[0]
        date_match = re.search(r'(\d{2})\.(\d{2})\.(\d{2})', filename)
        if date_match:
            month, day, year = map(int, date_match.groups())
            year += 2000  # Convert YY to YYYY
            video_publish_date = datetime(year, month, day)
        else:
            video_publish_date = datetime.now()
    
    prompt = create_discussion_guide_prompt(transcript)
    
    # When enabled, save/load discussion guide markdown to a cache file to avoid regenerating (used for testing)
    discussion_guide = None
    if use_temporary_gemini_markdown_cache:
        markdown_filename = f'discussion_guide_gemini.md'
        
        if os.path.exists(markdown_filename):
            print(f"Loading existing discussion guide from {markdown_filename}")
            with open(markdown_filename, 'r', encoding='utf-8') as f:
                discussion_guide = f.read()
            print("✓ Discussion guide loaded from file")

    if not discussion_guide:
        discussion_guide = generate_with_gemini(prompt)
        if not discussion_guide:
            print("Error: Gemini failed to generate guide.")
            return

    if use_temporary_html_cache and not os.path.exists(markdown_filename):
        with open(markdown_filename, 'w', encoding='utf-8') as f:
            f.write(discussion_guide)
        print(f"✓ Discussion guide saved to {markdown_filename}")

    output_filename = f'Kings Church - Small Group Discussion Guide - Week of {video_publish_date.strftime("%B %d, %Y")}.pdf'
    export_to_pdf(discussion_guide, video_title, video_publish_date, output_filename)
    
    print("\n=== Process Complete ===")
    print(f"Discussion guide saved as: {output_filename}")
    return output_filename


if __name__ == "__main__":
    main()
