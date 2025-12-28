import React, { useState, useMemo } from 'react';
import { VocabWord } from '../types';
import { Search, Trash2, RotateCcw, AlertTriangle, CheckSquare, Square, Play, Pencil, X, Save } from 'lucide-react';

interface DetailsScreenProps {
  allWords: VocabWord[];
  onBack: () => void;
  onStartCustomQuiz: (selectedWords: VocabWord[]) => void;
  onResetAll: () => void;
  onResetWord: (id: string) => void;
  onUpdateWord: (word: VocabWord) => void;
}

// 5-Bar Battery Component
const ProficiencyBattery = ({ streak }: { streak: number }) => {
    return (
        <div className="flex items-end space-x-[2px]" title={`Streak: ${streak}`}>
            {[1, 2, 3, 4, 5].map((level) => (
                <div 
                    key={level}
                    className={`w-1.5 rounded-sm transition-all ${
                        streak >= level 
                        ? level > 3 ? 'bg-success h-3' : level > 1 ? 'bg-primary h-3' : 'bg-accent h-3' 
                        : 'bg-slate-200 h-3'
                    }`}
                />
            ))}
        </div>
    );
};

export const DetailsScreen: React.FC<DetailsScreenProps> = ({ 
  allWords, 
  onBack,
  onStartCustomQuiz,
  onResetAll, 
  onResetWord,
  onUpdateWord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'ALL' | 'SINGLE' | 'EDIT' | null;
    targetId?: string;
    message?: string;
    editWord?: VocabWord;
  }>({ isOpen: false, type: null });

  const filteredWords = useMemo(() => {
    let result = [...allWords];
    result.sort((a, b) => b.streak - a.streak); 

    if (searchTerm.trim()) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(w => 
            w.word.toLowerCase().includes(lowerTerm) || 
            w.meaning.toLowerCase().includes(lowerTerm)
        );
    }
    return result; 
  }, [allWords, searchTerm]);

  const areAllFilteredSelected = filteredWords.length > 0 && filteredWords.every(w => selectedIds.has(w.id));

  const toggleSelectAll = () => {
    if (areAllFilteredSelected) {
        const newSet = new Set(selectedIds);
        filteredWords.forEach(w => newSet.delete(w.id));
        setSelectedIds(newSet);
    } else {
        const newSet = new Set(selectedIds);
        filteredWords.forEach(w => newSet.add(w.id));
        setSelectedIds(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleStartCustomTraining = () => {
      const selectedWords = allWords.filter(w => selectedIds.has(w.id));
      if (selectedWords.length > 0) {
          onStartCustomQuiz(selectedWords);
      }
  };

  const requestResetAll = () => {
    setModalConfig({
        isOpen: true,
        type: 'ALL',
        message: 'Are you sure you want to reset ALL words? This will clear all streaks, attempts, and learning history.'
    });
  };

  const requestResetWord = (id: string) => {
    setModalConfig({
        isOpen: true,
        type: 'SINGLE',
        targetId: id,
        message: 'Are you sure you want to reset this word? Its progress will be lost.'
    });
  };

  const requestEditWord = (word: VocabWord) => {
      setModalConfig({
          isOpen: true,
          type: 'EDIT',
          editWord: { ...word } // Clone for editing
      });
  };

  const handleConfirmReset = () => {
    if (modalConfig.type === 'ALL') {
        onResetAll();
    } else if (modalConfig.type === 'SINGLE' && modalConfig.targetId) {
        onResetWord(modalConfig.targetId);
    }
    setModalConfig({ isOpen: false, type: null });
  };

  const handleSaveEdit = () => {
      if (modalConfig.editWord) {
          onUpdateWord(modalConfig.editWord);
          setModalConfig({ isOpen: false, type: null });
      }
  };

  const updateEditField = (field: keyof VocabWord, value: string) => {
      if (modalConfig.editWord) {
          setModalConfig({
              ...modalConfig,
              editWord: { ...modalConfig.editWord, [field]: value }
          });
      }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 relative space-y-4 pt-2">
      
      {/* 1. Header Controls */}
      <div className="flex items-center space-x-3">
          <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light group-focus-within:text-primary transition-colors" />
              <input 
                  type="text" 
                  placeholder="Search words..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm focus:border-primary/50 outline-none transition-all shadow-sm text-dark placeholder-light"
              />
          </div>
          <button 
              onClick={requestResetAll}
              className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-light hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-colors shadow-sm"
              title="Reset ALL Progress"
          >
              <Trash2 className="w-5 h-5" />
          </button>
      </div>

      {selectedIds.size > 0 && (
          <div className="animate-in slide-in-from-top-2 duration-200">
              <button 
                onClick={handleStartCustomTraining}
                className="w-full py-3 bg-primary hover:bg-[#3d6082] text-white font-bold rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all"
              >
                  <span className="mr-2">Train {selectedIds.size} Words</span>
                  <Play className="w-4 h-4 fill-current" />
              </button>
          </div>
      )}

      {/* 2. List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
         <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
             <button 
                onClick={toggleSelectAll}
                className="flex items-center space-x-2 text-xs font-bold text-light hover:text-primary px-2 transition-colors group"
             >
                {areAllFilteredSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                ) : (
                    <Square className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:scale-110 transition-transform" />
                )}
                <span>{areAllFilteredSelected ? 'Unselect All' : 'Select All'}</span>
             </button>
             <span className="text-xs font-bold text-light px-2">{filteredWords.length} Words</span>
         </div>

         <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 p-2">
            <div className="space-y-1">
                {filteredWords.map((word) => {
                    const isSelected = selectedIds.has(word.id);
                    return (
                        <div key={word.id} className={`group flex items-center p-3 rounded-2xl transition-all border border-transparent ${isSelected ? 'bg-primary/5 border-primary/10' : 'hover:bg-slate-50 hover:border-slate-100'}`}>
                            {/* Checkbox */}
                            <button onClick={() => toggleSelect(word.id)} className="mr-3 text-slate-300 hover:text-primary self-start mt-1">
                                {isSelected ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                            </button>
                            
                            {/* Text Info - Column Layout */}
                            <div className="flex-1 min-w-0 pr-2">
                                {/* Row 1: Word */}
                                <div className={`font-bold text-base break-words whitespace-normal leading-tight ${isSelected ? 'text-primary' : 'text-dark'}`}>
                                    {word.word}
                                </div>
                                {/* Row 2: Meta */}
                                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                                    {word.part_of_speech && (
                                        <span className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded font-mono font-bold">
                                            {word.part_of_speech}
                                        </span>
                                    )}
                                    <span className="text-xs text-light font-medium break-words leading-tight">{word.meaning}</span>
                                </div>
                            </div>

                            {/* Actions Right */}
                            <div className="flex items-center space-x-2 flex-none">
                                {/* Battery */}
                                <div className="px-1">
                                    <ProficiencyBattery streak={word.streak} />
                                </div>

                                {/* Edit Button */}
                                <button
                                    onClick={() => requestEditWord(word)}
                                    className="p-2 text-slate-300 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                    title="Edit Word"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>

                                {/* Reset Button */}
                                <button 
                                    onClick={() => requestResetWord(word.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Reset Word"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredWords.length === 0 && (
                     <div className="p-8 text-center text-light italic text-sm">No words found.</div>
                )}
            </div>
         </div>
      </div>

      {/* Confirmation & Edit Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-dark/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {modalConfig.type === 'EDIT' && modalConfig.editWord ? (
                // EDIT MODAL
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-5 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-dark">Edit Word</h3>
                        <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="text-light hover:text-dark">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-5 space-y-4 overflow-y-auto">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-light uppercase">Word</label>
                            <input 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-dark focus:border-primary outline-none" 
                                value={modalConfig.editWord.word}
                                onChange={(e) => updateEditField('word', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-light uppercase">Part of Speech</label>
                            <input 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-dark focus:border-primary outline-none" 
                                value={modalConfig.editWord.part_of_speech}
                                onChange={(e) => updateEditField('part_of_speech', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-light uppercase">Meaning</label>
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-dark focus:border-primary outline-none resize-none h-20" 
                                value={modalConfig.editWord.meaning}
                                onChange={(e) => updateEditField('meaning', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-light uppercase">Example Sentence</label>
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-dark focus:border-primary outline-none resize-none h-24" 
                                value={modalConfig.editWord.sentence}
                                onChange={(e) => updateEditField('sentence', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-light uppercase">Cloze Sentence (Use ___)</label>
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-dark focus:border-primary outline-none resize-none h-24" 
                                value={modalConfig.editWord.cloze_sentence}
                                onChange={(e) => updateEditField('cloze_sentence', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="p-5 border-t border-slate-100 flex-none">
                        <button 
                            onClick={handleSaveEdit}
                            className="w-full py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-[#3d6082] transition-colors flex items-center justify-center space-x-2"
                        >
                            <Save className="w-5 h-5" />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            ) : (
                // CONFIRM MODAL
                <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-6 animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500 mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-dark text-center mb-2">Are you sure?</h3>
                    <p className="text-light text-sm text-center mb-6 leading-relaxed">
                        {modalConfig.message}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                            className="py-3 text-dark font-bold bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirmReset}
                            className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-colors text-sm"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};