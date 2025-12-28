import React, { useState, useMemo } from 'react';
import { VocabWord } from '../types';
import { selectWordsForSession } from '../utils/logic';
import { Search, Trophy, Zap, History, ArrowRight } from 'lucide-react';

interface ConfigScreenProps {
  allWords: VocabWord[];
  onStartQuiz: (selectedWords: VocabWord[]) => void;
  onOpenDetails: () => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ 
  allWords, 
  onStartQuiz, 
  onOpenDetails 
}) => {
  const [sessionCount, setSessionCount] = useState<number>(10);
  const [isCustom, setIsCustom] = useState(false);
  const [customInputValue, setCustomInputValue] = useState<string>('');

  // Calculate global stats
  const stats = useMemo(() => {
    const total = allWords.length;
    const graduated = allWords.filter(w => w.is_graduated).length;
    const started = allWords.filter(w => (w.total_attempts || 0) > 0).length;
    return { total, graduated, started };
  }, [allWords]);

  const handlePresetClick = (val: number) => {
      setSessionCount(val);
      setIsCustom(false);
      setCustomInputValue('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || (/^\d+$/.test(val) && Number(val) < 100)) {
          setCustomInputValue(val);
          setSessionCount(Number(val));
          setIsCustom(true);
      }
  };

  const handleStart = () => {
    const count = sessionCount > 0 ? sessionCount : 10;
    const session = selectWordsForSession(allWords, count);
    onStartQuiz(session);
  };

  return (
    <div className="flex flex-col h-full w-full py-2 space-y-8 animate-slide-up">
      
      {/* 1. Stats Row (Circles) */}
      <div className="grid grid-cols-4 gap-3">
          
          {/* Circle 1: Started (Ginger) */}
          <div className="flex flex-col items-center group touch-manipulation">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-accent/20 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all">
                  <Zap className="w-5 h-5 text-accent mb-0.5" />
                  <span className="text-sm font-bold text-dark">
                      {stats.started}
                  </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-light mt-1.5 tracking-wider">Started</span>
          </div>

          {/* Circle 2: Total (Blue) */}
          <div className="flex flex-col items-center group touch-manipulation">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-primary/20 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all">
                  <History className="w-5 h-5 text-primary mb-0.5" />
                  <span className="text-sm font-bold text-dark">{stats.total}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-light mt-1.5 tracking-wider">Total</span>
          </div>

          {/* Circle 3: Graduated (Green) */}
          <div className="flex flex-col items-center group touch-manipulation">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-success/20 flex flex-col items-center justify-center shadow-sm active:scale-95 transition-all">
                  <Trophy className="w-5 h-5 text-success mb-0.5" />
                  <span className="text-sm font-bold text-dark">{stats.graduated}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-light mt-1.5 tracking-wider">Done</span>
          </div>

          {/* Circle 4: See All (Grey) */}
          <div className="flex flex-col items-center group touch-manipulation">
              <button 
                onClick={onOpenDetails}
                className="w-16 h-16 rounded-2xl bg-dark text-white flex flex-col items-center justify-center shadow-md active:scale-90 transition-all"
              >
                  <Search className="w-6 h-6" />
              </button>
              <span className="text-[10px] uppercase font-bold text-light mt-1.5 tracking-wider">Search</span>
          </div>
      </div>

      <div className="h-px bg-slate-200/60 w-full"></div>

      {/* 2. Number Selection */}
      <div className="space-y-5">
          <label className="text-xl font-bold text-dark block text-center">
             Session Goal
          </label>
          
          <div className="flex justify-center gap-3">
              {[5, 10, 20, 30].map(num => (
                  <button
                    key={num}
                    onClick={() => handlePresetClick(num)}
                    className={`w-14 h-14 rounded-2xl font-bold text-lg transition-all shadow-sm flex items-center justify-center font-mono touch-manipulation ${
                        !isCustom && sessionCount === num 
                        ? 'bg-primary text-white shadow-primary/30 shadow-lg scale-110 ring-2 ring-primary ring-offset-2' 
                        : 'bg-white border-2 border-slate-100 text-light active:scale-90 active:bg-slate-50'
                    }`}
                  >
                      {num}
                  </button>
              ))}
              
              {/* Custom Input */}
              <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl transition-all shadow-sm flex flex-col items-center justify-center overflow-hidden touch-manipulation ${
                        isCustom 
                        ? 'bg-accent text-white shadow-accent/30 shadow-lg scale-110 ring-2 ring-accent ring-offset-2' 
                        : 'bg-white border-2 border-slate-100'
                    }`}>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        placeholder="..."
                        value={customInputValue}
                        onChange={handleCustomChange}
                        className={`w-full text-center bg-transparent outline-none font-mono font-bold text-lg ${isCustom ? 'text-white placeholder-white/50' : 'text-dark placeholder-light'}`}
                      />
                      <span className={`text-[8px] uppercase font-bold leading-none ${isCustom ? 'text-white/80' : 'text-light'}`}>Custom</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex-1"></div>

      {/* 3. Big Start Button */}
      <div className="pb-safe">
        <button 
            onClick={handleStart}
            disabled={stats.total === 0 || sessionCount === 0}
            className="w-full h-20 bg-primary hover:bg-[#3d6082] rounded-3xl shadow-xl shadow-primary/20 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] active:shadow-sm disabled:opacity-50 disabled:pointer-events-none group touch-manipulation"
        >
            <span className="text-2xl font-bold text-white tracking-wide">Start Quiz</span>
            <ArrowRight className="w-7 h-7 text-white stroke-[3] group-active:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
};