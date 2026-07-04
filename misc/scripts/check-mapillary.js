import fs from 'fs';

// Read .env file manually
const envPath = './.env';
let mlyToken = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && match[1] === 'VITE_MAPILLARY_ACCESS_TOKEN') {
      mlyToken = (match[2] || '').trim();
      if (mlyToken.startsWith('"') && mlyToken.endsWith('"')) {
        mlyToken = mlyToken.substring(1, mlyToken.length - 1);
      }
    }
  });
} catch (e) {
  console.error('❌ ERROR: Could not read .env file in the current directory!');
  process.exit(1);
}

if (!mlyToken) {
  console.error('\n❌ ERROR: VITE_MAPILLARY_ACCESS_TOKEN is empty in your .env file!');
  process.exit(1);
}

console.log('====================================================');
console.log('      MAPILLARY API TOKEN ACTIVE VALIDATOR      ');
console.log('====================================================');
console.log(`Token: ${mlyToken.substring(0, 15)}... (Total length: ${mlyToken.length})\n`);

console.log('Testing point search near Shibuya Crossing, Tokyo (Lat: 35.6595, Lng: 139.7004)...');
const url = `https://graph.mapillary.com/images?lat=35.6595&lng=139.7004&radius=50&limit=5&access_token=${mlyToken}&fields=id,thumb_1024_url,captured_at`;

console.log('Sending request to Mapillary graph API...');
fetch(url)
  .then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
      console.error('\n❌ MAPILLARY API KEY CHECK FAILED!');
      console.error(`Status Code: ${res.status} ${res.statusText}`);
      console.error('API Error Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    console.log('\n✅ MAPILLARY API KEY IS VALID & WORKING!');
    console.log('Successfully retrieved street-level imagery data from Mapillary servers:');
    if (data.data && data.data.length > 0) {
      console.log(`- Total Images Found in Radius: ${data.data.length}`);
      const sample = data.data[0];
      console.log(`- Sample Image ID: ${sample.id}`);
      console.log(`- Sample Capture Time: ${sample.captured_at}`);
      console.log(`- Sample Thumbnail URL: ${sample.thumb_1024_url}`);
    } else {
      console.log('- Request succeeded, but no imagery is available within 150m of these coordinates.');
    }
  })
  .catch((err) => {
    console.error('\n❌ NETWORK EXCEPTION ENCOUNTERED:', err.message);
    process.exit(1);
  });
