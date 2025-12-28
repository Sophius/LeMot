import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ConfigScreen } from './components/ConfigScreen';
import { DetailsScreen } from './components/DetailsScreen';
import { QuizScreen } from './components/QuizScreen';
import { SummaryScreen } from './components/SummaryScreen';
import { VocabWord, AppState, SessionStats } from './types';
import { Save, ArrowLeft, Database } from 'lucide-react';
import { getTodayDate } from './utils/logic';

// Redesigned "Interlocking S" Logo
const LeMotLogo = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Hexagon Border */}
    <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5 Z" stroke="#4A729A" strokeWidth="6" strokeLinejoin="round" fill="white"/>
    
    {/* Interlocking Shapes */}
    {/* Blue Top-Left to Center */}
    <path d="M35 35 C 35 35, 30 50, 50 50 C 70 50, 70 35, 70 35" stroke="#4A729A" strokeWidth="10" strokeLinecap="round" />
    <path d="M35 35 L 35 55" stroke="#4A729A" strokeWidth="10" strokeLinecap="round" />
    
    {/* Ginger Bottom-Right to Center */}
    <path d="M65 65 C 65 65, 70 50, 50 50 C 30 50, 30 65, 30 65" stroke="#D16B58" strokeWidth="10" strokeLinecap="round" />
    <path d="M65 65 L 65 45" stroke="#D16B58" strokeWidth="10" strokeLinecap="round" />
  </svg>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('WELCOME');
  const [allWords, setAllWords] = useState<VocabWord[]>([]);
  const [sessionWords, setSessionWords] = useState<VocabWord[]>([]);
  const [lastStats, setLastStats] = useState<SessionStats | null>(null);
  
  // Header State for Quiz
  const [quizProgress, setQuizProgress] = useState<{current: number, total: number} | null>(null);

  const handleDataLoaded = (words: VocabWord[]) => {
    setAllWords(words);
    setAppState('CONFIG');
  };

  const handleConfigComplete = (selectedWords: VocabWord[]) => {
    setSessionWords(selectedWords);
    setAppState('QUIZ');
  };

  // Sync session word updates immediately to global state to support "Back" exit
  const handleSessionWordUpdate = (updatedWord: VocabWord) => {
      // Update in Session
      const newSession = sessionWords.map(w => w.id === updatedWord.id ? updatedWord : w);
      setSessionWords(newSession);
      
      // Update in Global
      setAllWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));
  };

  const handleGlobalWordUpdate = (updatedWord: VocabWord) => {
    setAllWords(prev => prev.map(w => w.id === updatedWord.id ? updatedWord : w));
  };

  const handleQuizComplete = (finalSessionWords: VocabWord[]) => {
    // Stats calculation
    const correctCount = finalSessionWords.filter(w => {
        // Simple heuristic: if streak increased, they got it right at least once effectively? 
        // Actually QuizScreen manages correctness. 
        // For simplicity, we trust the final state's total_correct or similar if we tracked it per session.
        // Let's just use the finalSessionWords provided by QuizScreen on completion
        return w.total_correct > (sessionWords.find(sw => sw.id === w.id)?.total_correct || 0);
    }).length;

    const graduatedCount = finalSessionWords.filter(w => w.streak >= 5).length;
    
    setLastStats({
      totalQuestions: sessionWords.length,
      correctCount: correctCount, 
      graduatedCount,
      updatedWords: finalSessionWords // already synced but passed for clarity
    });
    setQuizProgress(null);
    setAppState('SUMMARY');
  };

  const handleBackToDashboard = () => {
    if (appState === 'QUIZ') {
        // Just exit, state is already synced via handleSessionWordUpdate
        setQuizProgress(null);
    }
    setAppState('CONFIG');
    setSessionWords([]);
    setLastStats(null);
  };

  const handleContinue = () => {
    handleBackToDashboard();
  };

  const handleGoToImport = () => {
      setAppState('WELCOME');
  };

  const handleOpenDetails = () => {
      setAppState('DETAILS');
  }

  const handleSaveProgress = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allWords, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `french_vocab_progress_${getTodayDate()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Reset Logic
  const getCleanWordState = (word: VocabWord): VocabWord => ({
      ...word,
      streak: 0,
      total_attempts: 0,
      total_correct: 0,
      is_graduated: false,
      weight: 0.5,
      last_seen: null
  });

  const handleResetAll = () => {
      const resetWords = allWords.map(getCleanWordState);
      setAllWords(resetWords);
  };

  const handleResetWord = (id: string) => {
      const updated = allWords.map(w => w.id === id ? getCleanWordState(w) : w);
      setAllWords(updated);
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-bgLight overscroll-none">
      
      {/* Fixed Header */}
      <header className="flex-none h-24 px-6 flex items-center justify-center relative bg-bgLight z-50 pt-4 shadow-sm border-b border-white/50">
        
        {/* Left Action: Back Button */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 pt-4 z-20 flex items-center">
            {(appState === 'DETAILS' || appState === 'SUMMARY' || appState === 'QUIZ') && (
                <button 
                    onClick={handleBackToDashboard}
                    className="p-3 bg-white border-2 border-slate-100 text-light hover:text-primary hover:border-primary rounded-2xl transition-all active:scale-95 shadow-sm flex items-center justify-center"
                >
                    <ArrowLeft className="w-6 h-6" />
                    {appState === 'QUIZ' && <span className="ml-2 font-bold text-dark hidden">Back</span>}
                </button>
            )}
            
            {appState === 'WELCOME' && allWords.length > 0 && (
                <button 
                    onClick={handleBackToDashboard}
                    className="p-3 bg-white border-2 border-slate-100 text-light hover:text-primary hover:border-primary rounded-2xl transition-all active:scale-95 shadow-sm"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            )}

            {appState === 'CONFIG' && (
                 <button 
                    onClick={handleGoToImport} 
                    className="p-3 bg-white border-2 border-slate-100 text-light hover:text-primary hover:border-primary rounded-2xl transition-all active:scale-95 shadow-sm group" 
                    title="Upload / Manage Data"
                 >
                     <Database className="w-6 h-6 group-hover:scale-110 transition-transform" />
                 </button>
            )}
        </div>

        {/* Center Logo & Text (Row Layout) */}
        <div className="flex items-center space-x-3 pointer-events-none select-none pt-4">
             <LeMotLogo />
             <h1 className="text-3xl font-extrabold text-dark tracking-tight font-sans">le mot</h1>
        </div>

        {/* Right Action: Save or Counter */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pt-4 z-20">
             {appState === 'QUIZ' && quizProgress ? (
                 <div className="flex items-center justify-center space-x-1 p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                    <span className="text-lg font-bold text-dark font-mono">{quizProgress.current}</span>
                    <span className="text-light text-sm font-bold">/</span>
                    <span className="text-light text-sm font-bold">{quizProgress.total}</span>
                 </div>
             ) : (
                 appState !== 'WELCOME' && (
                     <button 
                        onClick={handleSaveProgress} 
                        className={`p-3 bg-white border-2 border-slate-100 rounded-2xl transition-all active:scale-95 shadow-sm ${
                            appState === 'DETAILS' ? 'text-accent border-accent/20 hover:bg-accent hover:text-white' : 'text-light hover:text-primary hover:border-primary'
                        }`}
                        title="Save Progress"
                     >
                         <Save className="w-6 h-6" />
                     </button>
                 )
             )}
        </div>
      </header>
      
      {/* Scrollable Main Content */}
      <main className="flex-1 w-full relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden p-6 pb-20">
            {appState === 'WELCOME' && (
              <WelcomeScreen 
                onDataLoaded={handleDataLoaded} 
                onCancel={allWords.length > 0 ? handleBackToDashboard : undefined}
              />
            )}
            {appState === 'CONFIG' && (
              <ConfigScreen 
                allWords={allWords} 
                onStartQuiz={handleConfigComplete}
                onOpenDetails={handleOpenDetails}
              />
            )}
            {appState === 'DETAILS' && (
               <DetailsScreen
                  allWords={allWords}
                  onBack={handleBackToDashboard}
                  onStartCustomQuiz={handleConfigComplete}
                  onResetAll={handleResetAll}
                  onResetWord={handleResetWord}
                  onUpdateWord={handleGlobalWordUpdate}
               />
            )}
            {appState === 'QUIZ' && (
              <QuizScreen 
                sessionWords={sessionWords}
                allWords={allWords} 
                onComplete={handleQuizComplete}
                onWordUpdate={handleSessionWordUpdate}
                onProgressUpdate={setQuizProgress}
              />
            )}
            {appState === 'SUMMARY' && lastStats && (
              <SummaryScreen 
                stats={lastStats}
                onRestart={handleBackToDashboard} 
                onContinue={handleContinue} 
              />
            )}
        </div>
      </main>
      
    </div>
  );
};

export default App;