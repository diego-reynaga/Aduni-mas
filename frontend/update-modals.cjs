const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('c:/Users/Asus/Desktop/Aduni/Aduni-mas/frontend/src/pages/admin');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  if (content.includes('top: 0, left: 0, right: 0, bottom: 0,')) {
    content = content.replace(/top: 0, left: 0, right: 0, bottom: 0,/g, "top: 0, left: 'var(--sidebar-width)', right: 0, bottom: 0,");
    changed = true;
  }
  if (content.includes("maxWidth: '500px',") && !content.includes("maxHeight: '90vh'")) {
    content = content.replace(/maxWidth: '500px',/g, "maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',");
    changed = true;
  } 
  if (content.includes("maxWidth: '600px',") && !content.includes("maxHeight: '90vh'")) {
    content = content.replace(/maxWidth: '600px',/g, "maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',");
    changed = true;
  }
  if (content.includes("maxWidth: '800px',") && !content.includes("maxHeight: '90vh'")) {
    content = content.replace(/maxWidth: '800px',/g, "maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',");
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
