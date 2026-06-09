import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are the chaotic, sarcastic, and extremely creative Game Master of "GeoSketch" — a game where players draw objects on real-world street scenes.
Your task is to analyze the combined image of the street scene and the player's drawing.

Identify:
1. What the user has drawn (object_drawn). Be creative, if it looks simple, interpret it in the funniest way possible!
2. What the drawing has landed on or is interacting with in the background street scene (target_object).

Generate:
- A hilarious, creative, and witty "consequence" of this action. Think comic book, cartoonish, or chaotic physical reaction!
- A score from 0 to 100 representing their overall creativity.
- Specific ratings from 0 to 100 for these 5 stats:
  1. "destruction": Rating of physical damage or chaos caused in the scene (0-100).
  2. "violence": Rating of confrontation, combativeness, or aggressive clash in the consequence (0-100).
  3. "funny": Rating of how hilarious, comedic, or absurd the situation is (0-100).
  4. "smart": Rating of the irony, cleverness, or intellectual wit of the drawing placement (0-100).
  5. "wholesome": Rating of positive, heartwarming, or cute vibes generated (0-100).

You MUST return a JSON object with the following fields:
{
  "objectDrawn": "A concise name for what they drew",
  "targetObject": "What object/part of the street view they drew on top of or next to",
  "consequence": "The funny and witty consequence (2-3 sentences max). Maintain a sarcastic, clever tone.",
  "score": 85,
  "stats": {
    "destruction": 75,
    "violence": 20,
    "funny": 90,
    "smart": 80,
    "wholesome": 30
  }
}

