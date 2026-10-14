import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import InputTabs from './components/InputTabs';
import TextInput from './components/TextInput';
import ImageInput from './components/ImageInput';
import DrawInput, { DrawInputHandles } from './components/DrawInput';
import SolutionDisplay from './components/SolutionDisplay';
import OptionsBar from './components/OptionsBar';
import QuizCard from './components/QuizCard';
import HistoryPanel from './components/HistoryPanel';
import MicButton from './components/MicButton';
import { VisualCard, VerifyBadge } from './components/VisualCard';
import { verifyClaim } from './utils/mathExpr';
import ProgressPanel from './components/ProgressPanel';
import { loadMastery, saveMastery, levelFor } from './utils/mastery';
import type { Mastery } from './utils/mastery';
import { speak, stopSpeaking, speechLang } from './utils/speech';
import type { VerifyResult } from './utils/mathExpr';
import { loadHistory, saveHistory, loadSolved, saveSolved } from './utils/history';
import { solveProblem } from './services/geminiService';
import { InputMode } from './types';
import type { ImageData, Action, Level, ThreadItem, SolveOptions, HistoryItem, QuizQuestion } from './types';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<InputMode>(InputMode.TEXT);
  const [problemText, setProblemText] = useState('');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [action, setAction] = useState<Action>('solve');
  const [level, setLevel] = useState<Level>('standard');
  const [subject, setSubject] = useState('auto');
  const [lastProblem, setLastProblem] = useState('');
  const [isReading, setIsReading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [solved, setSolved] = useState<number>(loadSolved);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [visual, setVisual] = useState<any>(null);
  const [visualLoading, setVisualLoading] = useState(false);
  const [verifyRes, setVerifyRes] = useState<VerifyResult | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [mastery, setMastery] = useState<Mastery>(loadMastery);
  const [voiceMode, setVoiceMode] = useState(false);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const histId = useRef('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Correctly set up a ref to get data from the DrawInput component
  const drawInputRef = useRef<DrawInputHandles>(null);

  const handleModeChange = (mode: InputMode) => {
    setActiveMode(mode);
    // Clear inputs when changing mode to avoid confusion
    setImageData(null);
    setError(null);
  };
  const run = async (label: string, text: string, image: ImageData | null, mode: SolveOptions['mode'], append = false, lv: Level = level) => {
    setError(null);
    setIsLoading(true);
    if (!append) setThread([]);
    try {
      const result = await solveProblem(text, image, { mode, level: lv, subject, language });
      const next = [...(append ? thread : []), { label, text: result }];
      setThread(next);
      setQuiz(null);
      if (!append) { setVisual(null); setVerifyRes(null); }
      if (!append) { histId.current = String(Date.now()); const n = solved + 1; setSolved(n); saveSolved(n); }
      const old = history.find((h) => h.id === histId.current);
      const item: HistoryItem = { id: histId.current, ts: Date.now(), title: old?.title ?? (text.trim().slice(0, 80) || '(image problem)'), thread: next };
      const list = [item, ...history.filter((h) => h.id !== item.id)].slice(0, 15);
      setHistory(list); saveHistory(list);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Ask the AI to transcribe the drawing to text first, so the user can see/fix what it "read" before solving.
  const readDrawing = async (image: ImageData): Promise<string> => {
    setError(null);
    setIsReading(true);
    try {
      const t = (await solveProblem('', image, { mode: 'transcribe', level, subject, language })).trim();
      setProblemText(t);
      if (t.includes('[unclear]')) setError('Some handwriting was unclear, so please check and correct the text above, then press Solve.');
      return t;
    } catch (e: any) {
      setError(e.message || 'Could not read the drawing.');
      return '';
    } finally {
      setIsReading(false);
    }
  };
  const handleRead = async () => {
    const img = drawInputRef.current?.getCanvasData();
    if (!img) return setError('Please draw something on the canvas.');
    await readDrawing(img);
  };

  const handleSolve = async () => {
    let image: ImageData | null = null;
    if (activeMode === InputMode.IMAGE) {
      if (!imageData) return setError('Please upload an image first.');
      image = imageData;
    } else if (activeMode === InputMode.DRAW) {
      image = drawInputRef.current?.getCanvasData() ?? null;
      if (!image) return setError('Please draw something on the canvas.');
    } else if (!problemText.trim()) {
      return setError('Please type a problem to solve.');
    }
    if (action === 'check' && activeMode === InputMode.TEXT && problemText.trim().length < 5) return setError('Add your attempt as text, an image, or a drawing.');
    let text = problemText;
    if (activeMode === InputMode.DRAW && image && !text.trim() && action !== 'check') {
      text = await readDrawing(image);
      if (!text || text.includes('[unclear]')) return;
    }
    setLastProblem(text.trim() || '(problem is in the image the student provided)');
    const label = action === 'hint' ? 'Hints' : action === 'check' ? 'Feedback on your work' : 'Solution';
    await run(label, text, image, action);
  };

  const context = () => `Original problem:\n${lastProblem}\n\nTutor's previous reply:\n${thread[thread.length - 1]?.text ?? ''}`;
  const handleFollowUp = (q: string) => run(`You asked: ${q}`, `${context()}\n\nStudent's follow-up question: ${q}`, null, 'followup', true);
  const handlePractice = () => run('Practice problem', context(), null, 'practice', true);

  const handleQuiz = async () => {
    setQuizLoading(true); setError(null);
    try {
      const raw = await solveProblem(context(), null, { mode: 'quiz', level, subject, language });
      const qs = JSON.parse(raw.replace(/```json|```/g, '').trim()) as QuizQuestion[];
      if (!Array.isArray(qs) || !qs.length || !qs.every((q) => Array.isArray(q.options) && typeof q.answer === 'number')) throw new Error('bad quiz');
      setQuiz(qs);
    } catch {
      setError('Could not create a quiz this time. Please try again.');
    } finally {
      setQuizLoading(false);
    }
  };
  const solutionContext = () => `Original problem:\n${lastProblem}\n\nTutor's solution:\n${thread[0]?.text ?? ''}`;
  const parseJson = (raw: string) => JSON.parse(raw.replace(/```json|```/g, '').trim());
  const handleVisual = async () => {
    setVisualLoading(true); setError(null);
    try {
      const spec = parseJson(await solveProblem(solutionContext(), null, { mode: 'visual', level, subject, language }));
      if (spec?.type !== 'plot' && spec?.type !== 'svg') throw new Error('bad');
      setVisual(spec);
    } catch { setError('Could not create a visual this time. Please try again.'); }
    finally { setVisualLoading(false); }
  };
  const handleVerify = async () => {
    setVerifyLoading(true); setError(null);
    try {
      setVerifyRes(verifyClaim(parseJson(await solveProblem(solutionContext(), null, { mode: 'verify', level, subject, language }))));
    } catch { setError('Could not run the verification this time. Please try again.'); }
    finally { setVerifyLoading(false); }
  };
  const handleWhatIf = async (q: string) => {
    setWhatIfLoading(true); setError(null);
    try {
      const r = parseJson(await solveProblem(`${solutionContext()}\n\nWhat-if question: ${q}`, null, { mode: 'whatif', level, subject, language }));
      if (r?.plot?.type !== 'plot') throw new Error('bad');
      setVisual({ ...r.plot, title: `What if: ${q}`.slice(0, 80), note: r.prediction });
    } catch { setError('Could not run that what-if this time. Try rephrasing it.'); }
    finally { setWhatIfLoading(false); }
  };
  const handleQuizFinish = (rs: { topic: string; correct: boolean }[]) => setMastery((m) => {
    const n = { ...m };
    rs.forEach((r) => { const v = n[r.topic] || { right: 0, total: 0 }; n[r.topic] = { right: v.right + (r.correct ? 1 : 0), total: v.total + 1 }; });
    saveMastery(n); return n;
  });
  const practiceTopic = (topic: string) => run(`Targeted practice: ${topic}`, `Create a practice problem on this topic: ${topic}`, null, 'practice', thread.length > 0, levelFor(mastery[topic]));

  // Voice tutor: read the answer aloud, then listen for the student's next question.
  const listen = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.lang = speechLang(language);
    r.onresult = (e: any) => handleFollowUp(e.results[0][0].transcript);
    r.onerror = () => {};
    r.start();
  };
  useEffect(() => {
    if (!voiceMode || !thread.length) return;
    speak(thread[thread.length - 1].text, language, listen);
    return () => stopSpeaking();
  }, [thread, voiceMode]);

  const openHistory = (h: HistoryItem) => { histId.current = h.id; setThread(h.thread); setLastProblem(h.title); setQuiz(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const deleteHistory = (id: string) => { const l = history.filter((h) => h.id !== id); setHistory(l); saveHistory(l); };

  const renderInputComponent = () => {
    switch (activeMode) {
      case InputMode.IMAGE:
        return <ImageInput setImageData={setImageData} />;
      case InputMode.DRAW:
        // FIX: Pass the ref to the DrawInput component
        return <DrawInput ref={drawInputRef} onRead={handleRead} reading={isReading} />;
      case InputMode.TEXT:
      default:
        return <TextInput problemText={problemText} setProblemText={setProblemText} />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <div className="animate-fade-up bg-forge-surface/60 p-5 md:p-7 rounded-2xl shadow-2xl border border-forge-border">
          <InputTabs activeMode={activeMode} onModeChange={handleModeChange} />
          <OptionsBar action={action} setAction={setAction} level={level} setLevel={setLevel} subject={subject} setSubject={setSubject} language={language} setLanguage={setLanguage} />
          
          <div className="mt-5">
            <div className="mb-3 flex justify-center"><MicButton language={language} onText={(t) => setProblemText((p) => (p ? p + ' ' + t : t))} /></div>
            {/* Additional text input for image and draw modes */}
            {(activeMode === InputMode.IMAGE || activeMode === InputMode.DRAW) && (
              <div className="mb-4">
                <TextInput 
                  problemText={problemText} 
                  setProblemText={setProblemText}
                />
              </div>
            )}
            {renderInputComponent()}
          </div>
          
          {error && (
            <p className="mt-4 text-center text-sm text-forge-danger bg-forge-danger/10 border border-forge-danger/30 rounded-lg py-2 px-4">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSolve}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-b from-forge-ember to-forge-ember-deep text-white font-display font-semibold rounded-xl shadow-ember hover:shadow-ember-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center"
            >
                {isLoading ? (
                    <>
                        <span className="forge-loader forge-loader--light mr-3 scale-75">
                          <span></span><span></span><span></span>
                        </span>
                        Solving…
                    </>
                ) : (
                    action === 'hint' ? 'Get hints' : action === 'check' ? 'Check my work' : 'Solve with Gemini'
                )}
            </button>
          </div>
        </div>

        <SolutionDisplay thread={thread} isLoading={isLoading} onFollowUp={handleFollowUp} onPractice={handlePractice} onQuiz={handleQuiz} quizLoading={quizLoading} language={language} onVisual={handleVisual} visualLoading={visualLoading} onVerify={handleVerify} verifyLoading={verifyLoading} verifyStatus={verifyRes?.status ?? null} onWhatIf={handleWhatIf} whatIfLoading={whatIfLoading} />
        {thread.length > 0 && !isLoading && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 print:hidden">
            <button onClick={() => { setVoiceMode((v) => !v); stopSpeaking(); }} className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${voiceMode ? 'border-forge-ember text-forge-ember bg-forge-ember/10' : 'border-forge-border text-forge-muted hover:text-forge-ember'}`}>🎙 Voice tutor: {voiceMode ? 'On' : 'Off'}</button>
            {voiceMode && <button onClick={() => { stopSpeaking(); listen(); }} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-forge-border text-forge-ink hover:border-forge-ember/60">✋ Interrupt &amp; ask</button>}
          </div>
        )}
        {verifyRes && <VerifyBadge r={verifyRes} />}
        {visual && <VisualCard spec={visual} onClose={() => setVisual(null)} />}
        {quiz && <QuizCard questions={quiz} onClose={() => setQuiz(null)} onFinish={handleQuizFinish} />}
        <ProgressPanel mastery={mastery} onPractice={practiceTopic} />
        <HistoryPanel items={history} solved={solved} onOpen={openHistory} onDelete={deleteHistory} />

        <footer className="text-center text-xs text-forge-muted/70 mt-8 pb-4">
          Powered by Google Gemini
        </footer>
      </main>
    </div>
  );
};

export default App;
