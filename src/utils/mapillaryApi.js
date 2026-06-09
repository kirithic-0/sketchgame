// 50 Dense Urban Global Cities with Center Coordinates for 100% Random Street View Queries
export const CITIES = [
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, country: 'Japan' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, country: 'France' },
  { name: 'New York', lat: 40.7128, lng: -74.0060, country: 'USA' },
  { name: 'London', lat: 51.5074, lng: -0.1278, country: 'UK' },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, country: 'Italy' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, country: 'USA' },
  { name: 'Venice', lat: 45.4408, lng: 12.3155, country: 'Italy' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, country: 'Australia' },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, country: 'Brazil' },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, country: 'Germany' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, country: 'South Korea' },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738, country: 'Austria' },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, country: 'Spain' },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734, country: 'Spain' },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, country: 'Sweden' },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, country: 'Denmark' },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  { name: 'Prague', lat: 50.0755, lng: 14.4378, country: 'Czech Republic' },
  { name: 'Budapest', lat: 47.4979, lng: 19.0402, country: 'Hungary' },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, country: 'Turkey' },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, country: 'South Africa' },
  { name: 'Melbourne', lat: -37.8136, lng: 144.9631, country: 'Australia' },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, country: 'Canada' },
  { name: 'Vancouver', lat: 49.2827, lng: -123.1207, country: 'Canada' },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, country: 'Argentina' },
  { name: 'Santiago', lat: -33.4489, lng: -70.6693, country: 'Chile' },
  { name: 'Bogota', lat: 4.7110, lng: -74.0721, country: 'Colombia' },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, country: 'Peru' },
  { name: 'Oslo', lat: 59.9139, lng: 10.7522, country: 'Norway' },
  { name: 'Helsinki', lat: 60.1699, lng: 24.9384, country: 'Finland' },
  { name: 'Athens', lat: 37.9838, lng: 23.7275, country: 'Greece' },
  { name: 'Lisbon', lat: 38.7223, lng: -9.1393, country: 'Portugal' },
  { name: 'Brussels', lat: 50.8503, lng: 4.3517, country: 'Belgium' },
  { name: 'Geneva', lat: 46.2044, lng: 6.1432, country: 'Switzerland' },
  { name: 'Zurich', lat: 47.3769, lng: 8.5417, country: 'Switzerland' },
  { name: 'Munich', lat: 48.1351, lng: 11.5820, country: 'Germany' },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681, country: 'Japan' },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, country: 'Japan' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, country: 'India' },
  { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  { name: 'Taipei', lat: 25.0330, lng: 121.5654, country: 'Taiwan' },
  { name: 'Honolulu', lat: 21.3069, lng: -157.8583, country: 'USA' },
  { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, country: 'Iceland' },
  { name: 'Auckland', lat: -36.8485, lng: 174.7633, country: 'New Zealand' },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, country: 'Egypt' },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, country: 'Malaysia' }
];

// Curated 10 Falling Back spots used for Mock Mode (when API Keys are missing)
export const MOCK_LOCATIONS = [
  {
    id: 'tokyo',
    name: 'Shibuya Crossing, Tokyo',
    country: 'Japan',
    lat: 35.6595,
    lng: 139.7004,
    fallbackUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'paris',
    name: 'Eiffel Tower View, Paris',
    country: 'France',
    lat: 48.8584,
    lng: 2.2945,
    fallbackUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'rome',
    name: 'Colosseum Street, Rome',
    country: 'Italy',
    lat: 41.8902,
    lng: 12.4922,
    fallbackUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'nyc',
    name: 'Times Square, New York City',
    country: 'USA',
    lat: 40.7580,
    lng: -73.9855,
    fallbackUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'venice',
    name: 'Grand Canal, Venice',
    country: 'Italy',
    lat: 45.4342,
    lng: 12.3385,
    fallbackUrl: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sf',
    name: 'Golden Gate View, San Francisco',
    country: 'USA',
    lat: 37.8080,
    lng: -122.4777,
    fallbackUrl: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'sydney',
    name: 'Sydney Opera House View',
    country: 'Australia',
    lat: -33.8568,
    lng: 151.2153,
    fallbackUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'london',
    name: 'Westminster Street, London',
    country: 'UK',
    lat: 51.5007,
    lng: -0.1246,
    fallbackUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'rio',
    name: 'Copacabana Beach Walk, Rio de Janeiro',
    country: 'Brazil',
    lat: -22.9691,
    lng: -43.1811,
    fallbackUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'amsterdam',
    name: 'Canal Ring, Amsterdam',
    country: 'Netherlands',
    lat: 52.3676,
    lng: 4.9041,
    fallbackUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
  }
];

