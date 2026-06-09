import React, { useEffect, useRef, useState } from 'react';

import { mergeLayers } from './utils/imageExporter';
import { extractStrokeFeatures } from './utils/strokeFeatures';
import confetti from 'canvas-confetti';
import { LandingScreen } from './components/LandingScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { MatchSummary } from './components/MatchSummary';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';

const API_BASE_URL = 'http://localhost:8000/api';


// Color Palette presets for drawing
const BRUSH_COLORS = [
  { name: 'Slate Green', hex: '#3B5C48' },
  { name: 'Warm Terracotta', hex: '#C27866' },
  { name: 'Mustard Gold', hex: '#D29E3C' },
  { name: 'Charcoal Green', hex: '#203326' },
  { name: 'Sage Green', hex: '#4C8A69' },
  { name: 'Warm Peach', hex: '#D8A28C' },
  { name: 'Crimson Rust', hex: '#AF4E4E' }
];

function App() {
  const canvasRef = useRef(null);
  
  // App States
  const [activeScreen, setActiveScreen] = useState('landing'); // landing, game, summary
  const [leaderboard, setLeaderboard] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [objective, setObjective] = useState('');
  const [vqaQuestion, setVqaQuestion] = useState('');
  const [targetState, setTargetState] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('Japan');
  const [difficulty, setDifficulty] = useState('Medium');

  // Gameplay states - streamlined: starting directly in drawing mode!
  const [gamePhase, setGamePhase] = useState('draw'); // draw, scanning, result
  const [location, setLocation] = useState(null);
  const [streetImage, setStreetImage] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [strokesCount, setStrokesCount] = useState(0);
  const [gameError, setGameError] = useState(null); // Capture and display API errors!

  // ML Caching and session states
  const [sessionId, setSessionId] = useState('');
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [currentRoundTime, setCurrentRoundTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [personaResult, setPersonaResult] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Drawing Brush configurations
  const [brushColor, setBrushColor] = useState('#3B5C48');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  // Evaluation states
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationResponse, setEvaluationResponse] = useState(null);


  // Username and Multi-round states
  const [username, setUsernameState] = useState(() => localStorage.getItem('geosketch_username') || '');
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState([]);
  const [previousRuns, setPreviousRuns] = useState(() => {
    try {
      const saved = localStorage.getItem('geosketch_runs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const setUsername = (name) => {
    setUsernameState(name);
    localStorage.setItem('geosketch_username', name);
    
    // Invalidate active session if username changes
    const activeSessionId = localStorage.getItem('geosketch_current_session_id');
    if (activeSessionId) {
      console.log("[App] Username changed. Invalidating active session.");
      localStorage.removeItem('geosketch_current_session_id');
      setSessionId('');
    }
  };

  // Animated/Typewriter states for rendering results smoothly
  const [displayedTwist, setDisplayedTwist] = useState('');
  const [displayedEvaluation, setDisplayedEvaluation] = useState('');
  const [displayedSatisfaction, setDisplayedSatisfaction] = useState('');
  const [displayedScore, setDisplayedScore] = useState(0);

  // Fetch Leaderboard from Backend
  const fetchLeaderboard = async () => {
    setDbLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data || []);
    } catch (e) {
      console.error('Failed to load leaderboard:', e.message);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Restore active session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const activeSessionId = localStorage.getItem('geosketch_current_session_id');
      if (activeSessionId) {
        console.log(`[App] Found active session in localStorage: ${activeSessionId}. Querying backend status...`);
        try {
          // If no username is set yet, default to local storage
          const currentUsername = username || localStorage.getItem('geosketch_username') || 'Anonymous';
          const response = await fetch(`${API_BASE_URL}/session/status?session_id=${activeSessionId}&player_name=${currentUsername}`);
          if (!response.ok) {
            throw new Error('Session status invalid or completed.');
          }
          const data = await response.json();
          
          // Restore all state
          setSessionId(data.session_id);
          setUsernameState(data.player_name);
          setCurrentRound(data.current_round);
          setRoundResults(data.round_results);
          
          const curLoc = data.current_location;
          setLocation(curLoc.location);
          setStreetImage(curLoc);
          setObjective(curLoc.objective || 'Draw something creative!');
          setVqaQuestion(curLoc.vqa_question || 'Is the drawing creative?');
          setTargetState(curLoc.target_state || 'the drawing is creative');
          setDifficulty(curLoc.difficulty || 'Medium');
          
          setGamePhase('draw');
          setStrokesCount(0);
          setRoundStartTime(Date.now());
          setActiveScreen('game');
          
          console.log(`[App] SUCCESS - Restored session ${activeSessionId} on round ${data.current_round}`);
        } catch (err) {
          console.warn(`[App] Failed to restore active session: ${err.message}. Clearing session ID.`);
          localStorage.removeItem('geosketch_current_session_id');
        }
      }
    };
    
    restoreSession();
  }, []);

  // Trigger progressive typewriter & scoring counter animation upon complete evaluation
  useEffect(() => {
    if (gamePhase === 'result' && evaluation) {
      const fullTwist = evaluation.twist || '';
      const fullEval = evaluation.evaluation || '';
      const fullSatisfied = evaluation.satisfiedText || '';
      const targetScore = evaluation.score || 0;

      setDisplayedTwist('');
      setDisplayedEvaluation('');
      setDisplayedSatisfaction('');
      setDisplayedScore(0);

      let timer;
      let phase = 'twist'; // 'twist', 'eval', 'satisfied', 'score'
      let charIndex = 0;
      
      const animateText = () => {
        if (phase === 'twist') {
          if (charIndex < fullTwist.length) {
            const char = fullTwist[charIndex];
            setDisplayedTwist(prev => prev + char);
            charIndex++;
            timer = setTimeout(animateText, 20);
          } else {
            phase = 'eval';
            charIndex = 0;
            timer = setTimeout(animateText, 150);
          }
        } else if (phase === 'eval') {
          if (charIndex < fullEval.length) {
            const char = fullEval[charIndex];
            setDisplayedEvaluation(prev => prev + char);
            charIndex++;
            timer = setTimeout(animateText, 20);
          } else {
            phase = 'satisfied';
            charIndex = 0;
            timer = setTimeout(animateText, 150);
          }
        } else if (phase === 'satisfied') {
          if (charIndex < fullSatisfied.length) {
            const char = fullSatisfied[charIndex];
            setDisplayedSatisfaction(prev => prev + char);
            charIndex++;
            timer = setTimeout(animateText, 20);
          } else {
            phase = 'score';
            let currentScore = 0;
            const scoreStep = () => {
              if (currentScore < targetScore) {
                currentScore = Math.min(targetScore, currentScore + Math.ceil(targetScore / 20));
                setDisplayedScore(currentScore);
                timer = setTimeout(scoreStep, 30);
              }
            };
            timer = setTimeout(scoreStep, 50);
          }
        }
      };

      timer = setTimeout(animateText, 100);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [gamePhase, evaluation]);

  // Fetch/Sync current session location details from backend
  const loadLocation = async (sessId = sessionId) => {
    setImgLoading(true);
    setGameError(null);
    try {
      const currentUsername = username || localStorage.getItem('geosketch_username') || 'Anonymous';
      const response = await fetch(`${API_BASE_URL}/session/status?session_id=${sessId}&player_name=${currentUsername}`);
      if (!response.ok) throw new Error('Failed to fetch session status');
      const data = await response.json();
      
      const curLoc = data.current_location;
      setLocation(curLoc.location);
      setStreetImage(curLoc);
      setObjective(curLoc.objective || 'Draw something creative!');
      setVqaQuestion(curLoc.vqa_question || 'Is the drawing creative?');
      setTargetState(curLoc.target_state || 'the drawing is creative');
      setDifficulty(curLoc.difficulty || 'Medium');
      setRoundStartTime(Date.now());
    } catch (err) {
      setGameError(`Session Sync Error: ${err.message}. Make sure FastAPI is running!`);
      setStreetImage(null);
    } finally {
      setImgLoading(false);
    }
  };

  // Initialize a new round/session
  const startNewGame = async () => {
    setLocation(null);
    setStreetImage(null);
    setGamePhase('draw');
    setEvaluation(null);
    setEvaluationResponse(null);

    setCurrentRound(1);
    setRoundResults([]);
    setStrokesCount(0);
    setRetryCount(0);
    setPersonaResult(null);
    setImgLoading(true);
    setGameError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: username.trim() || 'Anonymous',
          selected_country: selectedCountry
        })
      });
      if (!response.ok) throw new Error('Failed to start session');
      const data = await response.json();
      
      setSessionId(data.session_id);
      localStorage.setItem('geosketch_current_session_id', data.session_id);
      
      const curLoc = data.current_location;
      setLocation(curLoc.location);
      setStreetImage(curLoc);
      setObjective(curLoc.objective || 'Draw something creative!');
      setVqaQuestion(curLoc.vqa_question || 'Is the drawing creative?');
      setTargetState(curLoc.target_state || 'the drawing is creative');
      setDifficulty(curLoc.difficulty || 'Medium');
      setRoundStartTime(Date.now());
      setActiveScreen('game');
    } catch (err) {
      setGameError(`Failed to start session: ${err.message}. Make sure FastAPI is running!`);
    } finally {
      setImgLoading(false);
    }
  };

  // Retry loading current location (skip button is removed, so this is purely for retrying errors)
  const changeLocation = async () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
    setGamePhase('draw');
    setEvaluation(null);
    setScoreSubmitted(false);
    await loadLocation(sessionId);
  };

  // Submit sketch to AI
  const handleSubmitDrawing = async () => {
    if (strokesCount === 0) return;
    
    setGamePhase('scanning');
    setGameError(null);
    
    try {
      const canvasElement = canvasRef.current.getCanvasElement();
      const rawStrokes = canvasRef.current?.getStrokes() || [];
      if (!canvasElement || !streetImage) return;

      // 1. Merge image layer and transparent drawing overlay
      const mergedBase64 = await mergeLayers(streetImage.imageUrl, canvasElement);

      // Calculate elapsed drawing time
      const elapsed = (Date.now() - roundStartTime) / 1000;
      setCurrentRoundTime(elapsed);

      // Extract geometric and speed features for effort regressor (Model 3)
      const strokeFeatures = extractStrokeFeatures(rawStrokes, roundStartTime);

      // 2. Evaluate with backend session endpoint
      const response = await fetch(`${API_BASE_URL}/session/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          imageBase64: mergedBase64,
          locationId: location.id,
          drawing_time: elapsed,
          retry_count: retryCount,
          stroke_count: strokeFeatures.stroke_count,
          total_points: strokeFeatures.total_points,
          bbox_area_ratio: strokeFeatures.bbox_area_ratio,
          drawing_speed: strokeFeatures.drawing_speed
        })
      });
      if (!response.ok) throw new Error('Evaluation request failed');
      const data = await response.json();
      
      setEvaluationResponse(data);
      setEvaluation(data.evaluation);
      setGamePhase('result');

      if (data.evaluation.score >= 80) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error submitting drawing:', err);
      setGameError(`Backend Error: ${err.message}. Make sure FastAPI is running!`);
      setGamePhase('draw'); // Return to drawing phase so they don't lose their sketch!
    }
  };

  // Move to the next round or complete the match
  const handleNextRound = async () => {
    if (!evaluation || !evaluationResponse) return;

    // Save the round result locally
    const newResult = {
      round: currentRound,
      locationName: location.name,
      objective: objective,
      difficulty: difficulty,
      objectDrawn: evaluation.objectDrawn,
      targetObject: evaluation.targetObject,
      score: evaluation.score,
      twist: evaluation.twist,
      evaluation: evaluation.evaluation,
      satisfiedText: evaluation.satisfiedText,
      strokes: strokesCount,
      time: currentRoundTime,
      effortScore: evaluation.effort_score || 5.0
    };
    
    const updatedResults = [...roundResults, newResult];
    setRoundResults(updatedResults);

    if (!evaluationResponse.is_completed) {
      const nextRoundNum = evaluationResponse.current_round;
      setCurrentRound(nextRoundNum);
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
      setGamePhase('draw');
      setEvaluation(null);
      setEvaluationResponse(null);
      setStrokesCount(0);
      
      // Load next pre-generated location and target stats
      const nextLocData = evaluationResponse.next_location;
      setLocation(nextLocData.location);
      setStreetImage(nextLocData);
      setObjective(nextLocData.objective || 'Draw something creative!');
      setVqaQuestion(nextLocData.vqa_question || 'Is the drawing creative?');
      setTargetState(nextLocData.target_state || 'the drawing is creative');
      setDifficulty(nextLocData.difficulty || 'Medium');
      setRoundStartTime(Date.now());
    } else {
      // Completed! Score is already auto-saved in backend.
      localStorage.removeItem('geosketch_current_session_id');
      
      // Calculate averages for Playstyle Persona Clustering (Model 2)
      const total = updatedResults.reduce((sum, r) => sum + r.score, 0);
      const avgTime = updatedResults.reduce((sum, r) => sum + r.time, 0) / 5;
      const avgStrokes = updatedResults.reduce((sum, r) => sum + r.strokes, 0) / 5;
      const avgScore = total / 5;

      // Fetch persona summary from backend
      setSummaryLoading(true);
      fetch(`${API_BASE_URL}/game-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avg_draw_time: avgTime,
          avg_stroke_count: avgStrokes,
          retry_count: retryCount,
          average_score: avgScore
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch game summary');
        return res.json();
      })
      .then(data => {
        setPersonaResult(data);
      })
      .catch(err => {
        console.error("Failed to load playstyle persona:", err);
      })
      .finally(() => {
        setSummaryLoading(false);
      });

      // Save to local history
      const newRun = {
        date: new Date().toISOString(),
        username: username,
        totalScore: total,
        rounds: updatedResults
      };
      setPreviousRuns(prev => {
        const updated = [newRun, ...prev];
        localStorage.setItem('geosketch_runs', JSON.stringify(updated));
        return updated;
      });
      
      setEvaluation(null);
      setEvaluationResponse(null);

      setActiveScreen('summary');
    }
  };




  return (
    <div className="app-container">
      {/* Decorative Grid Pattern Background */}
      <div className="grid-bg"></div>

      {/* HEADER BAR */}
      <Header activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      {/* ERROR NOTICE DISPLAY BANNER */}
      <ErrorBanner gameError={gameError} setGameError={setGameError} />

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        
        {/* SCREEN 1: LANDING SCREEN */}
        {activeScreen === 'landing' && (
          <LandingScreen
            username={username}
            setUsername={setUsername}
            previousRuns={previousRuns}
            onStartGame={startNewGame}
            leaderboard={leaderboard}
            dbLoading={dbLoading}
            onRefreshLeaderboard={fetchLeaderboard}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
          />
        )}

        {/* SCREEN 2: ACTIVE GAME SCREEN */}
        {activeScreen === 'game' && location && gamePhase !== 'result' && (
          <GameScreen
            location={location}
            streetImage={streetImage}
            imgLoading={imgLoading}
            gamePhase={gamePhase}
            strokesCount={strokesCount}
            setStrokesCount={setStrokesCount}
            canvasRef={canvasRef}
            objective={objective}
            difficulty={difficulty}
            onChangeLocation={changeLocation}
            onSubmitDrawing={handleSubmitDrawing}
            currentRound={currentRound}
            onClearCanvas={() => setRetryCount(prev => prev + 1)}
          />
        )}

        {/* SCREEN 3: RESULTS SCREEN */}
        {activeScreen === 'game' && location && gamePhase === 'result' && evaluation && (
          <ResultScreen
            location={location}
            streetImage={streetImage}
            imgLoading={imgLoading}
            canvasRef={canvasRef}
            evaluation={evaluation}
            objective={objective}
            difficulty={difficulty}
            displayedTwist={displayedTwist}
            displayedEvaluation={displayedEvaluation}
            displayedSatisfaction={displayedSatisfaction}
            displayedScore={displayedScore}
            onNextRound={handleNextRound}
            onBackToLeaderboard={() => setActiveScreen('landing')}
            strokesCount={strokesCount}
            currentRound={currentRound}
          />
        )}

        {/* SCREEN 4: MATCH SUMMARY SCREEN */}
        {activeScreen === 'summary' && (
          <MatchSummary
            roundResults={roundResults}
            totalScore={roundResults.reduce((sum, r) => sum + r.score, 0)}
            username={username}
            onBackToStart={() => setActiveScreen('landing')}
            personaResult={personaResult}
            summaryLoading={summaryLoading}
          />
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="footer-bar">
        <span className="footer-copy">© 2026 GeoSketch. Built with React & Supabase.</span>
        <div className="footer-credits">
          <span>Vision AI: Gemini 2.5 Flash</span>
          <span>•</span>
          <span>Imagery: Mapillary 2D API</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
