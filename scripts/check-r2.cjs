const https = require('https');
https.get('https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev/lectures-manifest.json', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Lectures on R2 count:', parsed.lectures.length);
      console.log('Lectures titles on R2:', parsed.lectures.map(l => ({ id: l.id, title: l.title })));
      console.log('deletedLectureIds count on R2:', parsed.deletedLectureIds.length);
      console.log('deletedLectureIds on R2:', parsed.deletedLectureIds);
    } catch(e) {
      console.error(e.message);
    }
  });
}).on('error', e => console.error(e.message));
