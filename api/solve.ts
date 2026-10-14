import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const BASE = `You are 'Formula Forge', an expert tutor in mathematics, science, engineering and logical reasoning.
Format responses in Markdown. Use code blocks for equations and formulas. Never use LaTeX or \\frac; write fractions in plain text like x^3/3 + C.
Be accurate; if the image is unclear or the problem is ambiguous, say what you assumed.`;

const MODES: Record<string, string> = {
  solve: `Solve the problem step by step: Given, Find, Formula/Concept, numbered Steps (explain WHY each step is done), then a clearly highlighted **Final Answer** in plain text. End with a one-line "Key idea" the student should remember.`,
  hint: `Act as a Socratic tutor. Do NOT reveal the final answer or the full solution. Give exactly 3 progressive hints: **Hint 1** (a nudge on the concept), **Hint 2** (the method/formula to use), **Hint 3** (the first step worked out). Then invite the student to try and ask for the next step.`,
  check: `The student has shared THEIR OWN attempt (image and/or text). Review it line by line: say what is correct, find the FIRST mistake, explain why it is wrong, and show the corrected next step. Be encouraging. Do not rewrite the entire solution unless the attempt is empty. End with a verdict: Correct / Partly correct / Incorrect.`,
  practice: `Create ONE new practice problem testing the same concept, with different numbers/context and similar difficulty. Do NOT solve it in the main text. After a --- separator add "**Answer (for self-check):**" with only the final answer.`,
  transcribe: `Transcribe the handwritten or printed problem in the image EXACTLY as written, as plain text. Use ^ for powers, / for fractions, sqrt() for roots, and keep every digit, sign, variable and unit. Do not solve it, explain, or add anything. If part is illegible write [unclear]. Output only the transcription.`,
  followup: `Answer the student's follow-up question using the provided context. Be concise and clear, and relate it back to the earlier steps.`,
};

const LEVELS: Record<string, string> = {
  beginner: 'Explain for a beginner (school level): simple words, define terms, no skipped steps.',
  standard: 'Explain for a typical high-school/undergraduate student.',
  advanced: 'Explain for an advanced student: be concise, rigorous, mention alternative methods or edge cases.',
};

// Tried in order; a 404/unavailable model just falls through to the next one.
// Override the first choice anytime with a GEMINI_MODEL env var in Vercel (no code change needed).
const MODELS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash']
  .filter((m, i, a): m is string => !!m && a.indexOf(m) === i);
const MIME_OK = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });

  const { text = '', image = null, mode = 'solve', level = 'standard', subject = 'auto' } = (req.body || {}) as any;

  if (typeof text !== 'string' || text.length > 12000) return res.status(400).json({ error: 'Text is too long (max 12,000 characters).' });
  if (image && (!MIME_OK.includes(image.mimeType) || typeof image.base64 !== 'string' || image.base64.length > 4_000_000)) {
    return res.status(400).json({ error: 'Unsupported or too-large image. Use PNG/JPG/WEBP under ~3MB.' });
  }
  if (!text.trim() && !image) return res.status(400).json({ error: 'Please provide a problem as text or an image.' });

  const subjectLine = subject && subject !== 'auto' ? `Subject area: ${subject}.` : '';
  const authority = image && text.trim() && (mode === 'solve' || mode === 'hint')
    ? 'The typed text is the student-verified transcription of the problem; trust it over the image wherever they differ, and use the image only for diagrams.' : '';
  const systemInstruction = mode === 'transcribe' ? MODES.transcribe : [BASE, MODES[mode] || MODES.solve, LEVELS[level] || LEVELS.standard, subjectLine, authority].filter(Boolean).join('\n\n');

  const parts: any[] = [];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
  parts.push({ text: text.trim() || 'Please work on the problem shown in the image.' });

  const ai = new GoogleGenAI({ apiKey });
  let lastError = 'Unknown error';
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: { parts }, config: { systemInstruction } });
      if (response.text) return res.status(200).json({ text: response.text });
      lastError = 'The model returned an empty response. Try rephrasing or a clearer image.';
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`Gemini error (${model}):`, lastError);
    }
  }
  return res.status(502).json({ error: `The AI service is busy or unavailable right now. Please retry in a moment. (${lastError.slice(0, 160)})` });
}
