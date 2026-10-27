import { ImprovementArea, ResumeMistake } from '@/types/resumeTypes';
import { generateMockScore, generateMockImprovementAreas, generateMockMistakes } from '@/utils/mockResumeAnalysis';

export type AIProvider = 'gemini' | 'groq' | 'mock';

export interface AISettings {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  groqApiKey: string;
  groqModel: string;
}

const STORAGE_KEY = 'resume_alchemy_ai_settings';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  geminiModel: 'gemini-2.0-flash',
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  groqModel: 'llama-3.3-70b-versatile',
};

export const AVAILABLE_MODELS = {
  gemini: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Recommended, Fast & Smart)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Recommended)' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra Fast)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  ],
};

export function getStoredAISettings(): AISettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_AI_SETTINGS,
        ...parsed,
        // Fall back to env variables if stored values are empty
        geminiApiKey: parsed.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
        groqApiKey: parsed.groqApiKey || import.meta.env.VITE_GROQ_API_KEY || '',
      };
    }
  } catch (e) {
    console.error('Failed to load AI settings from localStorage', e);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings to localStorage', e);
  }
}

export interface AnalysisResponse {
  score: number;
  improvementAreas: ImprovementArea[];
  mistakes: ResumeMistake[];
  providerUsed: AIProvider;
}

const SYSTEM_PROMPT = `You are a professional ATS (Applicant Tracking System) algorithm and senior executive resume reviewer.
Analyze the provided resume text thoroughly and objectively.

You must respond with valid JSON strictly conforming to this structure:
{
  "score": number, // an integer between 0 and 100 based on ATS readability, quantifiable metrics, keywords, layout clarity, and strong action verbs
  "improvementAreas": [
    {
      "id": "1",
      "category": "Format" | "Keywords" | "Structure" | "Content" | "Contact",
      "title": "Short title describing the area",
      "description": "Clear explanation of what needs improvement",
      "importance": "high" | "medium" | "low",
      "suggestions": ["Actionable bullet point 1", "Actionable bullet point 2"]
    }
  ],
  "mistakes": [
    {
      "id": "m1",
      "section": "e.g. Work Experience, Summary, or Skills",
      "title": "Short summary of the mistake",
      "originalText": "Exact quote or sample from the resume that is suboptimal",
      "improvedText": "High-impact, metric-driven rewritten version of that excerpt",
      "explanation": "Why this change makes the resume stronger and more ATS-compliant"
    }
  ]
}

Provide 3 to 5 realistic improvement areas and 2 to 4 concrete mistake rewrites with actual text from the resume.`;

async function analyzeWithGemini(
  resumeText: string,
  apiKey: string,
  model: string
): Promise<AnalysisResponse> {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set it in AI Settings or VITE_GEMINI_API_KEY.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `${SYSTEM_PROMPT}\n\nHere is the resume content to analyze:\n---\n${resumeText}\n---`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Gemini API returned status ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('No content returned from Gemini');
  }

  const parsed = JSON.parse(rawText);
  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score || 70))),
    improvementAreas: parsed.improvementAreas || [],
    mistakes: parsed.mistakes || [],
    providerUsed: 'gemini',
  };
}

async function analyzeWithGroq(
  resumeText: string,
  apiKey: string,
  model: string
): Promise<AnalysisResponse> {
  if (!apiKey) {
    throw new Error('Groq API key is required. Please set it in AI Settings or VITE_GROQ_API_KEY.');
  }

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Here is the resume content to analyze:\n---\n${resumeText}\n---`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `Groq API returned status ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error('No content returned from Groq');
  }

  const parsed = JSON.parse(rawContent);
  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score || 70))),
    improvementAreas: parsed.improvementAreas || [],
    mistakes: parsed.mistakes || [],
    providerUsed: 'groq',
  };
}

/**
 * Main dispatcher to analyze resume based on user settings
 */
export async function analyzeResumeWithAI(
  resumeText: string,
  customSettings?: Partial<AISettings>
): Promise<AnalysisResponse> {
  const settings = {
    ...getStoredAISettings(),
    ...customSettings,
  };

  if (settings.provider === 'gemini') {
    return await analyzeWithGemini(
      resumeText,
      settings.geminiApiKey,
      settings.geminiModel || 'gemini-2.0-flash'
    );
  }

  if (settings.provider === 'groq') {
    return await analyzeWithGroq(
      resumeText,
      settings.groqApiKey,
      settings.groqModel || 'llama-3.3-70b-versatile'
    );
  }

  // Fallback to simulated/mock analysis
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    score: generateMockScore(),
    improvementAreas: generateMockImprovementAreas(),
    mistakes: generateMockMistakes(),
    providerUsed: 'mock',
  };
}
