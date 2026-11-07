/**
 * Official Stage Definition and Normalization Engine for Mr. Michael LMS
 * Replaces fragmented, regex/includes-based matching with an explicit canonical map.
 */

export const CANONICAL_STAGES = {
  PRI: 'pri',
  PRI_1: 'pri-1',
  PRI_2: 'pri-2',
  PRI_3: 'pri-3',
  PRI_4: 'pri-4',
  PRI_5: 'pri-5',
  PRI_6: 'pri-6',
  PREP: 'prep',
  PREP_1: 'prep-1',
  PREP_2: 'prep-2',
  PREP_3: 'prep-3',
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
    title: 'الصف الثالث الإعدادي',
    aliases: [
      'prep',
      'prep-3',
      'prep3',
      'prep_3',
      'المرحلة الإعدادية',
      'المرحلة الاعدادية',
      'إعدادي',
      'اعدادي',
      'الصف الثالث الإعدادي',
      'الصف الثالث الاعدادي',
      'تالتة إعدادي',
      'تالته اعدادي',
      '3 إعدادي',
      '3 اعدادي'
    ]
  },
  {
    id: CANONICAL_STAGES.PREP_2,
    title: 'الصف الثاني الإعدادي',
    aliases: [
      'prep-2',
      'prep2',
      'الصف الثاني الإعدادي',
      'الصف الثاني الاعدادي',
      'تانية إعدادي',
      'تانيه اعدادي',
      '2 إعدادي',
      '2 اعدادي'
    ]
  },
  {
    id: CANONICAL_STAGES.PREP_1,
    title: 'الصف الأول الإعدادي',
    aliases: [
      'prep-1',
      'prep1',
      'الصف الأول الإعدادي',
      'الصف الاول الاعدادي',
      'أولى إعدادي',
      'اولى اعدادي',
      '1 إعدادي',
      '1 اعدادي'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI,
    title: 'الصف السادس الابتدائي',
    aliases: [
      'pri',
      'pri-6',
      'pri6',
      'pri_6',
      'primary',
      'المرحلة الابتدائية',
      'ابتدائي',
      'سنة سادسة',
      'سنه سادسه',
      'سادسة ابتدائي',
      'سادسه ابتدائي',
      'الصف السادس الابتدائي',
      'الصف السادس',
      '6 ابتدائي'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI_5,
    title: 'الصف الخامس الابتدائي',
    aliases: [
      'pri-5',
      'pri5',
      'سنة خامسة',
      'سنه خامسه',
      'خامسة ابتدائي',
      'خامسه ابتدائي',
      'الصف الخامس الابتدائي',
      'الصف الخامس',
      '5 ابتدائي'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI_4,
    title: 'الصف الرابع الابتدائي',
    aliases: [
      'pri-4',
      'pri4',
      'سنة رابعة',
      'سنه رابعه',
      'رابعة ابتدائي',
      'رابعه ابتدائي',
      'الصف الرابع الابتدائي',
      'الصف الرابع',
      '4 ابتدائي'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI_3,
    title: 'الصف الثالث الابتدائي',
    aliases: [
      'pri-3',
      'pri3',
      'سنة تالتة ابتدائي',
      'سنه تالته ابتدائي',
      'تالتة ابتدائي',
      'تالته ابتدائي',
      'الصف الثالث الابتدائي',
      '3 ابتدائي',
      '3 ابتدائى',
      'ثالثة ابتدائي',
      'ثالثه ابتدائي',
      'ثالثه ابتدائى',
      'ثالثة ابتدائى',
      'تالته ابتدائى',
      'تالتة ابتدائى',
      'الصف الثالث الابتدائى'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI_2,
    title: 'الصف الثاني الابتدائي',
    aliases: [
      'pri-2',
      'pri2',
      'سنة تانية ابتدائي',
      'سنه تانيه ابتدائي',
      'تانية ابتدائي',
      'تانيه ابتدائي',
      'الصف الثاني الابتدائي',
      '2 ابتدائي',
      '2 ابتدائى',
      'ثانية ابتدائي',
      'ثانيه ابتدائي',
      'ثانيه ابتدائى',
      'ثانية ابتدائى',
      'تانيه ابتدائى',
      'تانية ابتدائى',
      'الصف الثاني الابتدائى'
    ]
  },
  {
    id: CANONICAL_STAGES.PRI_1,
    title: 'الصف الأول الابتدائي',
    aliases: [
      'pri-1',
      'pri1',
      'سنة أولى ابتدائي',
      'سنه اولى ابتدائي',
      'أولى ابتدائي',
      'اولى ابتدائي',
      'الصف الأول الابتدائي',
      '1 ابتدائي',
      '1 ابتدائى',
      'أولى ابتدائى',
      'اولى ابتدائى',
      'الصف الاول الابتدائى',
      'الصف الاول الابتدائي'
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
 * 3. If no match found, PRESERVE the given targetId so custom stages don't collapse into sec-3!
 */
export function normalizeStageId(targetId, stageName = '') {
  if (!targetId && !stageName) return '';

  const raw = `${targetId || ''} ${stageName || ''}`.toLowerCase().trim();
  if (!raw) return targetId || '';

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
    .replace(/ى/g, 'ي')
    .replace(/ث/g, 'ت')
    .replace(/[َُِّْ]/g, '')
    .trim();

  for (const item of allAliases) {
    const cleanAlias = item.alias
      .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ث/g, 'ت')
    .replace(/[َُِّْ]/g, '')
      .trim();

    if (cleanRaw === cleanAlias) {
      return item.stageId;
    }

    // Do not let generic short tags (pri, prep, sec) swallow specific unmapped numbered IDs (e.g. pri-99)
    if (/^[a-z]+-[0-9]+$/i.test(cleanRaw) && cleanRaw !== cleanAlias) {
      continue;
    }

    // Match short tags as whole word boundaries to prevent substring clashes
    if (cleanAlias.length <= 4 && /^[a-z0-9]+$/i.test(cleanAlias)) {
      const boundaryRegex = new RegExp(`(^|\\s)${cleanAlias}($|\\s)`, 'i');
      if (boundaryRegex.test(cleanRaw)) {
        return item.stageId;
      }
    } else if (cleanRaw.includes(cleanAlias)) {
      return item.stageId;
    }
  }

  // Preserve the specific ID instead of blindly forcing sec-3
  return targetId || '';
}

/**
 * Get human readable Arabic stage name from canonical ID
 */
export function getStageTitle(stageId) {
  const norm = normalizeStageId(stageId);
  const found = STAGE_DEFINITIONS.find(s => s.id === norm);
  return found ? found.title : (stageId || 'المرحلة الدراسية');
}
