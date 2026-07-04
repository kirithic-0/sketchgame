/**
 * Combines a 2D background image URL and an HTML5 canvas drawing layer into a single base64 PNG.
 * Handles CORS and scales the drawing canvas to match the background image size.
 */
export function mergeLayers(backgroundImageUrl, canvasElement) {
  return new Promise((resolve, reject) => {
    if (!canvasElement) {
      reject(new Error('Canvas element is missing.'));
      return;
    }

    const img = new Image();
    // Enable CORS to prevent "tainting" the canvas
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const offscreenCanvas = document.createElement('canvas');
        const ctx = offscreenCanvas.getContext('2d');

        // Set dimensions to match the high-resolution background image
        offscreenCanvas.width = img.naturalWidth || 1024;
        offscreenCanvas.height = img.naturalHeight || 768;

        // 1. Draw the background street view image
        ctx.drawImage(img, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

        // 2. Draw the transparent canvas sketch layer scaled to match the background
        ctx.drawImage(
          canvasElement, 
          0, 0, canvasElement.width, canvasElement.height, // Source dimensions
          0, 0, offscreenCanvas.width, offscreenCanvas.height // Destination dimensions (scaled to fit)
        );

        // 3. Export as base64 PNG data URL
        const dataUrl = offscreenCanvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        console.error('[ImageExporter] Canvas merging failed:', error);
        reject(error);
      }
    };

    img.onerror = (err) => {
      console.warn(`[ImageExporter] Failed to load background image for merging: ${backgroundImageUrl}. Attempting fallback with sketch only.`);
      
      // Fallback: If image fails to load (CORS/network), draw canvas overlay on a dark slate background
      try {
        const offscreenCanvas = document.createElement('canvas');
        const ctx = offscreenCanvas.getContext('2d');

        offscreenCanvas.width = canvasElement.width || 1024;
        offscreenCanvas.height = canvasElement.height || 768;

        // Draw solid background
        ctx.fillStyle = '#0f172a'; // slate-900 background
        ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        // Draw grid pattern (just to make the background look premium even on failure!)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < offscreenCanvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, offscreenCanvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < offscreenCanvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(offscreenCanvas.width, y);
          ctx.stroke();
        }

        // Draw user drawing on top
        ctx.drawImage(canvasElement, 0, 0);

        const dataUrl = offscreenCanvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (e) {
        reject(new Error(`Failed to perform fallback merge: ${e.message}`));
      }
    };

    // Trigger loading
    img.src = backgroundImageUrl;
  });
}
