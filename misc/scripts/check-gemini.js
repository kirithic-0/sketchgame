import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

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
  console.error('❌ ERROR: Could not read .env file in current directory!');
  process.exit(1);
}

if (!geminiKey) {
  console.error('\n❌ ERROR: VITE_GEMINI_API_KEY is empty in your .env file!');
  process.exit(1);
}

console.log('====================================================');
console.log('       GEMINI VISION AI KEY ACTIVE VALIDATOR        ');
console.log('====================================================');
console.log(`Key: ${geminiKey.substring(0, 10)}... (Total length: ${geminiKey.length})\n`);

console.log('Initializing Google Generative AI client...');
try {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  console.log('Sending a lightweight test prompt to gemini-2.5-flash...');
  model.generateContent('Say "API validation success" in a witty, sarcastic tone in one sentence.')
    .then((result) => {
      const text = result.response.text();
      console.log('\n✅ GEMINI API KEY IS VALID & WORKING!');
      console.log('Model Response:');
      console.log(`> "${text.trim()}"`);
    })
    .catch((err) => {
      console.error('\n❌ GEMINI API KEY CHECK FAILED!');
      console.error('Error Details:', err.message || err);
      process.exit(1);
    });
} catch (e) {
  console.error('\n❌ INITIALIZATION EXCEPTION:', e.message);
  process.exit(1);
}
