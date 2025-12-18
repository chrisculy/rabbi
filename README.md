# YouTube Sermon Discussion Guide Generator

A Python script that automatically generates small group leader discussion guides from YouTube sermon videos. It uses AI (Google Gemini and ChatGPT) to create comprehensive, thoughtful discussion materials and exports them as PDF files.

## Features

- 📺 Retrieves transcripts from YouTube videos automatically
- 🤖 Generates discussion guides using both Google Gemini and ChatGPT
- ⚖️ Evaluates and selects the best guide
- 📄 Exports the final guide as a professionally formatted PDF
- 🎯 Creates discussion questions, application points, and prayer topics

## Prerequisites

- Python 3.8 or higher
- OpenAI API key (for ChatGPT)
- Google Gemini API key

## Installation

1. Clone or download this repository

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

3. Set up your API keys:
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key (get it from: https://platform.openai.com/api-keys)
   - Add your Gemini API key (get it from: https://makersuite.google.com/app/apikey)

```bash
cp .env.example .env
```

Then edit `.env` with your actual API keys:
```
OPENAI_API_KEY=sk-your-actual-openai-key
GEMINI_API_KEY=your-actual-gemini-key
```

## Usage

Run the script:
```bash
python main.py
```

When prompted, enter the YouTube video URL:
```
Enter YouTube video URL: https://www.youtube.com/watch?v=VIDEO_ID
```

The script will:
1. Fetch the video transcript
2. Generate discussion guides using both ChatGPT and Gemini
3. Evaluate which guide is better
4. Export the best guide as a PDF file

The output PDF will be saved in the same directory with a filename like:
```
discussion_guide_VIDEO_ID_20251218_143022.pdf
```

## Generated Guide Structure

Each discussion guide includes:

1. **Sermon Summary** - Brief overview of the main message
2. **Key Themes** - Important topics and scripture references
3. **Discussion Questions** - 5-7 thought-provoking questions for group conversation
4. **Practical Application** - Weekly challenge for participants
5. **Prayer Points** - Suggested topics for closing prayer

## Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Or just the video ID directly

## Requirements

- The YouTube video must have captions/subtitles available (either auto-generated or manual)
- You need valid API keys for both OpenAI and Google Gemini
- Internet connection for API calls

## Troubleshooting

**Transcript not available:**
- Ensure the video has captions enabled
- Some videos may have captions disabled by the creator

**API errors:**
- Verify your API keys are correct in the `.env` file
- Check that you have API credits/quota available
- Ensure you have internet connectivity

**PDF generation issues:**
- Make sure you have write permissions in the directory
- Check that the fpdf library is properly installed

## Cost Considerations

- OpenAI API (GPT-4): Approximately $0.01-0.03 per guide
- Google Gemini API: Has a generous free tier
- Both services charge based on tokens used

## License

This project is open source and available for personal and educational use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
