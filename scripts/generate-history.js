const fs = require('fs');
const path = require('path');

const historyDir = path.join('docs/history');
const outputDir = path.join('docs');
const historyFile = path.join(outputDir, 'history.json');

try {
  // Ensure history directory exists
  if (!fs.existsSync(historyDir)) {
    console.log(`History directory not found: ${historyDir}. Creating an empty history file.`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(historyFile, JSON.stringify([], null, 2));
    process.exit(0);
  }

  const files = fs.readdirSync(historyDir).filter(f => f.startsWith('status-') && f.endsWith('.json'));

  const history = files.map(file => {
    const content = JSON.parse(fs.readFileSync(path.join(historyDir, file), 'utf8'));
    const dateMatch = file.match(/\d{8}/);
    if (!dateMatch) return null;
    
    const date = dateMatch[0].replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    return { 
      date, 
      coverage: content.coverage || 0, 
      build: content.build || 'unknown' 
    };
  }).filter(Boolean); // Remove null entries

  // Sort history by date
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  console.log(`Successfully generated history.json with ${history.length} entries.`);

} catch (error) {
  console.error('Error generating history.json:', error);
  // Create an empty history file on error to prevent build failures
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(historyFile, JSON.stringify([], null, 2));
  process.exit(1);
}
