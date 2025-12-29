# Sermon Discussion Guide Generator

A Python script that automatically generates small group leader discussion guides from YouTube sermon videos or local transcript text files. It uses AI (Google Gemini) to create comprehensive, thoughtful discussion materials and exports them as professionally formatted PDF files with custom fonts and branding.

## Features

- 📺 Retrieves transcripts from YouTube videos automatically
- 📄 Supports local transcript text files (4-tuple format)
- 🤖 Generates discussion guides using Google Gemini AI
- 📑 Exports guides as professionally formatted PDFs with custom fonts
- 🎨 Includes church logo and branding in PDF header
- 🎯 Creates discussion questions following SOAP structure
- 📅 Automatically includes publication date in the guide
- ⚡ Batch processing support for multiple videos/transcripts

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- wkhtmltopdf (for PDF generation)
- Custom font files in `assets/` folder:
  - `Mont-HeavyDEMO.otf` (for h1 headings)
  - `Mont-ExtraLightDEMO.otf` (for body text)
  - `GothaProBla.otf` (for h2 headings)
  - `GotaProMed.otf` (for h3 headings)
- Church logo: `assets/Kings Primary Black.png`

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

### Interactive Mode

Run the script without arguments:
```bash
python main.py
```

When prompted, enter a YouTube URL or local transcript file path:
```
Enter YouTube video URL or local transcript file path: https://www.youtube.com/watch?v=VIDEO_ID
```
or
```
Enter YouTube video URL or local transcript file path: transcripts/sermon_12.29.24.txt
```

### Command Line Arguments

Process one or more inputs directly:
```bash
# Single YouTube video
python main.py https://www.youtube.com/watch?v=VIDEO_ID

# Local transcript file
python main.py transcripts/sermon_12.29.24.txt

# Multiple inputs (batch processing)
python main.py url1 transcript1.txt url2 transcript2.txt
```

### Local Transcript File Format

Local transcript files should follow this 4-tuple format:
```
00:00:00 - 00:00:05
Speaker Name
This is the transcript text for this segment.

00:00:05 - 00:00:10
Speaker Name
This is the next segment of transcript text.

```

Each tuple consists of:
- Line 1: Timestamp range
- Line 2: Speaker name
- Line 3: Transcript text
- Line 4: Blank line

The script will extract only the transcript text (line 3 of each tuple) and parse the date from the filename if present (format: MM.DD.YY).

## Output

The script will:
1. Fetch the transcript (from YouTube or local file)
2. Generate a discussion guide using Google Gemini
3. Create a professionally formatted PDF with custom fonts and logo

The output PDF will be saved with a filename like:
```
Kings Church - Small Group Discussion Guide - Week of December 29, 2025.pdf
```

The PDF includes:
- Church logo in the header
- Publication date
- Custom typography using provided fonts
- Structured discussion content

## Generated Guide Structure

Each discussion guide follows the SOAP structure and includes:

1. **Scripture** 
   - Brief summary of the sermon's main message (2-3 sentences)
   - Key themes and scripture references mentioned

2. **Observation**
   - 5-7 thoughtful discussion questions that:
     - Help understand what we learn about God
     - Help understand what we learn about humanity
     - Explore what God is inviting us to believe or obey
     - Connect the sermon to personal application
     - Foster group conversation

3. **Application**
   - Practical application challenge for the week

4. **Prayer**
   - Suggested closing prayer points

## Supported YouTube URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- Or just the video ID directly

## Requirements

- For YouTube videos: The video must have English captions/subtitles available (either auto-generated or manual)
- Valid API key for Google Gemini
- wkhtmltopdf must be installed on your system
- Internet connection for API calls and YouTube transcript retrieval
- Font files and logo in the `assets/` folder

## Troubleshooting

**Transcript not available:**
- Ensure the YouTube video has English captions enabled
- Some videos may have captions disabled by the creator
- For local files, verify the file exists and follows the 4-tuple format

**API errors:**
- Verify your GEMINI_API_KEY is correct in the `.env` file
- Check that you have API quota available
- Ensure you have internet connectivity

**PDF generation issues:**
- Verify wkhtmltopdf is installed and accessible
- On Windows, the script expects wkhtmltopdf at: `C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe`
- Update the path in [main.py](main.py#L27) if your installation location differs
- Make sure you have write permissions in the directory
- Verify font files are present in the `assets/` folder
- Verify logo file exists at `assets/Kings Primary Black.png`

**Font rendering issues:**
- Ensure all four font files are present in the `assets/` folder
- wkhtmltopdf requires absolute file paths for fonts - the script handles this automatically

## Development Notes

The script includes temporary caching features (controlled by flags at the top of the file):
- `use_temporary_gemini_markdown_cache`: Saves/loads Gemini-generated markdown to avoid API calls
- `use_temporary_html_cache`: Saves/loads HTML before PDF conversion

These are useful for development to avoid repeated API calls and speed up testing.

## Cost Considerations

- Google Gemini API: Has a generous free tier for personal use
- The API charges based on tokens used (input + output)
- Typical cost per guide is minimal or free under the free tier limits

## License

This project is open source and available for personal and educational use.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