Response MimeType must be set to application/json. Return only the JSON structure.
`;

// Mocks updated to include realistic 5-dimensional stats
const MOCK_CONSEQUENCES = {
  tokyo: [
    {
      objectDrawn: 'Giant Anvil',
      targetObject: 'Shibuya Pedestrian Crossing',
      consequence: 'The giant anvil landed right in the center of Shibuya Crossing, completely flattening a salaryman\'s pride and creating a 2D crosswalk. Locals are now using it as an avant-garde bench.',
      score: 88,
      stats: { destruction: 85, violence: 20, funny: 90, smart: 75, wholesome: 15 }
    },
    {
      objectDrawn: 'Neon Godzilla',
      targetObject: 'Skyscraper Billboard',
      consequence: 'Godzilla emerged from the billboard, but instead of destroying Tokyo, it became obsessed with Shibuya\'s neon advertisements. It is currently negotiating a contract to star in a matcha green tea commercial.',
      score: 92,
      stats: { destruction: 10, violence: 15, funny: 95, smart: 85, wholesome: 80 }
    },
    {
      objectDrawn: 'Hover Cab',
      targetObject: 'Pedestrian Street',
      consequence: 'The retrofitted hover-cab floated 5 inches off the ground, immediately getting caught in a crowd of 3,000 pedestrians. The driver is still billing the passenger by the second.',
      score: 79,
      stats: { destruction: 5, violence: 5, funny: 85, smart: 70, wholesome: 35 }
    }
  ],
  paris: [
    {
      objectDrawn: 'Giant Baguette',
      targetObject: 'Eiffel Tower',
      consequence: 'A massive sourdough baguette was placed next to the Eiffel Tower. A flock of 10,000 pigeons immediately declared a new bird empire. The French President has offered them croissants in exchange for peace.',
      score: 94,
      stats: { destruction: 20, violence: 40, funny: 95, smart: 88, wholesome: 70 }
    },
    {
      objectDrawn: 'Red Beret',
      targetObject: 'Eiffel Tower Tip',
      consequence: 'The Eiffel Tower is now wearing a very stylish, colossal red beret. Parisian fashion critics are calling it "bold, yet structural" and are demanding the Louvre exhibit it.',
      score: 87,
      stats: { destruction: 0, violence: 0, funny: 90, smart: 92, wholesome: 75 }
    }
  ],
  rome: [
    {
      objectDrawn: 'Colossal Pizza Slice',
      targetObject: 'Colosseum Entrance',
      consequence: 'A floating pizza slice successfully plugged the Colosseum arches. Tourists are now attempting to climb it using breadsticks. Italian authorities have declared it a delicious historical monument.',
      score: 95,
      stats: { destruction: 5, violence: 5, funny: 96, smart: 90, wholesome: 85 }
    },
    {
      objectDrawn: 'Vespa Gladiator',
      targetObject: 'Ancient Rome Road',
      consequence: 'A gladiator in full gold armor was drawn riding a pink Vespa. He was immediately pulled over by Roman police for not wearing a helmet. His excuse was "I have a laurel wreath".',
      score: 91,
      stats: { destruction: 15, violence: 35, funny: 93, smart: 88, wholesome: 50 }
    }
  ],
  nyc: [
    {
      objectDrawn: 'Flying Yellow Cab',
      targetObject: 'Billboard Sky',
      consequence: 'The yellow cab flew into the sky, but got stuck in Times Square traffic. Yes, air-traffic is somehow even worse than street traffic. The meter is currently at $14,200.',
      score: 83,
      stats: { destruction: 5, violence: 10, funny: 92, smart: 80, wholesome: 25 }
    },
    {
      objectDrawn: 'Giant Banana Peel',
      targetObject: 'Times Square Intersection',
      consequence: 'A neon banana peel was laid across the avenue. A tourist bus slid on it, did a triple kickflip over a hot dog cart, and landed perfectly in a parking spot. The driver was awarded 10 points by local pigeons.',
      score: 89,
      stats: { destruction: 40, violence: 25, funny: 95, smart: 78, wholesome: 40 }
    }
  ],
  venice: [
    {
      objectDrawn: 'Giant Yellow Rubber Duck',
      targetObject: 'Grand Canal',
      consequence: 'A giant rubber duck took over the Grand Canal. Gondoliers are furious because the duck keeps squeaking in operatic tones, completely throwing off their pitch. Tourists, however, are thrilled.',
      score: 96,
      stats: { destruction: 5, violence: 5, funny: 98, smart: 85, wholesome: 92 }
    }
  ],
  sf: [
    {
      objectDrawn: 'Bridge Kraken',
      targetObject: 'Golden Gate Bridge',
      consequence: 'A green sea kraken tickled the Golden Gate Bridge cables. Instead of breaking, the bridge started vibrating a catchy bassline. SF residents are now complaining about the noise on Reddit.',
      score: 90,
      stats: { destruction: 15, violence: 20, funny: 93, smart: 89, wholesome: 65 }
    }
  ],
  sydney: [
    {
      objectDrawn: 'Tuxedo Kangaroo',
      targetObject: 'Sydney Harbor Bridge',
      consequence: 'A kangaroo in a tuxedo was drawn playing a saxophone. It was immediately booked to play at the Opera House, but canceled at the last minute because it couldn\'t find its pocket handkerchief.',
      score: 86,
      stats: { destruction: 0, violence: 0, funny: 94, smart: 87, wholesome: 80 }
    }
  ],
  london: [
    {
      objectDrawn: 'Double-Decker Submarine',
      targetObject: 'River Thames',
      consequence: 'The classic red bus plunged into the Thames, transforming into a submarine. The tour guide continued speaking without missing a beat: "To your left, you can see the local soggy trout."',
      score: 93,
      stats: { destruction: 25, violence: 10, funny: 95, smart: 90, wholesome: 60 }
    }
  ],
  rio: [
    {
      objectDrawn: 'DJ Parrot',
      targetObject: 'Copacabana Beach',
      consequence: 'A giant parrot with neon headphones took over the beach DJ booth. Its remix of "The Girl from Ipanema" using actual bird calls is currently topping the Brazilian charts.',
      score: 85,
      stats: { destruction: 0, violence: 5, funny: 92, smart: 80, wholesome: 85 }
    }
  ],
  amsterdam: [
    {
      objectDrawn: 'Flying Neon Bicycle',
      targetObject: 'Canal Bridge',
      consequence: 'A neon pink bicycle took off into the air, dodging canals and windmills. It was immediately fined by Amsterdam authorities for not having a working bell in the airspace.',
      score: 84,
      stats: { destruction: 5, violence: 10, funny: 89, smart: 84, wholesome: 70 }
    }
  ]
};

const DEFAULT_MOCKS = [
  {
    objectDrawn: 'Mysterious Portal',
    targetObject: 'The sidewalk',
    consequence: 'A glowing blue portal appeared. A curious squirrel stepped in and emerged in a gourmet nut store. The squirrel has refuse to leave and is now the store manager.',
    score: 87,
    stats: { destruction: 5, violence: 5, funny: 88, smart: 92, wholesome: 80 }
  },
  {
    objectDrawn: 'Giant Mustache',
    targetObject: 'A nearby building facade',
    consequence: 'The building is now wearing a very distinguished handlebar mustache. It immediately demanded rent increases and started speaking with a heavy Victorian accent.',
    score: 81,
    stats: { destruction: 0, violence: 15, funny: 90, smart: 85, wholesome: 40 }
  },
  {
    objectDrawn: 'UFO Abduction Beam',
    targetObject: 'A street lamppost',
    consequence: 'The UFO beam tried to abduct the lamppost, but it was bolted down too well. The UFO gave up and just left a very confused glowing light pattern that is now blinking in morse code.',
    score: 85,
    stats: { destruction: 20, violence: 10, funny: 89, smart: 82, wholesome: 50 }
  }
];

/**
 * Sends the combined (background + drawing) base64 image to Gemini 2.5 Flash Vision.
 * If the API key is missing or the call fails, it gracefully uses funny mock responses.
 */
export async function evaluateDrawing(imageBase64, apiKey, locationId) {
  if (!apiKey || apiKey.trim() === '') {
    console.log('[GeminiAPI] API Key missing. Running in Mock Mode.');
    return getMockResponse(locationId);
  }

  // Sanitize base64 (strip the Data URI prefix if present)
  let cleanBase64 = imageBase64;
  if (cleanBase64.includes(';base64,')) {
    cleanBase64 = cleanBase64.split(';base64,')[1];
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());

    // Explicitly configure JSON output
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: "image/png"
      }
    };

    console.log('[GeminiAPI] Sending combined image to Gemini...');
    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const responseText = result.response.text();

    console.log('[GeminiAPI] Raw Response received:', responseText);

    // Parse the JSON response
    const jsonResult = JSON.parse(responseText.trim());

    // Safe fallback stats in case Gemini skips fields
    const parsedStats = jsonResult.stats || {};
    const stats = {
      destruction: typeof parsedStats.destruction === 'number' ? parsedStats.destruction : 50,
      violence: typeof parsedStats.violence === 'number' ? parsedStats.violence : 20,
      funny: typeof parsedStats.funny === 'number' ? parsedStats.funny : 70,
      smart: typeof parsedStats.smart === 'number' ? parsedStats.smart : 60,
      wholesome: typeof parsedStats.wholesome === 'number' ? parsedStats.wholesome : 50
    };

    return {
      objectDrawn: jsonResult.objectDrawn || 'Custom Sketch',
      targetObject: jsonResult.targetObject || 'Street scene element',
      consequence: jsonResult.consequence || 'A very mysterious AI event occurred!',
      score: typeof jsonResult.score === 'number' ? jsonResult.score : 75,
      stats,
      isMock: false
    };
  } catch (error) {
    console.warn('[GeminiAPI] Call to Gemini Vision failed:', error.message);
    if (apiKey && apiKey.trim() !== '') {
      throw error;
    }
    console.log('[GeminiAPI] Falling back to a clever mock response.');
    return getMockResponse(locationId);
  }
}

/**
 * Returns a randomized mock evaluation based on the location.
 */
function getMockResponse(locationId) {
  const normalizedId = (locationId || 'tokyo').toLowerCase();
  const mockList = MOCK_CONSEQUENCES[normalizedId] || DEFAULT_MOCKS;
  const randomIndex = Math.floor(Math.random() * mockList.length);
  const selectedMock = mockList[randomIndex];

  return {
    ...selectedMock,
    isMock: true
  };
}
