/**
 * Robust JSON extractor — finds the first JSON array or object
 * in a string that may contain extra text (e.g. AI markdown fences).
 * @param {string} text
 * @returns {any} Parsed JSON
 */
function extractJSON(text) {
  const arrStart = text.indexOf('[');
  const objStart = text.indexOf('{');

  let startIdx = -1;
  if (arrStart !== -1 && objStart !== -1) startIdx = Math.min(arrStart, objStart);
  else if (arrStart !== -1) startIdx = arrStart;
  else if (objStart !== -1) startIdx = objStart;

  const arrEnd = text.lastIndexOf(']');
  const objEnd = text.lastIndexOf('}');

  let endIdx = -1;
  if (arrEnd !== -1 && objEnd !== -1) endIdx = Math.max(arrEnd, objEnd);
  else if (arrEnd !== -1) endIdx = arrEnd;
  else if (objEnd !== -1) endIdx = objEnd;

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error('No JSON structure found in AI response');
  }

  return JSON.parse(text.substring(startIdx, endIdx + 1));
}

module.exports = { extractJSON };
