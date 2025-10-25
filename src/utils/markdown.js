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
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    if (depth === 1) return `<h1 class="text-xl font-bold text-calm-900 dark:text-calm-100 mb-3 mt-4 leading-tight">${text}</h1>`;
    if (depth === 2) return `<h2 class="text-lg font-semibold text-calm-900 dark:text-calm-100 mb-3 mt-4 leading-tight">${text}</h2>`;
    if (depth === 3) return `<h3 class="text-base font-semibold text-calm-900 dark:text-calm-100 mb-2 mt-3 leading-tight">${text}</h3>`;
    return `<h${depth} class="text-base font-semibold text-calm-900 dark:text-calm-100 mb-2 mt-3 leading-tight">${text}</h${depth}>`;
  },
  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p class="mb-3 text-calm-800 dark:text-calm-200 leading-relaxed">${text}</p>`;
  },
  strong({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong class="font-semibold text-calm-900 dark:text-calm-100">${text}</strong>`;
  },
  em({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<em class="italic text-calm-800 dark:text-calm-200">${text}</em>`;
  },
  codespan({ text }) {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<code class="bg-calm-100 dark:bg-calm-800 px-2 py-1 rounded text-sm font-mono text-calm-900 dark:text-calm-100 border dark:border-calm-600">${escaped}</code>`;
  },
  list({ ordered, items }) {
    const tag = ordered ? 'ol' : 'ul';
    const cls = ordered
      ? 'list-decimal ml-5 mb-3 text-calm-800 dark:text-calm-200 leading-relaxed space-y-1'
      : 'list-disc ml-5 mb-3 text-calm-800 dark:text-calm-200 leading-relaxed space-y-1';
    const body = items.map(item => this.listitem(item)).join('');
    return `<${tag} class="${cls}">${body}</${tag}>`;
  },
  listitem({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<li class="pl-1">${text}</li>`;
  },
};

marked.use({ renderer });

export function renderMarkdown(content) {
  console.log('[markdown] input type:', typeof content, 'value:', content);
  try {
    // marked.parse returns a string in sync mode (default)
    const raw = marked.parse(content || '', { async: false });
    console.log('[markdown] marked.parse output type:', typeof raw, 'value:', raw);
    // Ensure we have a string (marked can return Promise if async)
    const htmlString = typeof raw === 'string' ? raw : String(raw);
    console.log('[markdown] htmlString type:', typeof htmlString, 'preview:', htmlString.substring(0, 100));
    // Allow class attributes for styling
    const clean = DOMPurify.sanitize(htmlString, { ALLOWED_ATTR: ['class', 'href', 'title', 'target', 'rel'] });
    console.log('[markdown] sanitized output type:', typeof clean, 'preview:', clean.substring(0, 100));
    return clean;
  } catch (e) {
    console.error('[markdown] render failed', e);
    // Last-resort: escaped text with <br/>
    const escaped = (content || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/\n/g, '<br>');
  }
}

export default renderMarkdown;
