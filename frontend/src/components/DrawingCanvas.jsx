import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const DEFAULT_STROKES = [];

export const DrawingCanvas = forwardRef(({
  brushColor = '#6366f1',
  brushSize = 5,
  isDrawingMode = false,
  onStrokeAdded = () => {},
  initialStrokes = DEFAULT_STROKES
}, ref) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState(initialStrokes); // Array of { points: [{x, y}], color, size }
  
  // Sync strokes state if initialStrokes updates (only in read-only mode to prevent draw-time resets)
  useEffect(() => {
    if (!isDrawingMode && initialStrokes) {
      setStrokes(initialStrokes);
    }
  }, [initialStrokes, isDrawingMode]);
  const currentStrokeRef = useRef(null); // Active drawing stroke

  // Allow the parent component to trigger clear and undo operations
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      setStrokes([]);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
    undo: () => {
      setStrokes(prev => {
        const next = prev.slice(0, -1);
        return next;
      });
    },
    getStrokesCount: () => strokes.length,
    getStrokes: () => strokes,
    getCanvasElement: () => canvasRef.current
  }));

  // Redraw all strokes whenever history updates (static and extremely safe!)
  useEffect(() => {
    redrawCanvas(strokes);
  }, [strokes]);

  // Redraw all strokes onto the canvas
  const redrawCanvas = (strokesList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokesList.forEach(stroke => {
      if (stroke.points.length < 1) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  // Get coordinates relative to canvas, scaled to the fixed 800x600 internal space
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Retrieve client mouse or touch values
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    // Mathematically scale coordinates from the visible bounding box to the internal 800x600 size
    return {
      x: (relativeX / rect.width) * 800,
      y: (relativeY / rect.height) * 600,
      time: Date.now()
    };
  };

  // Drawing Event Handlers
  const startDrawing = (e) => {
    if (!isDrawingMode) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    
    const newStroke = {
      points: [coords],
      color: brushColor,
      size: brushSize
    };
    
    currentStrokeRef.current = newStroke;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing || !currentStrokeRef.current || !isDrawingMode) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    // Add point to stroke
    currentStrokeRef.current.points.push(coords);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const finishedStroke = currentStrokeRef.current;
      setStrokes(prev => {
        const next = [...prev, finishedStroke];
        // Don't call onStrokeAdded here because it triggers a parent state update during render!
        return next;
      });
      // Call it outside the setState callback, using the functional state length + 1
      onStrokeAdded(strokes.length + 1);
    }

    currentStrokeRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: isDrawingMode ? 'crosshair' : 'default',
        touchAction: 'none',
        zIndex: 5,
      }}
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
