import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(walk(fullPath));
      }
    } else {
      if (/\.(tsx|jsx|ts|js)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('type="file"') || content.includes("type='file'")) {
          const lines = content.split('\n');
          lines.forEach((l, i) => {
            if (l.includes('type="file"') || l.includes("type='file'") || l.includes('accept=')) {
              results.push(`${fullPath}:${i + 1}: ${l.trim()}`);
            }
          });
        }
      }
    }
  });
  return results;
}

const fileInputs = walk('.');
console.log('=== ALL FILE INPUTS & ACCEPT ATTRIBUTES ===');
fileInputs.forEach((f) => console.log(f));

