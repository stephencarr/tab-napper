/**
 * Word count utility
 * Calculates word count from note content, excluding title/heading
 */

/**
 * Calculate word count from note content
 * Excludes the first line if it's a markdown heading
 * @param {string} content - The note content
 * @returns {number} - Word count
 */
export function calculateWordCount(content) {
  if (!content) return 0;
  
  const trimmedContent = content.trim();
  if (!trimmedContent) return 0;
  
  const lines = trimmedContent.split('\n');
  const firstLine = lines[0] || '';
  const isHeading = firstLine.trim().startsWith('#');
  
  // If first line is a heading, count words from body only
  const bodyOnly = isHeading ? lines.slice(1).join('\n').trim() : trimmedContent;
  
  return bodyOnly ? bodyOnly.split(/\s+/).length : 0;
}
