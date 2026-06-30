/**
 * Computes the Levenshtein distance between two strings.
 */
export const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
};

/**
 * Calculates string similarity percentage (0 to 1).
 */
export const getStringSimilarity = (a: string, b: string): number => {
  const str1 = a.trim().toLowerCase();
  const str2 = b.trim().toLowerCase();
  
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const maxLength = Math.max(str1.length, str2.length);
  const distance = getLevenshteinDistance(str1, str2);
  
  return (maxLength - distance) / maxLength;
};
