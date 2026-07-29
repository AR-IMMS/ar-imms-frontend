export function parseToLocalDate(dateString: string | null): Date | null {
  if (!dateString || dateString === "N/A") return null;
  // Strip 'Z' or '+00:00' to force browser to parse as local time (preventing +7 timezone shift)
  const cleaned = dateString.replace(/Z$/, "").replace(/\+00:00$/, "");
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
}

export function formatToExactDateTime(dateString: string | null): string {
  const localDate = parseToLocalDate(dateString);
  if (!localDate) return "N/A";
  
  const pad = (n: number) => String(n).padStart(2, "0");
  const dd = pad(localDate.getDate());
  const MM = pad(localDate.getMonth() + 1);
  const yyyy = localDate.getFullYear();
  const HH = pad(localDate.getHours());
  const mm = pad(localDate.getMinutes());
  const ss = pad(localDate.getSeconds());

  return `${HH}:${mm}:${ss} - ${dd}/${MM}/${yyyy}`;
}