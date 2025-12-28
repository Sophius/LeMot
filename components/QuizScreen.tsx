import React, { useState, useEffect } from 'react';
import { VocabWord } from '../types';
import { updateWordProgress, shuffle } from '../utils/logic';
import { getDistractors } from '../services/gemini';
import { Check, X, Loader2 } from 'lucide-react';

interface QuizScreenProps {
  sessionWords: VocabWord[];
  allWords: VocabWord[];
  onComplete: (updatedWords: VocabWord[]) => void;
  onWordUpdate: (word: VocabWord) => void;
  onProgressUpdate: (progress: { current: number, total: number }) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ 
    sessionWords, 
    allWords, 
    onComplete, 
    onWordUpdate,
    onProgressUpdate 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  
  // We use the prop sessionWords directly because App updates it via onWordUpdate
  const currentWord = sessionWords[currentIndex];

  useEffect(() => {
    // Sync progress to App Header
    onProgressUpdate({ current: currentIndex + 1, total: sessionWords.length });
  }, [currentIndex, sessionWords.length]);

  useEffect(() => {
    if (currentWord) {
        loadOptions(currentWord);
    }
  }, [currentIndex]);

  const loadOptions = async (target: VocabWord) => {
    setIsGeneratingOptions(true);
    setFeedback('IDLE');

    const correctText = target.answer_form || target.word;
    const potentialDistractors = allWords
      .filter(w => w.id !== target.id)
      .map(w => w.word);
      
    let distractors: string[] = [];

    if (potentialDistractors.length >= 3) {
      distractors = shuffle<string>(potentialDistractors).slice(0, 3);
    } else {
      distractors = await getDistractors(correctText, potentialDistractors);
    }

    const options = shuffle<string>([correctText, ...distractors]);
    setCurrentOptions(options);
    setIsGeneratingOptions(false);
  };

  const handleOptionClick = async (option: string) => {
    if (feedback !== 'IDLE') return;

    const correctText = currentWord.answer_form || currentWord.word;
    const isCorrect = option === correctText;
    
    // Update word and notify parent
    const updatedWord = updateWordProgress(currentWord, isCorrect);
    onWordUpdate(updatedWord);

    setFeedback(isCorrect ? 'CORRECT' : 'WRONG');
  };

  const handleNext = () => {
    if (currentIndex < sessionWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(sessionWords);
    }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (feedback !== 'IDLE' && e.key === 'Enter') {
              handleNext();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, currentIndex]);

  if (!currentWord) return <div className="flex h-full items-center justify-center text-primary"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="flex flex-col h-full w-full relative space-y-6 animate-slide-up">
      
      {/* Spacer to push content up, assuming parent padding handled. 
          Actually user wanted to lift it up. 
          The parent `App` has `pt-4` in header + `p-6` in main. 
          We remove the top spacing here.
      */}
      
      {/* Progress Line */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex-none mt-2">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${((currentIndex) / sessionWords.length) * 100}%` }} 
          />
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-lg border-t-4 border-primary flex flex-col min-h-[200px] relative overflow-hidden flex-none">
        <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
            {isGeneratingOptions ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
                <>
                    <h2 className="text-2xl font-serif text-dark leading-relaxed mb-4 font-medium select-none">
                        {feedback === 'IDLE' 
                            ? currentWord.cloze_sentence 
                            : currentWord.sentence.split(' ').map((w, i) => {
                                const target = currentWord.answer_form || currentWord.word;
                                const isTarget = w.toLowerCase().includes(target.toLowerCase());
                                return <span key={i} className={isTarget ? "font-bold text-primary" : ""}>{w} </span>
                            })
                        }
                    </h2>
                    {feedback === 'IDLE' && (
                        <p className="text-light text-sm italic select-none">{currentWord.meaning}</p>
                    )}
                </>
            )}
        </div>
      </div>

      {/* Feedback (Overlay) */}
      {feedback !== 'IDLE' && (
            <div className={`p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 flex items-center justify-between shadow-lg ${
                feedback === 'CORRECT' ? 'bg-white border-2 border-success/20 ring-4 ring-success/5' : 'bg-white border-2 border-red-100 ring-4 ring-red-50'
            }`}>
                <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-none ${feedback === 'CORRECT' ? 'bg-success text-white' : 'bg-red-500 text-white'}`}>
                        {feedback === 'CORRECT' ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
                    </div>
                    <div>
                        <div className="text-base font-bold text-dark">
                            {currentWord.word} <span className="text-light font-normal italic">({currentWord.part_of_speech})</span>
                        </div>
                        <div className="text-xs text-light">{currentWord.meaning}</div>
                    </div>
                </div>
                <button 
                    onClick={handleNext}
                    className={`px-8 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-transform active:scale-95 ${
                        feedback === 'CORRECT' ? 'bg-success hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                    Next
                </button>
            </div>
      )}

      {/* Options */}
      <div className="flex-1 flex flex-col justify-end pb-4 space-y-3">
          {currentOptions.map((option, idx) => {
            const correctText = currentWord.answer_form || currentWord.word;
            let btnClass = "w-full py-4 px-6 rounded-2xl text-left font-bold text-lg transition-all duration-150 border-2 touch-manipulation ";
            
            if (feedback === 'IDLE') {
                btnClass += "bg-white border-transparent text-dark shadow-sm active:scale-[0.98] active:bg-slate-50 border-b-4 border-slate-100 active:border-b-2 active:translate-y-0.5";
            } else if (option === correctText) {
                btnClass += "bg-success border-success text-white shadow-md transform scale-[1.02]"; 
            } else if (feedback === 'WRONG' && option !== correctText) {
                 btnClass += "bg-slate-50 border-transparent text-slate-300 opacity-50"; 
            } else {
                 btnClass += "bg-slate-50 border-transparent text-slate-300";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                disabled={feedback !== 'IDLE' || isGeneratingOptions}
                className={btnClass}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {option}
              </button>
            );
          })}
      </div>

    </div>
  );
};