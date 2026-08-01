import type { ImageData } from '../types';

export const solveProblem = async (text: string, image?: ImageData | null): Promise<string> => {
  try {
    const response = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, image: image ?? null }),
    });

    const data = await response.json();

    if (!response.ok) {
      return `An error occurred while trying to solve the problem: ${data.error || 'Unknown error'}`;
    }

    return data.text;
  } catch (error) {
    console.error('Error calling /api/solve:', error);
    if (error instanceof Error) {
      return `An error occurred while trying to solve the problem: ${error.message}`;
    }
    return 'An unknown error occurred while trying to solve the problem.';
  }
};
