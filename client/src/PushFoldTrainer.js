import React, { useState, useCallback, useEffect } from 'react';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Trophy, Target, Clock, Timer, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './components/ui/alert-dialog';

const PushFoldTrainer = () => {
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [currentHand, setCurrentHand] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [handHistory, setHandHistory] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [handStartTime, setHandStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);
  const [fastestTime, setFastestTime] = useState(null);

  const [handData, setHandData] = useState({});

  useEffect(() => {
    fetch('/api/hands')
      .then(response => response.json())
      .then(data => setHandData(data));
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((prevTime) => prevTime + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (time) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const generateHand = useCallback(() => {
    const hands = Object.keys(handData);
    const randomHand = hands[Math.floor(Math.random() * hands.length)];
    setCurrentHand(randomHand);
    setShowAnswer(false);
    setFeedback('');
    if (totalAttempts > 0) {
      setIsRunning(true);
      setHandStartTime(Date.now());
    }
  }, [totalAttempts, handData]);

  const startTimer = () => {
    if (!isRunning && totalAttempts === 0) {
      setHandStartTime(Date.now());
      setIsRunning(true);
    }
  };

  const checkDecision = (isPush) => {
    if (!currentHand) return;
    
    if (!isRunning && totalAttempts === 0) {
      startTimer();
      return;
    }

    setIsRunning(false);
    const decisionTime = Date.now() - handStartTime;
    
    const ev = handData[currentHand].ev;
    const correctDecision = ev > 0.20;
    const isCorrect = isPush === correctDecision;
    
    if (isCorrect) {
      setScore(score + 1);
      setStreak(streak + 1);
      setBestStreak(Math.max(bestStreak, streak + 1));
      setFeedback('Correct! ✅');
      
      if (fastestTime === null || decisionTime < fastestTime) {
        setFastestTime(decisionTime);
      }
    } else {
      setFeedback('Incorrect ❌');
      setStreak(0);
    }
    
    setTotalTime(prev => prev + decisionTime);
    setTotalAttempts(totalAttempts + 1);
    setShowAnswer(true);

    setHandHistory(prev => [...prev, {
      hand: currentHand,
      decision: isPush ? 'Push' : 'Fold',
      correct: isCorrect,
      ev: ev,
      time: decisionTime
    }].slice(-10));
  };

  const accuracy = totalAttempts > 0 ? ((score / totalAttempts) * 100).toFixed(1) : 0;
  const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;
  
  useEffect(() => {
    if (!currentHand) {
      generateHand();
    }
  }, [currentHand, generateHand]);

  const resetStats = () => {
    setScore(0);
    setTotalAttempts(0);
    setStreak(0);
    setBestStreak(0);
    setHandHistory([]);
    setTimer(0);
    setTotalTime(0);
    setFastestTime(null);
    setCurrentHand(null);
    setShowAnswer(false);
    setFeedback('');
    setIsRunning(false);
    generateHand();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-end mb-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset Stats
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All Statistics</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your current stats, including scores, times, and history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetStats} className="bg-red-500 hover:bg-red-600">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-2xl mx-auto">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <p className="text-sm font-semibold text-gray-600">Correct</p>
            </div>
            <p className="text-xl font-bold text-green-600">{score}</p>
            <p className="text-xs text-gray-500">answers</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-5 h-5 text-red-500" />
              <p className="text-sm font-semibold text-gray-600">Incorrect</p>
            </div>
            <p className="text-xl font-bold text-red-600">{totalAttempts - score}</p>
            <p className="text-xs text-gray-500">answers</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-blue-500" />
              <p className="text-sm font-semibold text-gray-600">Accuracy</p>
            </div>
            <p className="text-xl font-bold">{accuracy}%</p>
            <p className="text-xs text-gray-500">{score}/{totalAttempts}</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-semibold text-gray-600">Current Streak</p>
            </div>
            <p className="text-xl font-bold">{streak}</p>
            <p className="text-xs text-gray-500">in a row</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-green-500" />
              <p className="text-sm font-semibold text-gray-600">Avg Time</p>
            </div>
            <p className="text-xl font-bold">{formatTime(averageTime)}</p>
            <p className="text-xs text-gray-500">per hand</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Timer className="w-5 h-5 text-orange-500" />
              <p className="text-sm font-semibold text-gray-600">Best Time</p>
            </div>
            <p className="text-xl font-bold">{fastestTime ? formatTime(fastestTime) : '--:--'}</p>
            <p className="text-xs text-gray-500">correct decision</p>
          </div>
        </div>

        {currentHand && (
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-4">{currentHand}</div>
            <div className="text-2xl font-mono mb-4">{formatTime(timer)}</div>
            <p className="mb-4">Should you push or fold with this hand?</p>
            
            <div className="flex justify-center gap-4 mb-4">
              <Button 
                onClick={() => checkDecision(true)}
                disabled={showAnswer}
                className={\`\${!isRunning ? 'animate-pulse' : ''} bg-green-500 hover:bg-green-600\`}
              >
                {!isRunning ? 'Start Timer & Push' : 'Push'}
              </Button>
              <Button 
                onClick={() => checkDecision