process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const r2Config = {
  accountId: '819fc4abad6f24879c065cd0dac920ed',
  bucketName: 'educational-videos',
  publicDomain: 'https://pub-6209dd5b4b61403592d78976eb48cac8.r2.dev',
  accessKeyId: '720c71c362801fdd04575a8d62562b49',
  secretAccessKey: '610a605c26d80b82b7958c6da7bd7f44f0df3196b7f2910d87b9e0f3968f1bc8'
};

function generatePresignedPutUrl({ bucket, key, accountId, accessKey, secretKey, expiresIn = 7200 }) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const pathStr = '/' + bucket + '/' + key.replace(/^\/+/, '');
  const credential = `${accessKey}/${dateStamp}/${region}/${service}/aws4_request`;

  const queryParams = [
    'X-Amz-Algorithm=AWS4-HMAC-SHA256',
    'X-Amz-Credential=' + encodeURIComponent(credential),
    'X-Amz-Date=' + amzDate,
    'X-Amz-Expires=' + expiresIn,
    'X-Amz-SignedHeaders=host'
  ].sort().join('&');

  const canonicalHeaders = 'host:' + host + '\n';
  const signedHeaders = 'host';
  const canonicalRequest = 'PUT\n' + pathStr + '\n' + queryParams + '\n' + canonicalHeaders + '\n' + signedHeaders + '\nUNSIGNED-PAYLOAD';

  const crHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + dateStamp + '/' + region + '/' + service + '/aws4_request\n' + crHash;

  function hmac(k, d) {
    return crypto.createHmac('sha256', k).update(d).digest();
  }

  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `https://${host}${pathStr}?${queryParams}&X-Amz-Signature=${signature}`;
}

