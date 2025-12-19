# YouTube Sermon Discussion Guide Generator

A Python script that automatically generates small group leader discussion guides from YouTube sermon videos. It uses AI (Google Gemini) to create comprehensive, thoughtful discussion materials and exports them as professionally formatted PDF files.

## Features

- 📺 Retrieves transcripts from YouTube videos automatically
- 🤖 Generates discussion guides using Google Gemini AI
- 📄 Exports guides as professionally formatted PDFs with Markdown-to-PDF conversion
- 🎯 Creates discussion questions, application points, and prayer topics
- 📅 Automatically includes video title and publication date in the guide

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- wkhtmltopdf (for PDF generation)

## Installation

1. Clone or download this repository

2. Install wkhtmltopdf:
   - **Windows**: Download and install from https://wkhtmltopdf.org/downloads.html
   - **Mac**: `brew install wkhtmltopdf`
   - **Linux**: `sudo apt-get install wkhtmltopdf`

3. Install required Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up your API key:
   - Create a `.env` file in the project directory
   - Add your Gemini API key (get it from: https://aistudio.google.com/app/apikey)

```bash
# Create .env file
echo "GEMINI_API_KEY=your-actual-gemini-key" > .env
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
2. Extract the video title and publication date
3. Generate a discussion guide using Google Gemini
4. Export the guide as a professionally formatted PDF

The output PDF will be saved in the same directory with a filename like:
```
Kings Church - Small Group Discussion Guide - Week of December 15, 2025.pdf
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

- The YouTube video must have English captions/subtitles available (either auto-generated or manual)
- You need a valid API key for Google Gemini
- wkhtmltopdf must be installed on your system
- Internet connection for API calls and transcript retrieval

## Troubleshooting

**Transcript not available:**
- Ensure the video has English captions enabled
- Some videos may have captions disabled by the creator

**API errors:**
- Verify your GEMINI_API_KEY is correct in the `.env` file
- Check that you have API quota available
- Ensure you have internet connectivity

**PDF generation issues:**
- Verify wkhtmltopdf is installed and accessible
- On Windows, the script expects wkhtmltopdf at: `C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe`
- Update the path in [main.py](main.py#L27) if your installation location differs
- Make sure you have write permissions in the directory

## Cost Considerations

- Google Gemini API: Has a generous free tier for personal use
- The API charges based on tokens used (input + output)
- Typical cost per guide is minimal or free under the free tier limits

## License

This project is open source and available for personal and educational use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
