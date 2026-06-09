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
  console.error('ERROR: Could not read .env file!');
  process.exit(1);
}

if (!geminiKey) {
  console.error('ERROR: VITE_GEMINI_API_KEY is empty!');
  process.exit(1);
}

console.log('Listing available models for Gemini key...');
const genAI = new GoogleGenerativeAI(geminiKey);

async function listModels() {
  const response = await genAI.listModels();
  console.log('\nAvailable Models:');
  response.models.forEach(model => {
    console.log(`- ${model.name} (${model.displayName}): supports ${model.supportedGenerationMethods.join(', ')}`);
  });
}

listModels().catch(err => {
  console.error('Failed to list models:', err.message || err);
});
