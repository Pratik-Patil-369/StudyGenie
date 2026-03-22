/**
 * Extracts topics and subtopics from syllabus text.
 * Improved with technical noise filtering to prevent low-quality topic extraction.
 */
const extractTopics = (text) => {
  const topics = [];
  const lines = text.split('\n');
  let currentTopic = null;

  // Technical Noise Blacklist (regex patterns to ignore)
  const noisePatterns = [
    /^[0x][0-9a-fA-F]+$/i,       // Hexadecimal codes (0x0000)
    /^(?:SYN|ACK|FIN|RST|PSH|URG)$/i, // Standard TCP/Network flags
    /^[A-F0-9]{2}(?::[A-F0-9]{2}){5}$/i, // MAC Addresses
    /^\d+\.\d+\.\d+\.\d+$/       // IP Addresses
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Noise Filter: Skip tiny lines, page numbers, or purely whitespace
    if (!trimmed || trimmed.length < 5 || /^\d+$/.test(trimmed)) continue;

    // Skip technical noise
    if (noisePatterns.some(pattern => pattern.test(trimmed))) continue;

    // Strict Subtopic Match (e.g., "1.1 Anatomy", "Section 1.2.3")
    const subtopicMatch = trimmed.match(/^(?:Section\s+)?(\d+\.\d+(?:\.\d+)?)\.?\s+(.+)$/i);
    
    // Strict Main Topic Match (e.g., "1 Introduction", "Unit 1: OS")
    // Uses negative lookahead (?!\.\d) to NOT match if a decimal follows immediately
    const topicMatch = trimmed.match(/^(?:Unit\s+)?(\d+)(?!\.\d)\.?\s+(.+)$/i);

    if (subtopicMatch && currentTopic) {
      currentTopic.subtopics.push({ 
        name: subtopicMatch[2].trim(), 
        completed: false 
      });
    } else if (topicMatch) {
      if (currentTopic) topics.push(currentTopic);
      currentTopic = {
        name: topicMatch[2].trim(),
        subtopics: [],
        completed: false,
        order: topics.length
      };
    }
  }

  if (currentTopic) topics.push(currentTopic);

  // Fallback: If no structured topics found, try splitting by paragraphs
  // Capped at 25 topics to prevent "topic explosion"
  if (topics.length === 0) {
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 15);
    return paragraphs.slice(0, 25).map((p, i) => ({
      name: p.split('\n')[0].slice(0, 80).trim(),
      subtopics: p.split('\n').slice(1, 5)
                  .filter(l => l.trim().length > 10)
                  .map(l => ({ name: l.slice(0, 120).trim(), completed: false })),
      order: i,
      completed: false
    }));
  }

  return topics;
};

// DIRECT EXPORT
module.exports = extractTopics;
