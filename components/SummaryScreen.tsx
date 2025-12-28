import React from 'react';
import { SessionStats } from '../types';
import { LayoutDashboard, ArrowRight, Zap, Target } from 'lucide-react';

interface SummaryScreenProps {
  stats: SessionStats;
  onRestart: () => void;
  onContinue: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ stats, onRestart, onContinue }) => {
  const accuracy = Math.round((stats.correctCount / stats.totalQuestions) * 100) || 0;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in zoom-in-95 duration-500 py-6">
      
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-textMain tracking-tight">Session Complete!</h2>
        <p className="text-textSec font-medium">Excellent work keeping up your streak.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Accuracy Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center shadow-lg shadow-slate-200/50 flex flex-col items-center">
          <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3">
             <Target className="w-6 h-6 text-success" />
          </div>
          <div className="text-4xl font-extrabold text-textMain mb-1">{accuracy}%</div>
          <div className="text-xs text-textSec uppercase font-bold tracking-wider">Accuracy</div>
        </div>

        {/* Graduated Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 text-center shadow-lg shadow-slate-200/50 flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-primary" />
            </div>
            <div className="text-4xl font-extrabold text-textMain mb-1">{stats.graduatedCount}</div>
            <div className="text-xs text-textSec uppercase font-bold tracking-wider">Mastered</div>
        </div>
      </div>

      {/* Reminder Message */}
      <div className="bg-slate-100 px-6 py-3 rounded-full text-xs font-semibold text-textSec flex items-center">
          <span>Remember to return to dashboard to save data</span>
      </div>

      <div className="flex flex-col w-full space-y-3 pt-4">
        <button
            onClick={onContinue}
            className="w-full h-16 bg-primary hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center transition-transform active:scale-95"
        >
            Next Session
            <ArrowRight className="w-5 h-5 ml-2 stroke-[3]" />
        </button>

        <button
            onClick={onRestart}
            className="w-full h-16 bg-white border border-slate-200 hover:bg-slate-50 text-textMain rounded-2xl font-bold text-lg flex items-center justify-center transition-colors"
        >
            <LayoutDashboard className="w-5 h-5 mr-2" />
            Dashboard
        </button>
      </div>

    </div>
  );
};