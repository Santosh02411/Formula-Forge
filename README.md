# 🧮 Formula Forge

AI tutor that helps students **learn** math, science and engineering — not just get answers. Type, upload a photo/screenshot, or hand-draw a problem; Gemini reasons over text + images.

## Features
- **Multimodal input:** type, upload, paste a screenshot (Ctrl+V), or draw on a canvas
- **Three learning modes:** *Solve* (step-by-step), *Hint only* (Socratic hints, no answer), *Check my work* (upload your own attempt; finds the first mistake)
- **Level & subject controls:** Beginner / Standard / Advanced; Math, Physics, Chemistry, Biology, Engineering, Logic
- **Follow-up questions** and **Practice a similar problem** (with a self-check answer)
- Copy, download (.md) and print/PDF of any solution
- Client-side image compression, input validation, model fallback and safe Markdown rendering
- API key stays server-side (Vercel serverless function `api/solve.ts`)

## Run locally
```bash
npm install
echo "GEMINI_API_KEY=your_key" > .env.local
npx vercel dev      # runs the frontend + /api/solve together
```
(`npm run dev` serves only the frontend; `/api/solve` needs `vercel dev` or a deployed Vercel project.)

## Deploy
Push to GitHub → Vercel auto-deploys. Set `GEMINI_API_KEY` in Vercel → Project → Settings → Environment Variables.

Built by [Santosh Suresh Madannavar](https://github.com/Santosh02411).

## More features
- Explain in English, Hindi, Kannada, Tamil, Telugu, Marathi or Bengali
- Voice: speak your problem 🎤 and have the solution read aloud 🔊 (browser speech APIs)
- "Quiz me": AI-generated 3-question quiz with instant feedback and score
- History of recent problems and a solved counter (saved locally in your browser)
