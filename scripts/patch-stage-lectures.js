import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../src/components/stages/StageLecturesPage.jsx');

let code = fs.readFileSync(targetFile, 'utf8');

code = code.replace(
  `    unlockedLectureIds,\n    sections\n  } = useTeacher();`,
  `    unlockedLectureIds,\n    sections,\n    refreshLecturesManifest\n  } = useTeacher();`
);

code = code.replace(
  `  const [filterType, setFilterType] = useState('all'); // 'all' | 'month' | 'course'`,
  `  useEffect(() => {
    if (typeof refreshLecturesManifest === 'function') {
      refreshLecturesManifest();
    }
  }, [stageId, refreshLecturesManifest]);

  const [filterType, setFilterType] = useState('all'); // 'all' | 'month' | 'course'`
);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('✅ StageLecturesPage.jsx patched successfully!');
