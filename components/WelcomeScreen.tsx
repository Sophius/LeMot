import React, { useState } from 'react';
import { VocabWord } from '../types';
import { parseRawInput, mergeDatasets } from '../utils/logic';
import { generateClozeAndId } from '../services/gemini';
import { Loader2, Play, FileJson, FileText, Upload, Edit2, Check, Download } from 'lucide-react';
// @ts-ignore
import mammoth from 'mammoth';

interface WelcomeScreenProps {
  onDataLoaded: (words: VocabWord[]) => void;
  onCancel?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onDataLoaded, onCancel }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showJsonText, setShowJsonText] = useState(false);
  const [showDocText, setShowDocText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setJsonInput(result);
      setShowJsonText(false); // Auto-hide text area on successful upload to show clean state
    };
    reader.onerror = () => setError("Failed to read JSON file.");
    reader.readAsText(file);
  };

  const handleDocxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTextInput(prev => {
            const separator = prev.trim() ? '\n' : '';
            return prev + separator + result.value;
        });
        setShowDocText(false); 
      } catch (err) {
        console.error(err);
        setError("Failed to read .docx file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let historyWords: VocabWord[] = [];
      let newRawWords: any[] = [];

      // 1. Parse JSON if present
      if (jsonInput.trim()) {
        try {
          const parsed = JSON.parse(jsonInput);
          if (Array.isArray(parsed)) {
            historyWords = parsed;
          } else {
            throw new Error("JSON must be an array");
          }
        } catch (e) {
          throw new Error("Invalid History JSON format.");
        }
      }

      // 2. Parse Raw Text if present
      if (textInput.trim()) {
        const rawParsed = parseRawInput(textInput);
        if (rawParsed.length > 0) {
            const enriched = await generateClozeAndId(rawParsed);
            newRawWords = enriched;
        }
      }

      if (historyWords.length === 0 && newRawWords.length === 0) {
        throw new Error("Please provide at least one data source.");
      }

      const finalDataset = mergeDatasets(historyWords, newRawWords as VocabWord[]);
      onDataLoaded(finalDataset);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full px-1 animate-fade-in relative">
      
      {/* Centered Content Wrapper */}
      <div className="flex-1 flex flex-col justify-center w-full space-y-8">
          
          {/* Header Row */}
          <div className="flex items-center justify-center space-x-4">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary">
               <Download className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-3xl font-extrabold text-dark tracking-tight">Data Import</h2>
                <p className="text-sm text-light font-medium">Load history or add new words</p>
            </div>
          </div>

          <div className="space-y-4 w-full">
            
            {/* Card 1: History (JSON) */}
            <div className={`relative overflow-hidden rounded-3xl transition-all duration-300 border-2 ${jsonInput ? 'border-success bg-success/5' : 'border-slate-100 bg-white'}`}>
                 <div className="p-5 flex flex-col gap-4">
                    {/* Info Row */}
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-none transition-colors ${jsonInput ? 'bg-success text-white' : 'bg-primary/10 text-primary'}`}>
                                {jsonInput ? <Check className="w-6 h-6"/> : <FileJson className="w-6 h-6"/>}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-dark text-lg">Load History</h3>
                            <p className="text-xs text-light font-medium">{jsonInput ? 'Data loaded successfully' : 'Restore existing progress'}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-dark font-bold text-sm cursor-pointer active:scale-95 transition-transform hover:bg-slate-100 touch-manipulation">
                            <Upload className="w-4 h-4" />
                            <span>Upload JSON</span>
                            <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                        </label>
                        <button 
                            onClick={() => setShowJsonText(!showJsonText)}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm active:scale-95 transition-all touch-manipulation ${showJsonText ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-slate-50 border-slate-200 text-dark hover:bg-slate-100'}`}
                        >
                            <Edit2 className="w-4 h-4" />
                            <span>{showJsonText ? 'Close' : 'Paste'}</span>
                        </button>
                    </div>
                 </div>

                 {/* Expandable Area */}
                 {showJsonText && (
                     <div className="px-5 pb-5 animate-slide-up">
                        <textarea 
                            className="w-full h-32 p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none text-dark"
                            placeholder='[ { "id": "...", "word": "...", ... } ]'
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                        />
                     </div>
                 )}
            </div>

            {/* Card 2: New Words (Doc/Text) */}
            <div className={`relative overflow-hidden rounded-3xl transition-all duration-300 border-2 ${textInput ? 'border-accent bg-accent/5' : 'border-slate-100 bg-white'}`}>
                 <div className="p-5 flex flex-col gap-4">
                    {/* Info Row */}
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-none transition-colors ${textInput ? 'bg-accent text-white' : 'bg-accent/10 text-accent'}`}>
                                {textInput ? <Check className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-dark text-lg">Add Words</h3>
                            <p className="text-xs text-light font-medium">{textInput ? 'Content ready to process' : 'Import from DOCX or Text'}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 text-dark font-bold text-sm cursor-pointer active:scale-95 transition-transform hover:bg-slate-100 touch-manipulation">
                            <Upload className="w-4 h-4" />
                            <span>Upload Doc</span>
                            <input type="file" accept=".docx" onChange={handleDocxUpload} className="hidden" />
                        </label>
                        <button 
                            onClick={() => setShowDocText(!showDocText)}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm active:scale-95 transition-all touch-manipulation ${showDocText ? 'bg-accent text-white border-accent shadow-lg shadow-accent/30' : 'bg-slate-50 border-slate-200 text-dark hover:bg-slate-100'}`}
                        >
                            <Edit2 className="w-4 h-4" />
                            <span>{showDocText ? 'Close' : 'Paste'}</span>
                        </button>
                    </div>
                 </div>

                 {/* Expandable Area */}
                 {showDocText && (
                     <div className="px-5 pb-5 animate-slide-up">
                        <textarea 
                            className="w-full h-32 p-4 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-accent/50 outline-none transition-all resize-none text-dark"
                            placeholder={'word # meaning # sentence\nOR just lists of words'}
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                     </div>
                 )}
            </div>
          </div>

          {error && (
            <div className="w-full bg-red-50 text-red-500 text-xs font-bold p-4 rounded-2xl border border-red-100 text-center animate-in zoom-in-95">
                {error}
            </div>
          )}
      </div>

      {/* Footer Button */}
      <div className="flex-none pt-4 pb-4">
        <button
            onClick={handleSubmit}
            disabled={isLoading || (!jsonInput.trim() && !textInput.trim())}
            className="w-full h-16 bg-primary hover:bg-[#3d6082] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/20 active:scale-[0.98] touch-manipulation group"
        >
            {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
            <div className="flex items-center gap-3">
                <span className="text-2xl tracking-wide">Start</span>
                <Play className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
            </div>
            )}
        </button>
      </div>
    </div>
  );
};