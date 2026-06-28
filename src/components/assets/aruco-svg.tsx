export function ArucoSVG({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const cells = Array.from({ length: 36 }).map(() => {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return h % 2;
  });
  return (
    <svg viewBox="0 0 8 8" className="size-full">
      <rect width="8" height="8" fill="#000" />
      <rect x="1" y="1" width="6" height="6" fill="#fff" />
      {cells.map((v, i) => {
        const x = 1 + (i % 6);
        const y = 1 + Math.floor(i / 6);
        return v === 0 ? (
          <rect key={i} x={x} y={y} width="1" height="1" fill="#000" />
        ) : null;
      })}
    </svg>
  );
}
