import DOMPurify from 'dompurify';
import { marked } from 'marked';

// All model-generated HTML/SVG goes through DOMPurify with an explicit allowlist. Markdown and SVG are sanitized separately.
const SAFE_URL_REF = /^\s*url\(\s*#[\w-]+\s*\)\s*$/i;
DOMPurify.addHook('afterSanitizeAttributes', (node: Element) => {
  if (node.tagName === 'A') { node.setAttribute('rel', 'noopener noreferrer'); node.setAttribute('target', '_blank'); }
  Array.from(node.attributes).forEach((a) => { if (/url\s*\(/i.test(a.value) && !SAFE_URL_REF.test(a.value)) node.removeAttribute(a.name); }); // no external url() references
});

const MD_TAGS = ['p', 'br', 'hr', 'strong', 'em', 'b', 'i', 'u', 'del', 'sup', 'sub', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'span', 'div'];

export const sanitizeMarkdown = (md: string): string =>
  DOMPurify.sanitize(marked(String(md).slice(0, 100000), { gfm: true, breaks: true }) as string, {
    ALLOWED_TAGS: MD_TAGS, ALLOWED_ATTR: ['href', 'title'], ALLOW_DATA_ATTR: false, ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  });

export const sanitizeSvg = (raw: string): string | null => {
  if (typeof raw !== 'string' || raw.length > 60000) return null;
  const out = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: false },
    FORBID_TAGS: ['script', 'style', 'foreignObject', 'image', 'use', 'a', 'animate', 'set', 'animateTransform', 'animateMotion', 'filter', 'iframe'],
    FORBID_ATTR: ['style', 'href', 'xlink:href'], ALLOW_DATA_ATTR: false,
  }).trim();
  return out.startsWith('<svg') && (out.match(/<[a-z]/gi) || []).length <= 600 ? out : null;
};
