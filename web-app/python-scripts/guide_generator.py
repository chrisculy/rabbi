#!/usr/bin/env python3
"""
Standalone script to generate discussion guide from transcript.
Usage: python guide_generator.py <transcript_text>
Returns JSON: {"markdown": "..."}
"""
import sys
import json
import os
from google import genai
import mdformat
import re

def create_discussion_guide_prompt(transcript):
    """Create the prompt for generating a discussion guide."""
    return f"""Based on the following sermon transcript, create a small group leader discussion guide suitable for a 20-40 minute discussion. 

The guide should follow the SOAP structure (Scripture, Observation, Application, Prayer) and include the following elements:

A title in the format "Small Group Discussion Guide: [Sermon Passage]"

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

Lay out the guide in a clear, easy-to-read structure that a small group leader can follow. Please do not reference the structure of the guide in the guide itself (e.g. "This guide is intended for a 20-40 minute discussion", "Use this guide to facilitate conversation", etc.)

Please note that the sermon transcript may include some announcements at the beginning and an invitation to respond at the end; focus on the main sermon content.

The output must be in Markdown format.

BEGIN SERMON TRANSCRIPT.

{transcript}

END SERMON TRANSCRIPT.
Please provide a well-structured discussion guide."""

def generate_with_gemini(prompt, api_key):
    """Generate discussion guide using Google Gemini."""
    try:
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt,
            config={"temperature": 0.8}
        )
        
        guide = response.text
        
        # Format the markdown
        guide = mdformat.text(
            guide,
            options={
                "wrap": "keep",
                "number": True,
                "end_of_line": "lf"
            })
        
        # Ensure proper list spacing
        guide = re.sub(r'^(\s*[\*\-\+])\s{2,}', r'\1 ', guide, flags=re.MULTILINE)
        guide = re.sub(r'^(\s*\d+\.)\s{2,}', r'\1 ', guide, flags=re.MULTILINE)
        guide = re.sub(r'(?<!\n)\n(#{1,6}\s)', r'\n\n\1', guide)
        
        return guide
    except Exception as e:
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No transcript provided"}))
        sys.exit(1)
    
    transcript = sys.argv[1]
    api_key = os.environ.get('GEMINI_API_KEY')
    
    if not api_key:
        print(json.dumps({"error": "GEMINI_API_KEY not found"}))
        sys.exit(1)
    
    prompt = create_discussion_guide_prompt(transcript)
    markdown = generate_with_gemini(prompt, api_key)
    
    if markdown:
        print(json.dumps({"markdown": markdown}))
    else:
        print(json.dumps({"error": "Failed to generate guide"}))
        sys.exit(1)
