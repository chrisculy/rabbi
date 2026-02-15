import { fetchYoutubeTranscript } from '../src/lib/transcript-fetcher';
import { generateGuide } from '../src/lib/guide-generator';

async function test() {
  console.log('🧪 Testing TypeScript integration...\n');

  // Test 1: Fetch YouTube transcript
  console.log('Test 1: Fetching YouTube transcript...');
  try {
    const result = await fetchYoutubeTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('✅ Success!');
    console.log('Title:', result.title);
    console.log('Transcript length:', result.transcript.length);

    // Test 2: Generate guide from transcript
    console.log('\nTest 2: Generating discussion guide...');
    const markdown = await generateGuide(result.transcript);
    console.log('✅ Success!');
    console.log('Generated markdown length:', markdown.length);
  } catch (error) {
    console.log('❌ Failed:', error);
  }

  console.log('\nTests complete!');
}

test();
