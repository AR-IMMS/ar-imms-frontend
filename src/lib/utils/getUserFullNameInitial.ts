export function getUserFullNameInitial(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  
  const firstLetter = words[0].charAt(0);
  const lastLetter = words[words.length - 1].charAt(0);
  
  return (firstLetter + lastLetter).toUpperCase();
}