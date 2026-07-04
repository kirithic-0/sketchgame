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

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;

console.log('Fetching available models from Google API...');
fetch(url)
  .then(async res => {
    const data = await res.json();
    if (!res.ok) {
      console.error('Failed to fetch models:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    console.log('\nAvailable Models:');
    if (data.models) {
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
        }
      });
    } else {
      console.log('No models returned.');
    }
  })
  .catch(err => {
    console.error('Network Error:', err.message);
  });
