import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const BASE = `You are 'Formula Forge', an expert tutor in mathematics, science, engineering and logical reasoning.
Format responses in Markdown. Use code blocks for equations and formulas. Never use LaTeX or \\frac; write fractions in plain text like x^3/3 + C.
Be accurate; if the image is unclear or the problem is ambiguous, say what you assumed.`;

const MODES: Record<string, string> = {
  solve: `Solve the problem step by step: Given, Find, Formula/Concept, numbered Steps (explain WHY each step is done), then a clearly highlighted **Final Answer** in plain text. End with a one-line "Key idea" the student should remember. Then add a short section "**Assumptions & confidence:**" listing any assumptions you made, anything unclear in the input, and your confidence (High, Medium or Low).`,
  hint: `Act as a Socratic tutor. Do NOT reveal the final answer or the full solution. Give exactly 3 progressive hints: **Hint 1** (a nudge on the concept), **Hint 2** (the method/formula to use), **Hint 3** (the first step worked out). Then invite the student to try and ask for the next step.`,
  check: `The student has shared THEIR OWN attempt (image and/or text). Review it line by line: say what is correct, find the FIRST mistake, explain why it is wrong, and show the corrected next step. Be encouraging. Do not rewrite the entire solution unless the attempt is empty. End with a verdict: Correct / Partly correct / Incorrect.`,
  practice: `Create ONE new practice problem testing the same concept, with different numbers/context and similar difficulty. Do NOT solve it in the main text. After a --- separator add "**Answer (for self-check):**" with only the final answer.`,
  transcribe: `Transcribe the handwritten or printed problem in the image EXACTLY as written, as plain text. Use ^ for powers, / for fractions, sqrt() for roots, and keep every digit, sign, variable and unit. Do not solve it, explain, or add anything. If part is illegible write [unclear]. Output only the transcription.`,
  quiz: `Create exactly 3 multiple-choice questions (4 options each) that test the key concept from the given problem and tutor reply, with increasing difficulty. Output ONLY a JSON array: [{"q":"question","options":["A","B","C","D"],"answer":0,"why":"one-sentence explanation","topic":"short concept name, 2-4 words"}] where answer is the 0-based index of the correct option. Plain text only, no LaTeX.`,
  visual: `Create a visual explanation of the problem. Output ONLY JSON. For functions, calculus or algebra: {"type":"plot","title":"short","expr":"a*x^2+b","xmin":-5,"xmax":5,"shade":[0,2] or null,"params":[{"name":"a","min":-3,"max":3,"value":1}]}. expr may use only x, parameter names, + - * / ^ ( ), sin cos tan exp ln sqrt abs, pi, e, with explicit * for multiplication; use at most 3 params only for meaningful adjustable constants (omit params if none); shade only for a definite integral. For geometry, physics (forces, circuits, motion), chemistry or anything that is not a function graph: {"type":"svg","title":"short","svg":"<svg viewBox='0 0 600 360' xmlns='http://www.w3.org/2000/svg'>...</svg>"} - a clean labeled diagram showing the given values; no scripts or images; use stroke and fill 'currentColor' for lines and text so it works on dark and light backgrounds; font-size 16 or more.`,
  verify: `Extract ONE machine-checkable claim for the FINAL ANSWER of the tutor's solution and output ONLY JSON, using plain numbers (decimals, never fractions). Allowed: {"kind":"definite_integral","expr":"3*x^2+4*x+5","a":0,"b":2,"answer":26} | {"kind":"derivative","expr":"x^3","at":2,"answer":12} | {"kind":"roots","expr":"x^2-5*x+6","answers":[2,3]} (expr = left side minus right side) | {"kind":"evaluate","expr":"2*3+4","answer":10} | {"kind":"none","reason":"why"} if the answer is not one of these. expr uses only x, + - * / ^ ( ), sin cos tan exp ln sqrt abs, pi, e, with explicit * for multiplication. Use the ORIGINAL PROBLEM's expression, not the tutor's working, and copy the tutor's stated final answer as the answer.`,
  whatif: `Answer the student's what-if question about the problem. Output ONLY JSON: {"prediction":"2-3 sentences predicting what changes and why, including the new numeric result when computable","plot":{"type":"plot","title":"short","expr":"...","xmin":0,"xmax":10,"shade":null,"params":[{"name":"g","min":1,"max":20,"value":9.8}]}}. The plot must show how the key outcome depends on the changed quantity (x-axis is that quantity or time) using the real scientific formula; expr may use only x, parameter names, + - * / ^ ( ), sin cos tan exp ln sqrt abs, pi, e, with explicit *; at most 3 params, so the student can slide the changed quantity.`,
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

  const { text = '', image = null, mode = 'solve', level = 'standard', subject = 'auto', language = 'English' } = (req.body || {}) as any;

  if (typeof text !== 'string' || text.length > 12000) return res.status(400).json({ error: 'Text is too long (max 12,000 characters).' });
  if (image && (!MIME_OK.includes(image.mimeType) || typeof image.base64 !== 'string' || image.base64.length > 4_000_000)) {
    return res.status(400).json({ error: 'Unsupported or too-large image. Use PNG/JPG/WEBP under ~3MB.' });
  }
  if (!text.trim() && !image) return res.status(400).json({ error: 'Please provide a problem as text or an image.' });

  const subjectLine = subject && subject !== 'auto' ? `Subject area: ${subject}.` : '';
  const langLine = language && language !== 'English' ? `Write all explanations in ${language} (keep numbers, formulas, variables and symbols as they are).` : '';
  const fusion = image ? 'If the image contains circles, arrows, underlines or highlights made by the student, identify exactly what is marked and focus on it. If the student also asks a question (typed or spoken), answer that question specifically and tie the explanation to the visible parts of the diagram or work.' : '';
  const authority = image && text.trim() && (mode === 'solve' || mode === 'hint')
    ? 'The typed text is the student-verified transcription of the problem; trust it over the image wherever they differ, and use the image only for diagrams.' : '';
  const systemInstruction = ['transcribe', 'quiz', 'visual', 'verify', 'whatif'].includes(mode) ? [MODES[mode], mode === 'quiz' ? langLine : ''].filter(Boolean).join('\n\n') : [BASE, MODES[mode] || MODES.solve, LEVELS[level] || LEVELS.standard, subjectLine, langLine, authority, fusion].filter(Boolean).join('\n\n');

  const parts: any[] = [];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
  parts.push({ text: text.trim() || 'Please work on the problem shown in the image.' });

  const ai = new GoogleGenAI({ apiKey });
  let lastError = 'Unknown error';
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({ model, contents: { parts }, config: { systemInstruction, ...(['quiz', 'visual', 'verify', 'whatif'].includes(mode) ? { responseMimeType: 'application/json' } : {}) } });
      if (response.text) return res.status(200).json({ text: response.text });
      lastError = 'The model returned an empty response. Try rephrasing or a clearer image.';
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error(`Gemini error (${model}):`, lastError);
    }
  }
  return res.status(502).json({ error: `The AI service is busy or unavailable right now. Please retry in a moment. (${lastError.slice(0, 160)})` });
}
