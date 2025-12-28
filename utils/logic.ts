import { VocabWord } from '../types';

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getDaysDiff = (dateStr: string | null): number => {
  if (!dateStr) return 9999; // Treat null as infinite days ago
  const today = new Date(getTodayDate());
  const last = new Date(dateStr);
  const diffTime = Math.abs(today.getTime() - last.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const selectWordsForSession = (allWords: VocabWord[], count: number): VocabWord[] => {
  // 1. Filter out graduated words
  const activeWords = allWords.filter(w => !w.is_graduated);
  
  // 2. Filter out words seen TODAY (to avoid immediate repetition), unless we don't have enough words.
  const today = getTodayDate();
  const availableWords = activeWords.filter(w => w.last_seen !== today);

  // If we don't have enough "not seen today" words, we must include today's words
  let pool = availableWords;
  if (availableWords.length < count) {
      pool = activeWords; // Fallback to all active words
  }

  // If still not enough, return what we have
  if (pool.length <= count) {
    return shuffle(pool);
  }

  // 3. Logic for Weighted Selection (Prioritize New & Hard)
  
  // Pool A (New/Cold): > 3 days ago OR never seen
  const poolA = pool.filter(w => getDaysDiff(w.last_seen) > 3);
  
  // Pool B (Review): <= 3 days ago
  const poolB = pool.filter(w => getDaysDiff(w.last_seen) <= 3);

  // Targets: 75% New/Cold, 25% Review
  const targetA = Math.ceil(count * 0.75); 
  const targetB = count - targetA;        

  // Sort Pool A by weight (Hardest/Newest priority)
  const sortedA = [...poolA].sort((a, b) => b.weight - a.weight);
  const selectedA = sortedA.slice(0, targetA);

  // Shuffle Pool B
  const shuffledB = shuffle(poolB);
  const selectedB = shuffledB.slice(0, targetB);

  // Merge & Backfill
  let selection = [...selectedA, ...selectedB];
  
  if (selection.length < count) {
      const selectedIds = new Set(selection.map(w => w.id));
      const remaining = pool.filter(w => !selectedIds.has(w.id));
      const needed = count - selection.length;
      selection = [...selection, ...shuffle(remaining).slice(0, needed)];
  }

  return shuffle(selection);
};

// Fisher-Yates shuffle
export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const updateWordProgress = (word: VocabWord, isCorrect: boolean): VocabWord => {
  const today = getTodayDate();
  
  let newStreak = word.streak;
  let newWeight = word.weight;
  let newIsGraduated = word.is_graduated;
  const newTotalAttempts = (word.total_attempts || 0) + 1;
  let newTotalCorrect = word.total_correct || 0;

  if (isCorrect) {
    newStreak = newStreak + 1;
    newTotalCorrect = newTotalCorrect + 1;
    
    // Graduation check
    if (newStreak >= 5) {
      newIsGraduated = true;
    }
  } else {
    // Reset streak on error
    newStreak = 1; 
    // Increase weight for difficult words
    newWeight = parseFloat((newWeight + 0.1).toFixed(2));
  }

  return {
    ...word,
    streak: newStreak,
    weight: newWeight,
    is_graduated: newIsGraduated,
    total_attempts: newTotalAttempts,
    total_correct: newTotalCorrect,
    last_seen: today
  };
};

export const parseRawInput = (input: string): { word: string; meaning: string; sentence: string }[] => {
  const lines = input.split('\n').filter(l => l.trim().length > 0);
  const result = [];
  for (const line of lines) {
    const parts = line.split('#').map(p => p.trim());
    if (parts.length >= 1) {
      result.push({
        word: parts[0],
        meaning: parts[1] || "",
        sentence: parts[2] || ""
      });
    }
  }
  return result;
};

export const mergeDatasets = (history: VocabWord[], newWords: VocabWord[]): VocabWord[] => {
  const map = new Map<string, VocabWord>();
  history.forEach(w => map.set(w.word.toLowerCase(), w));
  newWords.forEach(nw => {
    const key = nw.word.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        ...nw,
        streak: 0,
        weight: 0.5,
        total_attempts: 0,
        total_correct: 0,
        is_graduated: false,
        last_seen: null
      });
    }
  });
  return Array.from(map.values());
};