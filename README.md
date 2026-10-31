# 🧮 Formula Forge — AI-Powered Multimodal Learning Tutor

<p align="center">
  **Learn concepts. Understand solutions. Master problem-solving.**
</p>

<p align="center">
  An AI-powered learning assistant that helps students solve, understand, and practice Mathematics, Science, and Engineering problems through text, images, and hand-drawn inputs.
</p>

<p align="center">
  🚀 **[Live Demo](https://formula-forge-phi.vercel.app/)** · 💻 **[GitHub Repository](https://github.com/Santosh02411)**
</p>

---

## 🌟 Overview

Formula Forge is a multimodal AI tutor designed to make learning more interactive and accessible. Instead of simply providing answers, it guides students through problem-solving with step-by-step explanations, contextual hints, mistake detection, and practice questions.

Powered by Google's Gemini API, it understands problems submitted through multiple input methods and adapts explanations to the student's selected learning level.

## ✨ Key Features

### 🖼️ Multimodal Problem Input
- **Text Input:** Enter questions directly.
- **Image Upload:** Upload problem images or screenshots.
- **Clipboard Support:** Paste screenshots using `Ctrl + V`.
- **Drawing Canvas:** Hand-draw mathematical equations, diagrams, and problems.

### 🧠 Three Intelligent Learning Modes

| Mode | Description |
|---|---|
| Solve | Provides structured, step-by-step solutions. |
| Hint Only | Guides students with hints without revealing the final answer. |
| Check My Work | Reviews the student's attempt and identifies the first mistake. |

### 📚 Personalized Learning
- Beginner, Standard, and Advanced difficulty levels.
- Support for Mathematics, Physics, Chemistry, Biology, Engineering, and Logic.
- Follow-up questions for deeper understanding.
- Generate similar practice problems with self-check answers.

### 🌍 Multilingual Learning
Get explanations in:
- English
- Hindi
- Kannada
- Tamil
- Telugu
- Marathi
- Bengali

### 🎤 Voice & Interactive Learning
- Speak questions using browser speech recognition.
- Listen to explanations using text-to-speech.
- Generate interactive three-question quizzes.
- Receive instant feedback and quiz scores.

### 📖 Additional Features
- Recent problem history saved locally.
- Solved-problem counter.
- Copy solutions to clipboard.
- Download solutions as Markdown.
- Print or export solutions as PDF.
- Client-side image compression and input validation.
- Safe Markdown rendering and model fallback handling.

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript |
| Styling | Tailwind CSS |
| AI Model | Google Gemini API |
| Backend | Vercel Serverless Functions |
| API | TypeScript (`api/solve.ts`) |
| Browser Features | Speech Recognition, Speech Synthesis, Canvas API |
| Deployment | Vercel |
| Version Control | Git & GitHub |

## ⚙️ Getting Started

### Prerequisites
- Node.js and npm
- Google Gemini API key
- Vercel CLI

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Santosh02411/Formula-Forge.git
cd Formula-Forge
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

**4. Start the application**

```bash
npx vercel dev
```

Open the local URL provided by Vercel in your browser.

> Note: `npm run dev` starts only the frontend. The `/api/solve` serverless endpoint requires `vercel dev` or a deployed Vercel environment.

## 🚀 Deployment

Formula Forge is deployed on Vercel.

To deploy your own instance:

1. Fork or clone the repository.
2. Import the project into Vercel.
3. Add `GEMINI_API_KEY` under Project Settings → Environment Variables.
4. Deploy the application.

**Live Application:** https://formula-forge-phi.vercel.app/

## 🔐 Security

- Gemini API credentials are stored server-side.
- AI requests are handled through the Vercel serverless function.
- Client-side input validation and image compression help manage incoming requests.
- API keys should never be exposed in frontend code or committed to GitHub.

## 🎯 Vision

Formula Forge aims to make AI a learning companion rather than just an answer generator. By combining multimodal interaction, guided reasoning, personalized explanations, and active practice, it encourages students to understand the process behind every solution.

## 👨‍💻 Author

**Santosh Suresh Madannavar**

- GitHub: [@Santosh02411](https://github.com/Santosh02411)
- Project: [Formula Forge](https://formula-forge-phi.vercel.app/)

---

<p align="center">
  **Built with ❤️ to make learning smarter, simpler, and more interactive.**
</p>
