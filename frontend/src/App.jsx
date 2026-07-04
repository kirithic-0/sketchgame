import React, { useEffect, useRef, useState, useMemo } from 'react';

import { mergeLayers } from './utils/imageExporter';
import { extractStrokeFeatures } from './utils/strokeFeatures';
import confetti from 'canvas-confetti';
import { LandingScreen } from './components/LandingScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { MatchSummary } from './components/MatchSummary';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { GalleryScreen } from './components/GalleryScreen';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

import { useTypewriterEffect } from './hooks/useTypewriterEffect';

function App() {
  const canvasRef = useRef(null);

  // App States
  const [activeScreen, setActiveScreen] = useState('landing'); // landing, game, summary
  const [leaderboard, setLeaderboard] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [objective, setObjective] = useState('');
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
  const [sessionToken, setSessionToken] = useState('');
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [currentRoundTime, setCurrentRoundTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [personaResult, setPersonaResult] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);

  const [currentStrokes, setCurrentStrokes] = useState([]);

  // Evaluation states
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationResponse, setEvaluationResponse] = useState(null);

  // Username and Multi-round states
  const [username, setUsernameState] = useState(() => localStorage.getItem('geosketch_username') || '');
  const [currentRound, setCurrentRound] = useState(1);
  const [roundResults, setRoundResults] = useState([]);
  
  const totalScore = useMemo(() => roundResults.reduce((sum, r) => sum + r.score, 0), [roundResults]);

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
    const activeSessionToken = localStorage.getItem('geosketch_current_session_token');
    if (activeSessionToken) {
      console.log("[App] Username changed. Invalidating active session.");
      localStorage.removeItem('geosketch_current_session_token');
      setSessionToken('');
    }
  };


  // Animated/Typewriter states for rendering results smoothly
  const [displayedTwist, setDisplayedTwist] = useState('');
  const [displayedEvaluation, setDisplayedEvaluation] = useState('');
  const [displayedSatisfaction, setDisplayedSatisfaction] = useState('');
  const [displayedScore, setDisplayedScore] = useState('?');

  useTypewriterEffect(
    gamePhase,
    evaluation,
    setDisplayedTwist,
    setDisplayedEvaluation,
    setDisplayedSatisfaction,
    setDisplayedScore,
    evaluation?.score || 0,
    setGamePhase
  );

  // Apply location helper
  const applyLocationData = (curLoc) => {
    setLocation(curLoc.location);
    setStreetImage(curLoc);
    setObjective(curLoc.objective || 'Draw something creative!');
    setDifficulty(curLoc.difficulty || 'Medium');
  };

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
      const activeSessionToken = localStorage.getItem('geosketch_current_session_token');
      if (activeSessionToken) {
        console.log(`[App] Found active session in localStorage: ${activeSessionToken}. Querying backend status...`);
        try {
          // If no username is set yet, default to local storage
          const currentUsername = username || localStorage.getItem('geosketch_username') || 'Anonymous';
          const response = await fetch(`${API_BASE_URL}/session/status?session_token=${activeSessionToken}&player_name=${currentUsername}`);
          
          if (!response.ok) {
            throw new Error('Session status invalid or completed.');
          }
          const data = await response.json();
          
          // Important: Update token!
          if (data.session_token) {
            setSessionToken(data.session_token);
            localStorage.setItem('geosketch_current_session_token', data.session_token);
          }

          // Restore all state
          setUsernameState(data.player_name);
          setCurrentRound(data.current_round);
          setRoundResults(data.round_results);

          const curLoc = data.current_location;
          applyLocationData(curLoc);

          setGamePhase('draw');
          setStrokesCount(0);
          setRoundStartTime(Date.now());
          setActiveScreen('game');

          console.log(`[App] SUCCESS - Restored session on round ${data.current_round}`);
        } catch (err) {
          console.warn(`[App] Failed to restore active session: ${err.message}. Clearing session ID.`);
          localStorage.removeItem('geosketch_current_session_token');
        }
      }
    };

    restoreSession();
  }, []);


  // Fetch/Sync current session location details from backend
  const loadLocation = async (sessToken = sessionToken) => {
    setImgLoading(true);
    setGameError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/session/status?session_token=${sessToken}`);
      if (!response.ok) throw new Error('Failed to fetch session status');
      const data = await response.json();

      const curLoc = data.current_location;
      applyLocationData(curLoc);
      setRoundStartTime(Date.now());
    } catch (err) {
      setGameError(`Session Sync Error: ${err.message}. Make sure the game server is running!`);
      setStreetImage(null);
    } finally {
      setImgLoading(false);
    }
  };

  // Initialize a new round/session
  const startNewGame = async () => {
    setGameStarting(true);
    setLocation(null);
    setStreetImage(null);
    setGamePhase('draw');
    setEvaluation(null);
    setEvaluationResponse(null);

    setCurrentRound(1);
    setRoundResults([]);
    setStrokesCount(0);
    setCurrentStrokes([]);
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

      setSessionToken(data.session_token);
      localStorage.setItem('geosketch_current_session_token', data.session_token);

      const curLoc = data.current_location;
      applyLocationData(curLoc);
      setRoundStartTime(Date.now());
      setActiveScreen('game');
    } catch (err) {
      setGameError(`Failed to start session: ${err.message}. Make sure the game server is running!`);
    } finally {
      setImgLoading(false);
      setGameStarting(false);
    }
  };

  // Retry loading current location (skip button is removed, so this is purely for retrying errors)
  const changeLocation = async () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
    setCurrentStrokes([]);
    setGamePhase('draw');
    setEvaluation(null);
    await loadLocation(sessionToken);
  };

  // Submit sketch to AI
  const handleSubmitDrawing = async () => {
    if (strokesCount === 0) return;

    setGamePhase('scanning');
    setGameError(null);

    try {
      const canvasElement = canvasRef.current.getCanvasElement();
      const rawStrokes = canvasRef.current?.getStrokes() || [];
      setCurrentStrokes(rawStrokes);
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
          session_token: sessionToken,
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

      if (data.session_token) {
        setSessionToken(data.session_token);
        localStorage.setItem('geosketch_current_session_token', data.session_token);
      }

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
      setGameError(`Backend Error: ${err.message}. Make sure the game server is running!`);
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
      setCurrentStrokes([]);

      const nextLocData = evaluationResponse.next_location;
      applyLocationData(nextLocData);
      setRoundStartTime(Date.now());
    } else {
      // Completed! Score is already auto-saved in backend.
      localStorage.removeItem('geosketch_current_session_token');

      // Persona is now passed directly from the 5th round session token evaluation
      setPersonaResult({
        persona_name: evaluationResponse.persona_name || 'Neutral',
        gm_review: evaluationResponse.gm_review || 'Match completed.'
      });

      // Save to local history
      const newRun = {
        date: new Date().toISOString(),
        username: username,
        totalScore: updatedResults.reduce((sum, r) => sum + r.score, 0),
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
            gameStarting={gameStarting}
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
            initialStrokes={currentStrokes}
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

        {/* SCREEN 5: GALLERY SCREEN */}
        {activeScreen === 'gallery' && (
          <GalleryScreen />
        )}

      </main>

    </div>
  );
}

export default App;
