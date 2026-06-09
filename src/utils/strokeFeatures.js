/**
 * Extract geometric and dynamic features from canvas strokes.
 * 
 * @param {Array} strokes Array of stroke objects: [{ points: [{x, y, time}], color, size }]
 * @param {number} startTime Timestamp (Date.now()) when the player started drawing the current round
 * @returns {Object} Extracted features for SVR regressor
 */
export function extractStrokeFeatures(strokes, startTime) {
  const strokeCount = strokes.length;
  if (strokeCount === 0) {
    return {
      stroke_count: 0,
      total_points: 0,
      bbox_area_ratio: 0.0,
      drawing_speed: 0.0
    };
  }

  let totalPoints = 0;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let totalDistance = 0;

  strokes.forEach(stroke => {
    const points = stroke.points || [];
    totalPoints += points.length;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      
      // Update bounding box coordinates
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;

      // Compute incremental Euclidean distance
      if (i > 0) {
        const prev = points[i - 1];
        const dist = Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
        totalDistance += dist;
      }
    }
  });

  if (totalPoints === 0) {
    return {
      stroke_count: strokeCount,
      total_points: 0,
      bbox_area_ratio: 0.0,
      drawing_speed: 0.0
    };
  }

  // Bounding box area ratio (canvas dimensions are 800x600)
  const width = maxX - minX;
  const height = maxY - minY;
  const bboxArea = width * height;
  const canvasArea = 800 * 600;
  const bboxAreaRatio = bboxArea / canvasArea;

  // Drawing speed (pixels per second)
  const totalTime = (Date.now() - startTime) / 1000; // seconds
  const drawingSpeed = totalDistance / (totalTime || 1);

  return {
    stroke_count: strokeCount,
    total_points: totalPoints,
    bbox_area_ratio: Math.min(1.0, Math.max(0.0, bboxAreaRatio)),
    drawing_speed: drawingSpeed
  };
}
