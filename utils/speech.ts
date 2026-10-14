const LANGS: Record<string, string> = { English: 'en-IN', Hindi: 'hi-IN', Kannada: 'kn-IN', Tamil: 'ta-IN', Telugu: 'te-IN', Marathi: 'mr-IN', Bengali: 'bn-IN' };
export const LANGUAGES = Object.keys(LANGS);
export const speechLang = (l: string) => LANGS[l] || 'en-IN';
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
export const mathToSpeech = (t: string) => t
  .replace(/\*\*/g, '').replace(/^\s*[*-]\s+/gm, '')
  .replace(/\^2\b/g, ' squared').replace(/\^3\b/g, ' cubed').replace(/\^\(?(-?\w+)\)?/g, ' to the power $1')
  .replace(/sqrt\(/g, 'square root of (').replace(/\\int|∫/g, ' integral of ')
  .replace(/\*/g, ' times ').replace(/(\w|\))\s*\/\s*(\w|\()/g, '$1 over $2')
  .replace(/\s=\s/g, ' equals ').replace(/\s\+\s/g, ' plus ').replace(/\s-\s/g, ' minus ')
  .replace(/[`#>|_\\{}]/g, ' ');
export const speak = (text: string, lang: string, onEnd: () => void) => {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(mathToSpeech(text).slice(0, 3500));
  u.lang = speechLang(lang); u.rate = 0.95; u.onend = onEnd; u.onerror = onEnd;
  window.speechSynthesis.speak(u);
};
export const stopSpeaking = () => window.speechSynthesis.cancel();
