function extractTopics(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const lines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return [];

  const topics = [];
  let currentTopic = null;

  const headingPatterns = [
    /^(chapter|unit|module|section|part|topic|lesson)\s*[\d.:–\-]+\s*/i,
    /^(chapter|unit|module|section|part|topic|lesson)\s*[IVXLC]+/i,
    /^\d+[.)]\s+\S/,
    /^\d+\s*[-–:]\s+\S/,
    /^[IVXLC]+[.)]\s+\S/,
    /^#{1,3}\s+/,
    /^[A-Z][A-Z\s]{4,}$/,
  ];

  const subtopicPatterns = [
    /^\d+\.\d+[\s.)]/,
    /^[a-z][.)]\s+/,
    /^[-•●○▪►▸]\s+/,
    /^\*\s+/,
    /^–\s+/,
    /^\(\w+\)\s+/,
  ];

  for (const line of lines) {
    if (line.length <= 2) continue;
    if (/^\d+$/.test(line)) continue;
    if (/^page\s+\d+/i.test(line)) continue;

    const isHeading = headingPatterns.some(p => p.test(line));
    const isSubtopic = subtopicPatterns.some(p => p.test(line));

    if (isHeading) {
      const name = line
        .replace(/^(chapter|unit|module|section|part|topic|lesson)\s*[\d.:–\-]+\s*/i, '')
        .replace(/^(chapter|unit|module|section|part|topic|lesson)\s*[IVXLC]+[.\s]*/i, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^\d+\s*[-–:]\s*/, '')
        .replace(/^[IVXLC]+[.)]\s*/, '')
        .replace(/^#{1,3}\s*/, '')
        .replace(/[:–—\-]\s*$/, '')
        .trim();

      if (name.length > 1) {
        currentTopic = { name, subtopics: [], order: topics.length };
        topics.push(currentTopic);
      }
    } else if (isSubtopic && currentTopic) {
      const sub = line
        .replace(/^\d+\.\d+[.)]*\s*/, '')
        .replace(/^[a-z][.)]\s*/, '')
        .replace(/^[-•●○▪►▸*–]\s*/, '')
        .replace(/^\(\w+\)\s*/, '')
        .trim();

      if (sub.length > 1) {
        currentTopic.subtopics.push(sub);
      }
    }
  }

  // Fallback: split by paragraphs if no headings were found
  if (topics.length === 0) {
    const paragraphs = normalized.split('\n\n').map(p => p.trim()).filter(p => p.length > 3);
    if (paragraphs.length > 1 && paragraphs.length <= 50) {
      paragraphs.forEach((para, i) => {
        const paraLines = para.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const name = paraLines[0].slice(0, 120);
        const subtopics = paraLines.slice(1).filter(l => l.length > 2).map(l => l.slice(0, 120));
        topics.push({ name, subtopics, order: i });
      });
    }
  }

  // Last resort: treat each line as a separate topic
  if (topics.length === 0) {
    const meaningfulLines = lines.filter(l =>
      l.length > 3 &&
      !/^\d+$/.test(l) &&
      !/^page\s+\d+/i.test(l) &&
      !/^(table of contents|index|references|bibliography)/i.test(l)
    );
    meaningfulLines.slice(0, 30).forEach((line, i) => {
      topics.push({ name: line.slice(0, 120), subtopics: [], order: i });
    });
  }

  return topics;
}

module.exports = { extractTopics };
