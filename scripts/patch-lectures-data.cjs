const fs = require('fs');
let content = fs.readFileSync('src/data/lecturesData.js', 'utf8').replace(/\r\n/g, '\n');

content = content.replace(
  '    id: "lec-s3-01",\n    stageId: "sec-3",',
  '    id: "lec-s3-01",\n    stageId: "sec-3",\n    sectionId: "sec3-month-1",'
);

content = content.replace(
  '    id: "lec-s3-02",\n    stageId: "sec-3",',
  '    id: "lec-s3-02",\n    stageId: "sec-3",\n    sectionId: "sec3-month-1",'
);

content = content.replace(
  '    id: "lec-s3-03",\n    stageId: "sec-3",',
  '    id: "lec-s3-03",\n    stageId: "sec-3",\n    sectionId: "sec3-month-2",'
);

content = content.replace(
  '    id: "lec-s2-01",\n    stageId: "sec-2",',
  '    id: "lec-s2-01",\n    stageId: "sec-2",\n    sectionId: "sec2-month-1",'
);

content = content.replace(
  '    id: "lec-s1-01",\n    stageId: "sec-1",',
  '    id: "lec-s1-01",\n    stageId: "sec-1",\n    sectionId: "sec1-month-1",'
);

content = content.replace(
  '    id: "lec-fnd-01",\n    stageId: "foundation",',
  '    id: "lec-fnd-01",\n    stageId: "foundation",\n    sectionId: "fnd-month-1",'
);

content = content.replace(
  '    id: "lec-prep-01",\n    stageId: "prep",',
  '    id: "lec-prep-01",\n    stageId: "prep",\n    sectionId: "prep-month-1",'
);

content = content.replace(
  '    id: "lec-pri-01",\n    stageId: "pri",',
  '    id: "lec-pri-01",\n    stageId: "pri",\n    sectionId: "pri-month-1",'
);

fs.writeFileSync('src/data/lecturesData.js', content, 'utf8');
console.log('Successfully patched lecturesData.js with sectionId');
