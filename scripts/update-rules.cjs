const fs = require('fs');
let r = fs.readFileSync('database.rules.json', 'utf8');
if (!r.includes('deletedLectureIds')) {
  r = r.replace('"lectures": {', '"deletedLectureIds": {\r\n      ".read": true,\r\n      ".write": true\r\n    },\r\n\r\n    "lectures": {');
  fs.writeFileSync('database.rules.json', r, 'utf8');
  console.log('database.rules.json updated');
} else {
  console.log('database.rules.json already has deletedLectureIds');
}
