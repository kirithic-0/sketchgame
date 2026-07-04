import { evaluateDrawing } from '../src/utils/geminiApi.js';
import fs from 'fs';

// 1x1 pixel Red PNG Base64 for lightweight API roundtrip testing
const DUMMY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// Read .env file manually
const envPath = './.env';
let geminiKey = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && match[1] === 'VITE_GEMINI_API_KEY') {
      geminiKey = (match[2] || '').trim();
      if (geminiKey.startsWith('"') && geminiKey.endsWith('"')) {
        geminiKey = geminiKey.substring(1, geminiKey.length - 1);
      }
    }
  });
} catch (e) {
  console.log('No .env file found, testing Mock Mode only.');
}

async function testGemini() {
  console.log('--- GEMINI VISION AI UTILITY TEST ---');

  // Test 1: Mock Evaluation Fallback (No Key)
  console.log('\nTest 1: Testing Mock Evaluation Fallback (No API Key)...');
  const mockResult = await evaluateDrawing(DUMMY_PNG_BASE64, '', 'tokyo');
  console.log('Mock Result:', mockResult);
  if (mockResult.isMock && mockResult.objectDrawn && mockResult.score) {
    console.log('SUCCESS: Mock evaluation successfully generated funny response for Tokyo!');
  } else {
    console.error('FAIL: Mock evaluation failed.');
  }

  // Test 2: Active API Evaluation
  console.log(`\nTest 2: Testing Active API Connection (Key Length: ${geminiKey.length})...`);
  if (!geminiKey) {
    console.log('NOTE: VITE_GEMINI_API_KEY is not configured in .env. Skipping active API query, testing fallback mechanism for API calls.');
    const failResult = await evaluateDrawing(DUMMY_PNG_BASE64, 'invalid_mock_key', 'paris');
    console.log('Failed Call Result (Fell back):', failResult);
    if (failResult.isMock && failResult.objectDrawn && failResult.consequence) {
      console.log('SUCCESS: Invalid key handled gracefully and triggered mock evaluation fallback!');
    } else {
      console.error('FAIL: Graceful fallback failed.');
    }
  } else {
    try {
      console.log('Sending 1x1 dummy image to Gemini 1.5 Flash...');
      const apiResult = await evaluateDrawing(DUMMY_PNG_BASE64, geminiKey, 'paris');
      console.log('API Result:', apiResult);
      if (!apiResult.isMock && apiResult.score && apiResult.consequence) {
        console.log('SUCCESS: Gemini successfully parsed image and returned structured JSON consequence and score!');
      } else {
        console.error('FAIL: API returned malformed result.');
      }
    } catch (e) {
      console.error('FAIL: Unhandled error in Gemini active API test:', e.message);
    }
  }
}

testGemini().catch(err => {
  console.error('Test run failed:', err);
});
