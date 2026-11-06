const fs = require('fs');
const path = require('path');

const vitePath = path.resolve(__dirname, '../vite.config.js');
let code = fs.readFileSync(vitePath, 'utf8');

const targetJs = "if (req.url && req.url.startsWith('/lectures-manifest.js')) {";
const replacementJs = "if (req.url && /^\\/lectures-manifest\\.js(\\?.*)?$/.test(req.url)) {";

const targetJson = "if (req.url && req.url.startsWith('/lectures-manifest.json')) {";
const replacementJson = "if (req.url && /^\\/lectures-manifest\\.json(\\?.*)?$/.test(req.url)) {";

if (code.includes(targetJs)) {
  code = code.replace(targetJs, replacementJs);
  console.log('Fixed manifest.js routing');
}
if (code.includes(targetJson)) {
  code = code.replace(targetJson, replacementJson);
  console.log('Fixed manifest.json routing');
}

fs.writeFileSync(vitePath, code, 'utf8');
console.log('vite.config.js updated successfully!');
