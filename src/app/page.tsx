'use client';

import PokerTrainer from '@/components/poker/PokerTrainer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Push/Fold Trainer</h1>
        <PokerTrainer />
      </div>
    </div>
  );
}