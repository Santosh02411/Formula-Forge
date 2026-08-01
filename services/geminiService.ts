import { GoogleGenAI } from "@google/genai";
import type { ImageData } from '../types';

const SYSTEM_INSTRUCTION = `You are 'Formula Forge', an advanced AI expert in mathematics, science, and logical reasoning. 
Your task is to provide highly accurate, detailed, and step-by-step solutions to the problems presented. 
Format your response using Markdown. Use code blocks for equations and formulas during the step-by-step explanation.
Break down the solution into logical steps. Start with what is given, what needs to be found, the formula to be used, the step-by-step calculation, and finally the answer.
Ensure your final answer is clearly stated and highlighted. For the final answer, write it in plain text using numerator/denominator style (e.g., x^3/3 + C). Do not use LaTeX, do not use \\frac, and do not put the final answer in a box.`;

export const solveProblem = async (text: string, image?: ImageData | null): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "⚠️ No Gemini API key found. Create a `.env.local` file in the project root with `GEMINI_API_KEY=your_api_key_here`, then restart `npm run dev`.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const contents = [];

    if (image) {
      contents.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      });
    }

    contents.push({ text: text || "Please solve the problem shown in the image." });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while trying to solve the problem: ${error.message}`;
    }
    return "An unknown error occurred while trying to solve the problem.";
  }
};
