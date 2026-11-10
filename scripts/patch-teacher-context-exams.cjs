const fs = require('fs');

const filePath = 'src/context/TeacherContext.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const isCRLF = content.includes('\r\n');
const normalize = s => isCRLF ? s.replace(/\r?\n/g, '\r\n') : s.replace(/\r?\n/g, '\n');

const oldGQ4 = `            options: ['Who', 'Whom', 'Which', 'Whose'],
            correctAnswers: [0, 1, 3],
            explanation: 'الضمائر Who و Whom و Whose تستخدم للإشارة للعاقل، بينما Which لغير العاقل.'
          },
          {
            id: 'gq-essay-1',
            type: 'essay',
            question: 'Discuss in 3-5 sentences the impact of modern artificial intelligence on learning English as a foreign language.',
            points: 10,
            modelAnswer: 'The answer should evaluate both pros (interactive feedback, 24/7 practice) and cons (reliance without critical thinking), using clear grammar and transitions.',
            explanation: 'يقيم المستر الإجابة بناءً على دقة التراكيب اللغوية وترابط الأفكار وتنوع المفردات.'
          },
          {
            id: 'gq-short-1',
            type: 'short_answer',
            question: 'What is the term for a word that sounds the same as another word but has a different spelling and meaning? (One word)',
            points: 10,
            modelAnswer: 'homophone',
            explanation: 'A homophone is a word pronounced the same as another word but differing in meaning and spelling.'
          }`;

const newGQ4 = `            options: ['Who', 'Whom', 'Which', 'Whose'],
            correctAnswer: [0, 1, 3],
            correctAnswers: [0, 1, 3],
            explanation: 'الضمائر Who و Whom و Whose تستخدم للإشارة للعاقل، بينما Which لغير العاقل.'
          },
          {
            id: 'gq-essay-1',
            type: 'essay',
            question: 'Discuss in 3-5 sentences the impact of modern artificial intelligence on learning English as a foreign language.',
            points: 10,
            modelAnswer: 'The answer should evaluate both pros (interactive feedback, 24/7 practice) and cons (reliance without critical thinking), using clear grammar and transitions.',
            explanation: 'يقيم المستر الإجابة بناءً على دقة التراكيب اللغوية وترابط الأفكار وتنوع المفردات.'
          },
          {
            id: 'gq-short-1',
            type: 'short_answer',
            question: 'What is the term for a word that sounds the same as another word but has a different spelling and meaning? (One word)',
            points: 10,
            correctAnswer: 'homophone',
            modelAnswer: 'homophone',
            explanation: 'A homophone is a word pronounced the same as another word but differing in meaning and spelling.'
          }`;

if (content.includes(normalize(oldGQ4))) {
  content = content.replace(normalize(oldGQ4), normalize(newGQ4));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✓ Successfully patched TeacherContext.jsx gen-exam-01 questions!');
} else {
  console.error('✗ oldGQ4 not found');
}
