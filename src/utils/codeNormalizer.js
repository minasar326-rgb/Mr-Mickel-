/**
 * Normalizes activation codes entered on mobile phones, tablets, iPads, and PCs.
 * 
 * Handles:
 * 1. Eastern Arabic Numerals: ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ -> 0 1 2 3 4 5 6 7 8 9
 * 2. Persian / Urdu Numerals: ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹ -> 0 1 2 3 4 5 6 7 8 9
 * 3. Invisible Unicode formatting marks: LTR/RTL marks (\u200E, \u200F), zero-width spaces (\u200B-\u200D, \uFEFF)
 * 4. Leading/trailing whitespace and hyphens
 */
export function normalize10DigitCode(input) {
  if (!input) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let str = String(input).trim();
  for (let i = 0; i < 10; i++) {
    str = str.replaceAll(arabicDigits[i], String(i));
    str = str.replaceAll(persianDigits[i], String(i));
  }
  
  // Remove invisible formatting characters, RTL/LTR marks, and whitespace
  return str.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\s-]/g, '').toUpperCase();
}
