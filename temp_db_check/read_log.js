const fs = require('fs');
try {
  const content = fs.readFileSync('e:/ArrowDataTech/frontend/build.log', 'utf16le');
  console.log(content);
} catch (e) {
  console.error(e);
}
