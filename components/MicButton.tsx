import React, { useRef, useState } from 'react';
import { speechLang } from '../utils/speech';

const MicButton: React.FC<{ onText: (t: string) => void; language: string }> = ({ onText, language }) => {
  const [on, setOn] = useState(false);
  const rec = useRef<any>(null);
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const toggle = () => {
    if (on) { rec.current?.stop(); return; }
    const r = new SR();
    r.lang = speechLang(language); r.interimResults = false;
    r.onresult = (e: any) => onText(e.results[0][0].transcript);
    r.onend = () => setOn(false); r.onerror = () => setOn(false);
    rec.current = r; setOn(true); r.start();
  };
  return (
    <button onClick={toggle} aria-pressed={on} aria-label={on ? 'Stop listening' : 'Speak your problem using the microphone'} className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${on ? 'border-forge-ember text-forge-ember bg-forge-ember/10' : 'border-forge-border text-forge-muted hover:text-forge-ember'}`}>
      {on ? '● Listening… (tap to stop)' : '🎤 Speak your problem'}
    </button>
  );
};
export default MicButton;
