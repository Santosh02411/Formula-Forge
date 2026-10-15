import { marked } from 'marked';

// marked does not sanitize; strip scripts / event handlers / javascript: URLs from model output.
export const toSafeHtml = (md: string): string => {
  const doc = new DOMParser().parseFromString(marked(md, { gfm: true, breaks: true }) as string, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form').forEach((n) => n.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((a) => {
      if (a.name.startsWith('on') || (['href', 'src'].includes(a.name) && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
};