function uploadBufferToR2(buffer, r2Key, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const putUrl = generatePresignedPutUrl({
      bucket: r2Config.bucketName,
      key: r2Key,
      accountId: r2Config.accountId,
      accessKey: r2Config.accessKeyId,
      secretKey: r2Config.secretAccessKey
    });

    const parsed = new URL(putUrl);
    const req = https.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length
      }
    }, res => {
      let respData = '';
      res.on('data', c => respData += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          reject(new Error(`R2 Upload failed with HTTP ${res.statusCode}: ${respData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

function updateExamsInLecturesList(lectures) {
  return lectures.map(lec => {
    if (lec.id === 'lec-1794001152669') {
      return {
        ...lec,
        exam: {
          ...lec.exam,
          totalMarks: 20,
          passingMarks: 10,
          hasManualQuestions: false,
          questions: [
            {
              id: 'q-1794000714476-0zvp',
              type: 'short_answer',
              question: '1. Ali is (tall) than Omar. صحح الخطا',
              questionText: '1. Ali is (tall) than Omar. صحح الخطا',
              options: [],
              correctAnswer: 'taller',
              modelAnswer: 'taller',
              points: 5,
              explanation: 'في المقارنة بين اثنين نضيف للصفة القصيرة er than فتصبح taller than'
            },
            {
              id: 'q-1794000915094-rg65',
              type: 'short_answer',
              question: '2. A car is( fastest) than a bike. صحح الخطا',
              questionText: '2. A car is( fastest) than a bike. صحح الخطا',
              options: [],
              correctAnswer: 'faster',
              modelAnswer: 'faster',
              points: 5,
              explanation: 'في المقارنة بين اثنين نستخدم صفة المقارنة faster than'
            },
            {
              id: 'q-1794000986368-aqtm',
              type: 'short_answer',
              question: '3. My bag is( biger) than yours.',
              questionText: '3. My bag is( biger) than yours.',
              options: [],
              correctAnswer: 'bigger',
              modelAnswer: 'bigger',
              points: 5,
              explanation: 'الصفة big تنتهي بساكن قبله متحرك قصير فنضاعف الحرف الأخير فتصبح bigger than'
            },
            {
              id: 'q-1794001046444-p4t1',
              type: 'short_answer',
              question: '4. A lion is (strong) than a cat.',
              questionText: '4. A lion is (strong) than a cat.',
              options: [],
              correctAnswer: 'stronger',
              modelAnswer: 'stronger',
              points: 5,
              explanation: 'نضيف er للصفة فتصبح stronger than'
            }
          ]
        }
      };
    }

    if (lec.id === 'lec-1794002706071') {
      return {
        ...lec,
        exam: {
          ...lec.exam,
          totalMarks: 20,
          passingMarks: 10,
          hasManualQuestions: false,
          questions: [
            {
              id: 'q-1794002478609-504w',
              type: 'short_answer',
              question: '5. Mona is( happyer )than Sara. صحح الخطا',
              questionText: '5. Mona is( happyer )than Sara. صحح الخطا',
              options: [],
              correctAnswer: 'happier',
              modelAnswer: 'happier',
              points: 10,
              explanation: 'الصفة happy تنتهي بـ y مسبوقة بساكن تحذف الـ y ونضع ier فتصبح happier than'
            },
            {
              id: 'q-1794002537606-nwo0',
              type: 'short_answer',
              question: 'English is (good) than Arabic ',
              questionText: 'English is (good) than Arabic ',
              options: [],
              correctAnswer: 'better',
              modelAnswer: 'better',
              points: 10,
              explanation: 'good صفة غير منتظمة (شاذة) وتتحول في المقارنة إلى better than'
            }
          ]
        }
      };
    }

    if (lec.id === 'lec-1794035946145') {
      return {
        ...lec,
        exam: {
          ...lec.exam,
          totalMarks: 20,
          passingMarks: 10,
          hasManualQuestions: false,
          questions: [
            {
              id: 'q-1794035308901-2wig',
              type: 'short_answer',
              question: 'yesterday I (catch) fish',
              questionText: 'yesterday I (catch) fish',
              options: [],
              correctAnswer: 'caught',
              modelAnswer: 'caught',
              points: 5,
              explanation: 'الفعل catch في زمن الماضي البسيط يتحول إلى caught'
            },
            {
              id: 'q-1794035389147-bwdw',
              type: 'short_answer',
              question: 'we (share) our food last night ',
              questionText: 'we (share) our food last night ',
              options: [],
              correctAnswer: 'shared',
              modelAnswer: 'shared',
              points: 5,
              explanation: 'الفعل share ينتهي بـ e نضيف له فقط d في الماضي البسيط ليصبح shared'
            },
            {
              id: 'q-1794035453648-66ka',
              type: 'short_answer',
              question: '?Be) she at home last night )',
              questionText: '?Be) she at home last night )',
              options: [],
              correctAnswer: 'was',
              modelAnswer: 'was / Was',
              points: 5,
              explanation: 'في السؤال عن الماضي مع الضمير المفرد she نستخدم Was'
            },
            {
              id: 'q-1794035579230-rcpp',
              type: 'short_answer',
              question: '?were you happy yesterday\n(yes I (were',
              questionText: '?were you happy yesterday\n(yes I (were',
              options: [],
              correctAnswer: 'was',
              modelAnswer: 'was',
              points: 5,
              explanation: 'في الإجابة المثبتة مع الضمير I في الماضي البسيط نستخدم was'
            }
          ]
        }
      };
    }

    return lec;
  });
}

async function main() {
  console.log('1. Updating public/lectures-manifest.json...');
  const manifestData = JSON.parse(fs.readFileSync('public/lectures-manifest.json', 'utf8'));
  manifestData.lectures = updateExamsInLecturesList(manifestData.lectures || []);
  manifestData.lastSyncedAt = new Date().toISOString();
  manifestData.version = (manifestData.version || 1) + 1;

  const manifestJson = JSON.stringify(manifestData, null, 2);
  fs.writeFileSync('public/lectures-manifest.json', manifestJson, 'utf8');
  if (fs.existsSync('lectures-manifest.json')) {
    fs.writeFileSync('lectures-manifest.json', manifestJson, 'utf8');
  }
  console.log('✓ Updated local manifest files.');

  // 2. Update src/data/lecturesData.js
  console.log('2. Updating src/data/lecturesData.js...');
  const properJs = `export const lecturesData = ${JSON.stringify(manifestData.lectures, null, 2)};\n`;
  fs.writeFileSync('src/data/lecturesData.js', properJs, 'utf8');
  console.log('✓ Updated src/data/lecturesData.js.');

  // 3. Upload to Cloudflare R2
  console.log('3. Uploading updated manifest to Cloudflare R2...');
  const manifestBuffer = Buffer.from(manifestJson, 'utf8');
  await uploadBufferToR2(manifestBuffer, 'lectures-manifest.json', 'application/json');
  console.log('✓ Successfully uploaded updated lectures-manifest.json to Cloudflare R2!');

  console.log('\n✅ All lecture exams updated with auto-grading answers and synced to R2!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
