/**
 * Official Stage Definition and Normalization Engine for Mr. Michael LMS
 * Replaces fragmented, regex/includes-based matching with an explicit canonical map.
 */

export const CANONICAL_STAGES = {
  PRI: 'pri',
  PREP: 'prep',
  SEC_1: 'sec-1',
  SEC_2: 'sec-2',
  SEC_3: 'sec-3',
  FOUNDATION: 'foundation',
  ALL_ACCESS: 'all-access'
};

export const STAGE_DEFINITIONS = [
  {
    id: CANONICAL_STAGES.ALL_ACCESS,
    title: 'جميع المراحل (VIP All-Access)',
    aliases: [
      'all-access',
      'all_access',
      'allaccess',
      'vip-all-access',
      'vip',
      'جميع المراحل',
      'شامل جميع المراحل',
      'كافة المراحل',
      'كل المراحل',
      'باقة شاملة',
      'bundle-all'
    ]
  },
  {
    id: CANONICAL_STAGES.SEC_3,
    title: 'الصف الثالث الثانوي',
    aliases: [
      'sec-3',
      'sec3',
      'sec_3',
      '3sec',
      'senior-3',
      'senior 3',
      'senior3',
      'grade-12',
      'grade 12',
      'thanaweya',
      'ثانوية عامة',
      'الثانوية العامة',
      'الصف الثالث الثانوي',
      'تالتة ثانوي',
      'تالته ثانوي',
      'الصف 3 الثانوي',
      '3 ثانوي',
      'الثالث الثانوي'
    ]
  },
  {
    id: CANONICAL_STAGES.SEC_2,
    title: 'الصف الثاني الثانوي',
    aliases: [
      'sec-2',
      'sec2',
      'sec_2',
      '2sec',
      'senior-2',
      'senior 2',
      'senior2',
      'grade-11',
      'grade 11',
      'الصف الثاني الثانوي',
      'تانية ثانوي',
      'تانيه ثانوي',
      'الصف 2 الثانوي',
      '2 ثانوي',
      'الثاني الثانوي'
    ]
  },
  {
    id: CANONICAL_STAGES.SEC_1,
    title: 'الصف الأول الثانوي',
    aliases: [
      'sec-1',
      'sec1',
      'sec_1',
      '1sec',
      'senior-1',
      'senior 1',
      'senior1',
      'grade-10',
      'grade 10',
      'الصف الأول الثانوي',
      'الصف الاول الثانوي',
      'أولى ثانوي',
      'اولى ثانوي',
      'الصف 1 الثانوي',
      '1 ثانوي',
      'الأول الثانوي',
      'الاول الثانوي'
    ]
  },
  {
    id: CANONICAL_STAGES.PREP,
    title: 'المرحلة الإعدادية',
    aliases: [
      'prep',
      'prep-3',
      'prep-2',
      'prep-1',
      'المرحلة الإعدادية',
      'المرحلة الاعدادية',
      'إعدادي',
      'اعدادي',
      'الصف الثالث الإعدادي',
      'الصف الثاني الإعدادي',
      'الصف الأول الإعدادي',
      'تالتة إعدادي',
      'تانية إعدادي',
      'أولى إعدادي'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI,
    title: 'المرحلة الابتدائية',
    aliases: [
      'pri',
      'primary',
      'المرحلة الابتدائية',
      'ابتدائي',
      'الصف السادس الابتدائي',
      'الصف الخامس الابتدائي',
      'الصف الرابع الابتدائي'
    ]
  },
  {
    id: CANONICAL_STAGES.FOUNDATION,
    title: 'كورس التأسيس الشامل',
    aliases: [
      'foundation',
      'fnd',
      'تأسيس',
      'تاسيس',
      'كورس التأسيس',
      'كورس التاسيس',
      'كورس التأسيس الشامل'
    ]
  }
];

/**
 * Normalizes any text or identifier into a strict canonical stage ID.
 * Priority:
 * 1. Exact canonical ID check.
 * 2. Aliases matched as full phrases (longest to shortest) to prevent substring clashes
 *    (e.g., "الصف الأول الثانوي" contains "ثانوي" but MUST match sec-1, never sec-2).
 */
export function normalizeStageId(targetId, stageName = '') {
  if (!targetId && !stageName) return CANONICAL_STAGES.SEC_3;

  const raw = `${targetId || ''} ${stageName || ''}`.toLowerCase().trim();
  if (!raw) return CANONICAL_STAGES.SEC_3;

  // 1. Direct Canonical check
  const directMatch = STAGE_DEFINITIONS.find(s => s.id === targetId?.toLowerCase()?.trim());
  if (directMatch) return directMatch.id;

  // 2. Prepare all aliases sorted by length descending
  const allAliases = [];
  STAGE_DEFINITIONS.forEach(def => {
    def.aliases.forEach(alias => {
      allAliases.push({
        stageId: def.id,
        alias: alias.toLowerCase().trim(),
        length: alias.length
      });
    });
  });

  allAliases.sort((a, b) => b.length - a.length);

  // Normalize arabic diacritics / alef
  const cleanRaw = raw
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[َُِّْ]/g, '')
    .trim();

  for (const item of allAliases) {
    const cleanAlias = item.alias
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[َُِّْ]/g, '')
      .trim();

    if (cleanRaw === cleanAlias) {
      return item.stageId;
    }

    // Word boundary or substring matching using cleaned string
    if (cleanRaw.includes(cleanAlias)) {
      return item.stageId;
    }
  }

  return CANONICAL_STAGES.SEC_3;
}

/**
 * Get human readable Arabic stage name from canonical ID
 */
export function getStageTitle(stageId) {
  const norm = normalizeStageId(stageId);
  const found = STAGE_DEFINITIONS.find(s => s.id === norm);
  return found ? found.title : 'الصف الثالث الثانوي';
}
