#!/usr/bin/env python3
"""
Standalone script to fetch YouTube transcripts or parse local files.
Usage: python transcript_fetcher.py <youtube_url_or_file_path>
Returns JSON: {"transcript": "...", "title": "...", "date": "YYYY-MM-DD"}
"""
import sys
import json
from datetime import datetime
import yt_dlp
import re
import os

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
    
    return youtube_url

def get_youtube_transcript(video_url):
    """Retrieve transcript from YouTube video."""
    video_id = extract_video_id(video_url)
    
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
            
            # Get metadata
            video_title = info.get('title', 'Unknown Title')
            video_publish_date = info.get('upload_date', None)
            if video_publish_date:
                video_publish_date = datetime.strptime(video_publish_date, '%Y%m%d').strftime('%Y-%m-%d')
            
            # Get transcript
            if 'automatic_captions' in info and 'en' in info['automatic_captions']:
                english_captions = info['automatic_captions']['en']
                ttml_captions = [cap for cap in english_captions if cap['ext'] == 'ttml']
                
                if not ttml_captions:
                    return None
                
                transcript_url = ttml_captions[0]['url']
            else:
                return None
            
            # Download and parse transcript
            import urllib.request
            import xml.etree.ElementTree as ET
            
            with urllib.request.urlopen(transcript_url) as response:
                transcript_data = response.read().decode('utf-8')
            
            xml_tree = ET.ElementTree(ET.fromstring(transcript_data))
            root = xml_tree.getroot()
            transcript_text = ' '.join([p.text for p in root.iter('{http://www.w3.org/ns/ttml}p') if p.text])
            
            return {
                "transcript": transcript_text,
                "title": video_title,
                "date": video_publish_date
            }
            
    except Exception as e:
        return None

def read_local_transcript(file_path):
    """Read transcript from a local text file."""
    if not os.path.isfile(file_path):
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Parse 4-tuples and extract transcript text
    transcript_lines = []
    for i in range(0, len(lines), 4):
        if i + 2 < len(lines):
            transcript_text = lines[i + 2].strip()
            if transcript_text:
                transcript_lines.append(transcript_text)
    
    transcript = '\n'.join(transcript_lines)
    
    # Extract date from filename (format: MM.DD.YY)
    filename = os.path.splitext(os.path.basename(file_path))[0]
    date_match = re.search(r'(\d{2})\.(\d{2})\.(\d{2})', filename)
    
    publish_date = None
    if date_match:
        month, day, year = map(int, date_match.groups())
        year += 2000
        publish_date = f"{year:04d}-{month:02d}-{day:02d}"
    
    return {
        "transcript": transcript,
        "title": filename,
        "date": publish_date
    }

def is_youtube_url(input_string):
    """Check if the input string is a YouTube URL."""
    youtube_patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com',
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be',
    ]
    return any(re.search(pattern, input_string) for pattern in youtube_patterns)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)
    
    input_source = sys.argv[1]
    
    result = None
    if is_youtube_url(input_source):
        result = get_youtube_transcript(input_source)
    else:
        result = read_local_transcript(input_source)
    
    if result:
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "Failed to retrieve transcript"}))
        sys.exit(1)
