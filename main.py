"""
YouTube Sermon Discussion Guide Generator

This script retrieves transcripts from YouTube sermon videos and generates
small group leader discussion guides using Google Gemini and ChatGPT.
It then evaluates both responses and creates a final PDF document.
"""

import os
import json
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from dotenv import load_dotenv
import openai
import google.generativeai as genai
from fpdf import FPDF
import re
from datetime import datetime
import yt_dlp
import tempfile

# Load environment variables
load_dotenv()

# Configure APIs
openai.api_key = os.getenv('OPENAI_API_KEY')
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))


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


def get_youtube_transcript_ytdlp(video_url):
    """Retrieve transcript using yt-dlp as a fallback method."""
    print("\nTrying alternative method with yt-dlp...")
    
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
            
            # Check for subtitles
            if 'subtitles' in info and 'en' in info['subtitles']:
                sub_url = info['subtitles']['en'][0]['url']
            elif 'automatic_captions' in info and 'en' in info['automatic_captions']:
                sub_url = info['automatic_captions']['en'][0]['url']
            else:
                print("No English subtitles found")
                return None
            
            # Download and parse the subtitle file
            import urllib.request
            with urllib.request.urlopen(sub_url) as response:
                subtitle_data = response.read().decode('utf-8')
            
            # Parse the subtitle format (usually JSON for YouTube)
            import xml.etree.ElementTree as ET
            try:
                # Try parsing as XML first (YouTube's format)
                root = ET.fromstring(subtitle_data)
                transcript_text = ' '.join([text.text for text in root.findall('.//text') if text.text])
            except:
                # If XML fails, try JSON format
                import json
                sub_json = json.loads(subtitle_data)
                transcript_text = ' '.join([event['segs'][0]['utf8'] for event in sub_json.get('events', []) if 'segs' in event])
            
            print(f"✓ Transcript retrieved via yt-dlp ({len(transcript_text)} characters)")
            return transcript_text
            
    except Exception as e:
        print(f"yt-dlp method also failed: {type(e).__name__}: {e}")
        return None


def get_youtube_transcript(video_url):
    """Retrieve transcript from YouTube video."""
    print("Fetching YouTube transcript...")
    
    video_id = extract_video_id(video_url)
    print(f"Video ID: {video_id}")
    
    try:
        # Try the simple get_transcript method first with different language codes
        language_codes = ['en', 'en-US', 'en-GB', 'a.en']
        
        for lang_code in language_codes:
            try:
                print(f"Trying language code: {lang_code}")
                transcript_data = YouTubeTranscriptApi.get_transcript(
                    video_id, 
                    languages=[lang_code],
                    preserve_formatting=True
                )
                transcript_text = ' '.join([entry['text'] for entry in transcript_data])
                print(f"✓ Transcript retrieved ({len(transcript_text)} characters)")
                return transcript_text
            except Exception as lang_error:
                print(f"  Failed with {lang_code}: {type(lang_error).__name__}")
                continue
        
        # If direct method fails, try the list_transcripts approach
        print("\nTrying list_transcripts method...")
        transcript_list_obj = YouTubeTranscriptApi.list_transcripts(video_id)
        
        print("\nAvailable transcripts:")
        for transcript in transcript_list_obj:
            print(f"  - {transcript.language} ({transcript.language_code}) - {'Auto-generated' if transcript.is_generated else 'Manual'}")
            try:
                print(f"    Attempting to fetch...")
                transcript_data = transcript.fetch()
                transcript_text = ' '.join([entry['text'] for entry in transcript_data])
                print(f"✓ Transcript retrieved ({len(transcript_text)} characters)")
                return transcript_text
            except Exception as fetch_error:
                print(f"    Failed to fetch: {type(fetch_error).__name__}: {fetch_error}")
                continue
        
        print("❌ youtube-transcript-api methods failed")
        
        # Try yt-dlp as fallback
        return get_youtube_transcript_ytdlp(video_url)
        
    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable):
        print(f"\n❌ Transcripts unavailable via youtube-transcript-api")
        # Try yt-dlp as fallback
        return get_youtube_transcript_ytdlp(video_url)
    except Exception as e:
        print(f"\n❌ Error with youtube-transcript-api: {type(e).__name__}: {e}")
        # Try yt-dlp as fallback
        return get_youtube_transcript_ytdlp(video_url)


def create_discussion_guide_prompt(transcript):
    """Create the prompt for generating a discussion guide."""
    return f"""Based on the following sermon transcript, create a comprehensive small group leader discussion guide. 

The guide should include:
1. A brief summary of the sermon's main message (2-3 sentences)
2. Key themes and scripture references mentioned
3. 5-7 thoughtful discussion questions that:
   - Help participants reflect on the sermon's message
   - Connect the sermon to personal application
   - Encourage deeper theological exploration
   - Foster group conversation
4. A practical application challenge for the week
5. Suggested closing prayer points

Format the guide in a clear, easy-to-read structure that a small group leader can follow.

SERMON TRANSCRIPT:
{transcript[:8000]}

Please provide a well-structured discussion guide."""


def generate_with_chatgpt(prompt):
    """Generate discussion guide using ChatGPT."""
    print("Generating discussion guide with ChatGPT...")
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an experienced small group ministry leader and theological educator who creates engaging discussion guides."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        guide = response.choices[0].message.content
        print("✓ ChatGPT guide generated")
        return guide
    except Exception as e:
        print(f"Error with ChatGPT: {e}")
        return None


