import { useEffect, useRef } from 'react';

export const useTypewriterEffect = (
  gamePhase, 
  evaluation, 
  setDisplayedTwist,
  setDisplayedEvaluation, 
  setDisplayedSatisfaction, 
  setDisplayedScore, 
  targetScore,
  setGamePhase
) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (gamePhase === 'result' && evaluation) {
      setDisplayedTwist('');
      setDisplayedEvaluation('');
      setDisplayedSatisfaction('');
      setDisplayedScore(0);

      const fullTwist = evaluation.twist || '';
      const fullEvaluation = evaluation.evaluation || '';
      const fullSatisfied = evaluation.satisfiedText || '';
      
      let phase = 'twist';
      let charIndex = 0;

      const animateText = () => {
        if (phase === 'twist') {
          if (charIndex < fullTwist.length) {
            const char = fullTwist[charIndex];
            setDisplayedTwist(prev => prev + char);
            charIndex++;
            timerRef.current = setTimeout(animateText, 20);
          } else {
            phase = 'eval';
            charIndex = 0;
            timerRef.current = setTimeout(animateText, 150);
          }
        } else if (phase === 'eval') {
          if (charIndex < fullEvaluation.length) {
            const char = fullEvaluation[charIndex];
            setDisplayedEvaluation(prev => prev + char);
            charIndex++;
            timerRef.current = setTimeout(animateText, 20);
          } else {
            phase = 'satisfied';
            charIndex = 0;
            timerRef.current = setTimeout(animateText, 150);
          }
        } else if (phase === 'satisfied') {
          if (charIndex < fullSatisfied.length) {
            const char = fullSatisfied[charIndex];
            setDisplayedSatisfaction(prev => prev + char);
            charIndex++;
            timerRef.current = setTimeout(animateText, 20);
          } else {
            phase = 'score';
            let currentScore = 0;
            setDisplayedScore(0);
            const scoreStep = () => {
              if (currentScore < targetScore) {
                currentScore = Math.min(targetScore, currentScore + Math.ceil(targetScore / 20));
                setDisplayedScore(currentScore);
                timerRef.current = setTimeout(scoreStep, 30);
              }
            };
            timerRef.current = setTimeout(scoreStep, 50);
          }
        }
      };

      timerRef.current = setTimeout(animateText, 100);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [gamePhase, evaluation, setDisplayedTwist, setDisplayedEvaluation, setDisplayedSatisfaction, setDisplayedScore, targetScore]);
};
