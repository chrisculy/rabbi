#!/usr/bin/env python3
"""
Standalone script to generate PDF from markdown.
Usage: python pdf_generator.py <markdown_content> <title> <date> <output_path>
"""
import sys
import os
from datetime import datetime
import markdown
import pdfkit
from io import BytesIO

def export_to_pdf_file(guide_markdown, video_title, video_publish_date, output_filename):
    """Export markdown to PDF file."""
    # Get absolute paths to assets
    assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'assets'))
    logo_path = os.path.join(assets_dir, 'Kings Primary Black.png')
    logo_url = f'file:///{logo_path.replace(os.sep, "/")}'
    
    # Font paths
    mont_heavy = f'file:///{os.path.join(assets_dir, "Mont-HeavyDEMO.otf").replace(os.sep, "/")}'
    mont_extralight = f'file:///{os.path.join(assets_dir, "Mont-ExtraLightDEMO.otf").replace(os.sep, "/")}'
    gotha_black = f'file:///{os.path.join(assets_dir, "GothaProBla.otf").replace(os.sep, "/")}'
    gotha_medium = f'file:///{os.path.join(assets_dir, "GotaProMed.otf").replace(os.sep, "/")}'
    
    # Convert markdown to HTML
    html_content = markdown.markdown(
        guide_markdown,
        extensions=['extra', 'nl2br', 'sane_lists']
    )
    
    # Create complete HTML document
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
    
    # Configure pdfkit
    path_to_wkhtmltopdf = r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
    if not os.path.isfile(path_to_wkhtmltopdf):
        # Try common alternative locations
        alternative_paths = [
            r'C:\Program Files (x86)\wkhtmltopdf\bin\wkhtmltopdf.exe',
            r'wkhtmltopdf',  # If in PATH
        ]
        for alt_path in alternative_paths:
            if os.path.isfile(alt_path) or os.system(f'where {alt_path}') == 0:
                path_to_wkhtmltopdf = alt_path
                break
    
    config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)
    
    options = {
        'page-size': 'Letter',
        'margin-top': '1in',
        'margin-right': '1in',
        'margin-bottom': '1in',
        'margin-left': '1in',
        'encoding': 'UTF-8',
        'enable-local-file-access': None
    }
    
    pdfkit.from_string(html_doc, output_filename, options=options, configuration=config)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python pdf_generator.py <markdown> <title> <date> <output>")
        sys.exit(1)
    
    markdown_content = sys.argv[1]
    title = sys.argv[2]
    date_str = sys.argv[3] if len(sys.argv) > 3 else None
    output_path = sys.argv[4] if len(sys.argv) > 4 else 'output.pdf'
    
    publish_date = datetime.fromisoformat(date_str) if date_str else datetime.now()
    
    try:
        export_to_pdf_file(markdown_content, title, publish_date, output_path)
        print(f"PDF generated: {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
