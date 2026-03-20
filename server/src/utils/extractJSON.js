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

  let jsonStr = text.substring(startIdx, endIdx + 1);
  
  // Sanitize the JSON string precisely:
  // We only want to escape control characters (like newlines) if they are 
  // INSIDE a string literal ("..."). Outside of strings, newlines are 
  // valid JSON whitespace.
  const sanitized = jsonStr.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/gs, (match, p1) => {
    // Inside the captured string content (p1), escape forbidden control characters
    return '"' + p1
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t') + '"';
  });

  try {
    return JSON.parse(sanitized);
  } catch (err) {
    // Fallback: If precision sanitation failed, try a final blind cleanup 
    // of the original string (risky but better than a total crash)
    try {
      const blindCleaned = jsonStr.replace(/[\n\r\t]/g, ' ');
      return JSON.parse(blindCleaned);
    } catch (finalErr) {
      console.error('Failed to parse even with sanitation. Original text snippet:', text.substring(0, 100));
      console.error('Sanitized string attempt:', sanitized.substring(0, 100));
      throw err;
    }
  }
}

module.exports = { extractJSON };