/**
 * Returns a random location coordinate.
 * If live token is active, generates 100% random coordinate near a random city.
 * If running in Mock Mode, picks one of the curated fallback spots.
 */
export function getRandomLocation(hasToken = false) {
  // Check if live token is actually present in .env
  const envToken = import.meta.env?.VITE_MAPILLARY_ACCESS_TOKEN || '';
  const effectiveHasToken = hasToken || (envToken && envToken.trim() !== '');

  if (!effectiveHasToken) {
    const idx = Math.floor(Math.random() * MOCK_LOCATIONS.length);
    return MOCK_LOCATIONS[idx];
  }

  // 100% Random Coordinate generator near a random city
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  // Add a wider random offset: up to ±0.2 degrees (~20 km) in any direction
  // This makes sure it is truly 100% random and not just the same city center locations!
  const latOffset = (Math.random() - 0.5) * 0.4;
  const lngOffset = (Math.random() - 0.5) * 0.4;

  return {
    id: 'random_' + city.name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 9),
    name: `Random Spot near ${city.name}`,
    country: city.country,
    lat: Number((city.lat + latOffset).toFixed(5)),
    lng: Number((city.lng + lngOffset).toFixed(5))
  };
}

/**
 * Fetches a 2D perspective image URL for a given location.
 * Implements an 8-attempt spatial search loop for 100% random coordinates,
 * exponentially widening search coordinates on failure to hunt for the nearest road coverage.
 */
export async function fetchStreetImage(location, accessToken) {
  if (!accessToken || accessToken.trim() === '') {
    console.log(`[MapillaryAPI] Access token missing. Using fallback URL for ${location.name}.`);
    return {
      imageUrl: location.fallbackUrl || MOCK_LOCATIONS[0].fallbackUrl,
      imageId: 'fallback_' + location.id,
      isMock: true
    };
  }

  let token = accessToken.trim();
  let searchLat = location.lat;
  let searchLng = location.lng;
  let lastError = null;

  // Attempt coordinates search up to 8 times, shifting search coordinates further on failure to hunt for the nearest street coverage!
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = `https://graph.mapillary.com/images?lat=${searchLat}&lng=${searchLng}&radius=50&limit=5&access_token=${token}&fields=id,thumb_1024_url,thumb_2048_url,captured_at`;
    
    console.log(`[MapillaryAPI] Attempt ${attempt + 1}: Querying coordinates Lat: ${searchLat}, Lng: ${searchLng}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorBody.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const validImage = data.data.find(img => img.thumb_1024_url || img.thumb_2048_url);
        if (validImage) {
          console.log(`[MapillaryAPI] Success! Found street image ID ${validImage.id} on attempt ${attempt + 1}`);
          return {
            imageUrl: validImage.thumb_1024_url || validImage.thumb_2048_url,
            imageId: validImage.id,
            isMock: false,
            capturedAt: validImage.captured_at
          };
        }
      }
      
      throw new Error('No street imagery found in 50m radius of coordinates.');
    } catch (error) {
      console.warn(`[MapillaryAPI] Attempt ${attempt + 1} failed: ${error.message}`);
      lastError = error;
      
      // Gradually expand search radius/displacement to hunt for the nearest road!
      // Attempt 1: ~150 meters
      // Attempt 2: ~400 meters
      // Attempt 3: ~900 meters
      // Attempt 4: ~1.8 kilometers
      // Attempt 5: ~3 kilometers
      // Attempt 6+: ~5 kilometers
      const factor = Math.pow(attempt + 1, 1.8) * 0.0015;
      const angle = Math.random() * Math.PI * 2;
      const shiftLat = Math.sin(angle) * factor;
      const shiftLng = Math.cos(angle) * factor;
      
      searchLat = Number((location.lat + shiftLat).toFixed(5));
      searchLng = Number((location.lng + shiftLng).toFixed(5));
    }
  }

  // If all attempts fail, throw the final error
  console.error(`[MapillaryAPI] Coordinate searches exhausted. Total coverage failure for ${location.name}.`);
  throw new Error(lastError ? lastError.message : 'Total street view imagery coverage search failure.');
}
