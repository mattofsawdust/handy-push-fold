'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Clock, Timer, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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

  const handData = {
    // Premium Hands (EV > 2.0)
    'AA': { ev: 4.37, explanation: "Premium pocket pair with the highest EV. Always push from any position." },
    'KK': { ev: 3.68, explanation: "Second best starting hand. Strong push from any position." },
    'QQ': { ev: 3.27, explanation: "Strong premium pair. Clear push from all positions." },
    'JJ': { ev: 2.93, explanation: "Strong pair with good equity against most ranges." },
    'TT': { ev: 2.59, explanation: "Strong pocket pair, profitable push in most situations." },
    'AKs': { ev: 2.70, explanation: "Premium suited hand with strong EV and flush potential." },
    'AKo': { ev: 2.55, explanation: "Premium offsuit hand with strong pushing value." },
    'AQs': { ev: 2.39, explanation: "Very strong suited hand, clear push in most spots." },
    'AQo': { ev: 2.22, explanation: "Strong offsuit ace, clear push in most spots." },
    '99': { ev: 2.22, explanation: "Medium pair with positive EV, generally a push." },

    // Marginal Hands (0.2 < EV < 2.0)
    '88': { ev: 1.95, explanation: "Medium pair, push in most positions." },
    'AJs': { ev: 2.14, explanation: "Strong suited ace with good pushing value." },
    'ATs': { ev: 1.89, explanation: "Strong suited ace, profitable push in most positions." },
    'KQs': { ev: 1.23, explanation: "Strong suited broadway, profitable pushing hand." },
    'QJs': { ev: 0.68, explanation: "Suited broadway, marginally profitable push." },
    'JTs': { ev: 0.53, explanation: "Connected suited cards, marginally profitable push." },
    'T9s': { ev: 0.40, explanation: "Medium suited connector, very marginal push." },
    'KJo': { ev: 0.72, explanation: "Offsuit broadway, marginal but pushable." },
    '77': { ev: 1.71, explanation: "Small pair, profitable in many situations." },
    '66': { ev: 1.50, explanation: "Small pair, consider position but generally pushing." },

    // Borderline Hands (EV close to 0.2)
    'K9s': { ev: 0.48, explanation: "Suited king, very marginal pushing hand." },
    'Q9s': { ev: 0.33, explanation: "Suited queen, barely above pushing threshold." },
    'J9s': { ev: 0.35, explanation: "Suited jack, very marginal decision." },
    'QTo': { ev: 0.24, explanation: "Offsuit broadway, barely above threshold." },
    'JTo': { ev: 0.21, explanation: "Offsuit connected cards, extremely marginal." },

    // Clear Folds (EV < 0.2)
    'K8o': { ev: -0.04, explanation: "Offsuit king, typically a fold." },
    'Q8o': { ev: -0.15, explanation: "Offsuit queen, clear fold." },
    'J8o': { ev: -0.12, explanation: "Offsuit jack, generally fold." },
    'T7o': { ev: -0.21, explanation: "Offsuit connector, always fold." },
    'Q4s': { ev: -0.05, explanation: "Small suited queen, fold in most positions." },
    'J6s': { ev: -0.04, explanation: "Small suited jack, fold in most spots." },
    'T6s': { ev: -0.01, explanation: "Small suited ten, generally fold." },
    'K7o': { ev: -0.08, explanation: "Weak king, clear fold." },
    '85s': { ev: -0.03, explanation: "Small suited connector, generally fold." },
    '74o': { ev: -0.50, explanation: "Small offsuit cards, never push." },
    '63s': { ev: -0.23, explanation: "Small suited connector, clear fold." },
    '32o': { ev: -0.84, explanation: "Weakest possible hand, always fold." }
  };

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
  }, [totalAttempts]);

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
                className={`${!isRunning ? 'animate-pulse' : ''} bg-green-500 hover:bg-green-600`}
              >
                {!isRunning ? 'Start Timer & Push' : 'Push'}
              </Button>
              <Button 
                onClick={() => checkDecision(false)}
                disabled={showAnswer}
                className={`${!isRunning ? 'animate-pulse' : ''} bg-red-500 hover:bg-red-600`}
              >
                {!isRunning ? 'Start Timer & Fold' : 'Fold'}
              </Button>
            </div>

            {feedback && (
              <div className="mb-4">
                <p className="text-lg font-bold mb-2">{feedback}</p>
                {showAnswer && (
                  <div className="text-left bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">
                      EV: {handData[currentHand].ev.toFixed(2)}
                      {handData[currentHand].ev > 0.20 ? 
                        ' (Should Push)' : 
                        ' (Should Fold)'}
                    </p>
                    <p className="text-gray-700">{handData[currentHand].explanation}</p>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={generateHand}
              className={`mt-4 ${!isRunning && totalAttempts > 0 ? 'animate-pulse' : ''}`}
            >
              {!isRunning && totalAttempts > 0 ? 'Resume Timer & Next Hand' : 'Next Hand'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Recent Hands</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Hand</th>
                <th className="text-left p-2">Decision</th>
                <th className="text-left p-2">EV</th>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {handHistory.slice().reverse().map((hand, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{hand.hand}</td>
                  <td className="p-2">{hand.decision}</td>
                  <td className="p-2">{hand.ev.toFixed(2)}</td>
                  <td className="p-2">{formatTime(hand.time)}</td>
                  <td className="p-2">
                    <span className={hand.correct ? "text-green-500" : "text-red-500"}>
                      {hand.correct ? "✓" : "✗"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PushFoldTrainer;