def generate_with_gemini(prompt):
    """Generate discussion guide using Google Gemini."""
    print("Generating discussion guide with Gemini...")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(prompt)
        
        guide = response.text
        print("✓ Gemini guide generated")
        return guide
    except Exception as e:
        print(f"Error with Gemini: {e}")
        return None


def evaluate_guides(chatgpt_guide, gemini_guide, transcript):
    """Evaluate which guide is better using ChatGPT as the judge."""
    print("\nEvaluating both discussion guides...")
    
    evaluation_prompt = f"""You are an expert in evaluating small group discussion materials. 
Compare the following two discussion guides and determine which one is better overall.

Evaluate based on:
1. Clarity and structure
2. Quality and depth of discussion questions
3. Practical applicability
4. Theological soundness
5. Engagement potential for small groups

GUIDE A:
{chatgpt_guide}

GUIDE B:
{gemini_guide}

Respond with a JSON object in this format:
{{
    "winner": "A" or "B",
    "reasoning": "Brief explanation of why this guide is better",
    "score_a": score from 1-10,
    "score_b": score from 1-10
}}"""
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert evaluator of small group discussion materials. Respond only with valid JSON."},
                {"role": "user", "content": evaluation_prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        evaluation_text = response.choices[0].message.content
        # Extract JSON from potential markdown code blocks
        if "```json" in evaluation_text:
            evaluation_text = evaluation_text.split("```json")[1].split("```")[0].strip()
        elif "```" in evaluation_text:
            evaluation_text = evaluation_text.split("```")[1].split("```")[0].strip()
        
        evaluation = json.loads(evaluation_text)
        
        print(f"\n=== Evaluation Results ===")
        print(f"Winner: Guide {evaluation['winner']}")
        print(f"Score A (ChatGPT): {evaluation['score_a']}/10")
        print(f"Score B (Gemini): {evaluation['score_b']}/10")
        print(f"Reasoning: {evaluation['reasoning']}")
        
        return evaluation
    except Exception as e:
        print(f"Error during evaluation: {e}")
        print("Defaulting to ChatGPT guide...")
        return {"winner": "A", "reasoning": "Evaluation failed", "score_a": 0, "score_b": 0}


class PDF(FPDF):
    """Custom PDF class with header and footer."""
    
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'Small Group Discussion Guide', 0, 1, 'C')
        self.ln(5)
    
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')
    
    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.multi_cell(0, 8, title)
        self.ln(2)
    
    def chapter_body(self, body):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 6, body)
        self.ln()


def export_to_pdf(guide_text, video_url, output_filename='discussion_guide.pdf'):
    """Export the discussion guide to a PDF file."""
    print(f"\nExporting to PDF: {output_filename}")
    
    try:
        pdf = PDF()
        pdf.add_page()
        
        # Add metadata
        pdf.set_font('Arial', 'I', 9)
        pdf.cell(0, 5, f'Generated: {datetime.now().strftime("%B %d, %Y")}', 0, 1)
        pdf.cell(0, 5, f'Video: {video_url}', 0, 1)
        pdf.ln(5)
        
        # Add the guide content
        # Simple text wrapping for better PDF formatting
        lines = guide_text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                pdf.ln(3)
                continue
            
            # Check if it's a heading (simple heuristic)
            if line.isupper() or line.startswith('#') or (len(line) < 60 and not line.endswith('.')):
                pdf.chapter_title(line.replace('#', '').strip())
            else:
                pdf.chapter_body(line)
        
        pdf.output(output_filename)
        print(f"✓ PDF created successfully: {output_filename}")
        return output_filename
    except Exception as e:
        print(f"Error creating PDF: {e}")
        return None


def main():
    """Main function to orchestrate the discussion guide generation."""
    print("=== YouTube Sermon Discussion Guide Generator ===\n")
    
    # Get YouTube URL from user
    video_url = input("Enter YouTube video URL: ").strip()
    
    if not video_url:
        print("Error: No URL provided")
        return
    
    # Step 1: Get transcript
    transcript = get_youtube_transcript(video_url)
    if not transcript:
        print("Failed to retrieve transcript. Exiting.")
        return
    
    # Step 2: Create prompt
    prompt = create_discussion_guide_prompt(transcript)
    
    # Step 3: Generate guides with both AI services
    chatgpt_guide = generate_with_chatgpt(prompt)
    gemini_guide = generate_with_gemini(prompt)
    
    if not chatgpt_guide and not gemini_guide:
        print("Error: Both AI services failed to generate guides.")
        return
    
    if not chatgpt_guide:
        print("ChatGPT failed, using Gemini guide...")
        final_guide = gemini_guide
    elif not gemini_guide:
        print("Gemini failed, using ChatGPT guide...")
        final_guide = chatgpt_guide
    else:
        # Step 4: Evaluate both guides
        evaluation = evaluate_guides(chatgpt_guide, gemini_guide, transcript)
        
        # Step 5: Select the best guide
        if evaluation['winner'] == 'A':
            final_guide = chatgpt_guide
            print("\n✓ Selected ChatGPT guide")
        else:
            final_guide = gemini_guide
            print("\n✓ Selected Gemini guide")
    
    # Step 6: Export to PDF
    video_id = extract_video_id(video_url)
    output_filename = f'discussion_guide_{video_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
    export_to_pdf(final_guide, video_url, output_filename)
    
    print("\n=== Process Complete ===")
    print(f"Discussion guide saved as: {output_filename}")


if __name__ == "__main__":
    main()
