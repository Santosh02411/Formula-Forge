import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are 'Formula Forge', an advanced AI expert in mathematics, science, and logical reasoning. 
Your task is to provide highly accurate, detailed, and step-by-step solutions to the problems presented. 
Format your response using Markdown. Use code blocks for equations and formulas during the step-by-step explanation.
Break down the solution into logical steps. Start with what is given, what needs to be found, the formula to be used, the step-by-step calculation, and finally the answer.
Ensure your final answer is clearly stated and highlighted. For the final answer, write it in plain text using numerator/denominator style (e.g., x^3/3 + C). Do not use LaTeX, do not use \\frac, and do not put the final answer in a box.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This key is read from Vercel's server-side environment variables.
  // It is NEVER sent to or bundled for the browser.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not set on the server. Add it in your Vercel project settings.',
    });
  }

  try {
    const { text, image } = req.body as {
      text?: string;
      image?: { base64: string; mimeType: string } | null;
    };

    const contents: any[] = [];

    if (image) {
      contents.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      });
    }

    contents.push({ text: text || 'Please solve the problem shown in the image.' });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return res.status(500).json({ error: message });
  }
}
