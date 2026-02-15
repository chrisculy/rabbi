# Rabbi - Small Group Guide Generator

AI-powered discussion guide generator for small groups. Transform sermon transcripts from YouTube or uploaded files into thoughtful, engaging discussion materials in minutes.

## Features

- **YouTube Integration**: Fetch transcripts directly from YouTube sermon videos
- **AI-Powered Generation**: Create discussion guides using Google Gemini AI
- **WYSIWYG Editor**: Edit guides with a rich text editor
- **PDF Export**: Generate professional PDFs of your discussion guides
- **User Authentication**: Secure Google OAuth authentication

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology Stack

- React with TypeScript
- Server-side rendering and API routes
- PostgreSQL database with Prisma ORM
- NextAuth.js for authentication
- TipTap editor for rich text editing
- Tailwind CSS for styling

## Project Structure

- `/src/app` - Application pages and API routes
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and database setup
- `/python-scripts` - Python scripts for guide generation and PDF creation
- `/public/assets` - Static assets including logos and fonts
