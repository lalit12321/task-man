import { CSSProperties } from 'react';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic background based on name (so the same user always gets the same color)
const palette = ['#18181B', '#C2410C', '#047857', '#B45309', '#3F3F46', '#7C2D12'];
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ name, src, size = 28, className = '' }: AvatarProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.4)),
    backgroundColor: src ? undefined : colorFor(name || '??'),
  };

  if (src) {
    // Use plain img to avoid Next/Image domain config requirements
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={style}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full text-white grid place-items-center font-medium tabular ${className}`}
      aria-label={name}
    >
      {initials(name || '??')}
    </div>
  );
}
