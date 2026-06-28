const fs = require('fs');

const files = [
  'e:\\\\ArrowDataTech\\\\frontend\\\\src\\\\pages\\\\user\\\\EmpDashboard.css',
  'e:\\\\ArrowDataTech\\\\frontend\\\\src\\\\pages\\\\user\\\\EmpHeader.css'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'Rajdhani', sans-serif/g, "'Poppins', sans-serif");
  content = content.replace(/'Orbitron', monospace/g, "'Poppins', sans-serif");
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated fonts in ${file}`);
});
