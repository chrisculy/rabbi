import { fetchTranscript, generateGuide } from '../src/lib/python-executor';

async function test() {
  console.log('🧪 Testing Python integration...\n');

  // Test 1: Fetch YouTube transcript
  console.log('Test 1: Fetching YouTube transcript...');
  try {
    const result = await fetchTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('✅ Success!');
    console.log('Title:', result.title);
    console.log('Transcript length:', result.transcript.length);
  } catch (error) {
    console.log('❌ Failed:', error);
  }

  console.log('\nTests complete!');
}

test();
