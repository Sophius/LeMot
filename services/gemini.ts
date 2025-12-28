import { GoogleGenAI, Type } from "@google/genai";
import { VocabWord } from '../types';

const getAi = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey });
};

const MODEL_FAST = 'gemini-flash-lite-latest'; 

export const generateClozeAndId = async (
  rawWords: { word: string; meaning: string; sentence: string }[]
): Promise<VocabWord[]> => {
  const ai = getAi();
  
  const prompt = `
    You are a French teacher helper. I will give you a list of words.
    
    Your task for each item:
    1. If 'meaning' is missing, generate a concise Simplified Chinese meaning.
    2. Identify the Part of Speech (POS) using abbreviations like "v." (verb), "n.m." (noun masc), "adj." (adjective).
    3. If 'sentence' is missing, generate a French example sentence.
    4. Identify the EXACT string used for the word in the sentence (e.g., if word is 'être' and sentence uses 'suis', extracting 'suis'). This is 'answer_form'.
    5. Create a 'cloze_sentence' by replacing that exact string with "___".
    6. Assign a unique ID.
    
    Input Data:
    ${JSON.stringify(rawWords)}

    Return ONLY the JSON array matching this schema:
    {
      id: string,
      word: string, (The lemma)
      part_of_speech: string,
      answer_form: string, (The conjugated form found in sentence)
      meaning: string,
      sentence: string,
      cloze_sentence: string,
      streak: number (0)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              word: { type: Type.STRING },
              part_of_speech: { type: Type.STRING },
              answer_form: { type: Type.STRING },
              meaning: { type: Type.STRING },
              sentence: { type: Type.STRING },
              cloze_sentence: { type: Type.STRING },
              streak: { type: Type.INTEGER },
            }
          }
        }
      }
    });
    
    if (response.text) {
        const parsed = JSON.parse(response.text);
        return parsed.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            word: item.word,
            part_of_speech: item.part_of_speech || "",
            answer_form: item.answer_form || item.word,
            meaning: item.meaning,
            sentence: item.sentence,
            cloze_sentence: item.cloze_sentence,
            streak: item.streak || 0,
            last_seen: null,
            weight: 0.5,
            total_attempts: 0,
            total_correct: 0,
            is_graduated: false
        }));
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error generating cloze sentences:", error);
    return rawWords.map((w) => ({
      id: crypto.randomUUID(),
      word: w.word,
      part_of_speech: "未知",
      answer_form: w.word,
      meaning: w.meaning || "未知",
      sentence: w.sentence || "No sentence available.",
      cloze_sentence: (w.sentence || w.word).replace(new RegExp(w.word, 'gi'), '___'),
      streak: 0,
      last_seen: null,
      weight: 0.5,
      total_attempts: 0,
      total_correct: 0,
      is_graduated: false
    }));
  }
};

export const getDistractors = async (targetWord: string, existingWords: string[]): Promise<string[]> => {
  const ai = getAi();
  
  const prompt = `
    The target answer is: "${targetWord}".
    
    Generate 3 French distractors (incorrect options) that are grammatically similar to the target.
    
    CRITICAL RULES:
    1. If the target is a CONJUGATED verb (e.g., "suis", "allait", "prennent"), the distractors MUST be conjugated in the SAME person and tense (e.g., "vais", "marchait", "font"). DO NOT provide infinitives.
    2. If the target is an infinitive, provide infinitives.
    3. If the target is a noun, match gender and number.
    4. Do not include "${targetWord}".
    
    Return only a JSON array of 3 strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as string[];
    }
    return ["option1", "option2", "option3"];
  } catch (error) {
    return ["dire", "faire", "aller"];
  }
};

// Removed getExplanation as requested
