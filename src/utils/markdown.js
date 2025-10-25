import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe, simple rendering
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
});

// Custom renderer to add Calm UI classes
const renderer = {
  heading(text, level) {
    if (level === 1) return `<h1 class="text-xl font-bold text-calm-900 dark:text-calm-100 mb-3 mt-4 leading-tight">${text}</h1>`;
    if (level === 2) return `<h2 class="text-lg font-semibold text-calm-900 dark:text-calm-100 mb-3 mt-4 leading-tight">${text}</h2>`;
    if (level === 3) return `<h3 class="text-base font-semibold text-calm-900 dark:text-calm-100 mb-2 mt-3 leading-tight">${text}</h3>`;
    return `<h${level} class="text-base font-semibold text-calm-900 dark:text-calm-100 mb-2 mt-3 leading-tight">${text}</h${level}>`;
  },
  paragraph(text) {
    return `<p class="mb-3 text-calm-800 dark:text-calm-200 leading-relaxed">${text}</p>`;
  },
  strong(text) {
    return `<strong class="font-semibold text-calm-900 dark:text-calm-100">${text}</strong>`;
  },
  em(text) {
    return `<em class="italic text-calm-800 dark:text-calm-200">${text}</em>`;
  },
  codespan(code) {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code class="bg-calm-100 dark:bg-calm-800 px-2 py-1 rounded text-sm font-mono text-calm-900 dark:text-calm-100 border dark:border-calm-600">${escaped}</code>`;
  },
  list(body, ordered) {
    const tag = ordered ? 'ol' : 'ul';
    const cls = ordered
      ? 'list-decimal ml-5 mb-3 text-calm-800 dark:text-calm-200 leading-relaxed space-y-1'
      : 'list-disc ml-5 mb-3 text-calm-800 dark:text-calm-200 leading-relaxed space-y-1';
    return `<${tag} class="${cls}">${body}</${tag}>`;
  },
  listitem(text) {
    return `<li class="pl-1">${text}</li>`;
  },
};

marked.use({ renderer });

export function renderMarkdown(content) {
  try {
    // marked already escapes where necessary; sanitize output to be safe
    const raw = marked.parse(content || '');
    // Allow class attributes for styling
    const clean = DOMPurify.sanitize(raw, { ALLOWED_ATTR: ['class', 'href', 'title', 'target', 'rel'] });
    return clean;
  } catch (e) {
    console.error('[markdown] render failed', e);
    // Last-resort: escaped text with <br/>
    const escaped = (content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/\n/g, '<br>');
  }
}

export default renderMarkdown;
