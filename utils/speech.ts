const LANGS: Record<string, string> = { English: 'en-IN', Hindi: 'hi-IN', Kannada: 'kn-IN', Tamil: 'ta-IN', Telugu: 'te-IN', Marathi: 'mr-IN', Bengali: 'bn-IN' };
export const LANGUAGES = Object.keys(LANGS);
export const speechLang = (l: string) => LANGS[l] || 'en-IN';
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
export const speak = (text: string, lang: string, onEnd: () => void) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[`*#>|_\\]/g, ' ').slice(0, 3500));
  u.lang = speechLang(lang); u.rate = 0.95; u.onend = onEnd; u.onerror = onEnd;
  window.speechSynthesis.speak(u);
};
export const stopSpeaking = () => window.speechSynthesis.cancel();
