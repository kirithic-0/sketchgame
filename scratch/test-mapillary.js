import { fetchStreetImage, getRandomLocation, LOCATIONS } from '../src/utils/mapillaryApi.js';
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
  console.log('No .env file found, will test fallback mode only.');
}

async function testMapillary() {
  console.log('--- MAPILLARY API UTILITY TEST ---');
  console.log(`Total Curated Locations: ${LOCATIONS.length}`);

  // Pick a random location
  const location = getRandomLocation();
  console.log(`\nTesting Location: ${location.name} (${location.country})`);
  console.log(`Coordinates: Lat: ${location.lat}, Lng: ${location.lng}`);

  // Test 1: Fallback Mode (No Token)
  console.log('\nTest 1: Fallback Mode (No Token)...');
  const fallbackResult = await fetchStreetImage(location, '');
  console.log('Result:', fallbackResult);
  if (fallbackResult.imageUrl === location.fallbackUrl && fallbackResult.isMock === true) {
    console.log('SUCCESS: Fallback mode correctly returned Unsplash image URL.');
  } else {
    console.error('FAIL: Fallback mode failed.');
  }

  // Test 2: Active API Query Mode
  console.log(`\nTest 2: Active API Mode (Token Length: ${mlyToken.length})...`);
  if (!mlyToken) {
    console.log('NOTE: VITE_MAPILLARY_ACCESS_TOKEN is not configured in .env. Skipping active API query, testing fallback mechanism for API queries.');
    // Test with a mock invalid token to verify it fails and falls back gracefully
    const apiResult = await fetchStreetImage(location, 'MLY|invalid_mock_token');
    console.log('Result (Invalid Token):', apiResult);
    if (apiResult.isMock && apiResult.imageUrl === location.fallbackUrl) {
      console.log('SUCCESS: Invalid token handled gracefully and returned fallback image!');
    } else {
      console.error('FAIL: Graceful fallback failed.');
    }
  } else {
    const apiResult = await fetchStreetImage(location, mlyToken);
    console.log('Result (Active Token):', apiResult);
    if (apiResult.isMock) {
      console.log('NOTE: Active token fetch failed and fell back gracefully (or no image in radius). Check logs above.');
    } else {
      console.log('SUCCESS: Successfully fetched dynamic 2D street view photo ID from Mapillary! URL is:', apiResult.imageUrl);
    }
  }
}

testMapillary().catch(err => {
  console.error('Test run failed:', err);
});
