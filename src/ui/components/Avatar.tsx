interface Props {
  name: string;
  photoUrl?: string | null;
  /** Premium members get a gold frame and a crown */
  premium?: boolean;
  size?: number;
  /** extra class for colour variants (bots) */
  className?: string;
  children?: React.ReactNode;
}

export function Crown({ size = 20 }: { size?: number }) {
  return (
    <svg className="crown" viewBox="0 0 64 44" width={size} height={(size * 44) / 64} aria-hidden>
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1b8" />
          <stop offset="0.45" stopColor="#f2c14e" />
          <stop offset="1" stopColor="#a8701a" />
        </linearGradient>
      </defs>
      <path
        d="M4 38 L8 12 L22 24 L32 4 L42 24 L56 12 L60 38 Z"
        fill="url(#crown-gold)"
        stroke="#6b4508"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="4" y="36" width="56" height="7" rx="2" fill="url(#crown-gold)" stroke="#6b4508" strokeWidth="2" />
      <circle cx="32" cy="4" r="3.5" fill="#e84855" stroke="#6b4508" strokeWidth="1.5" />
      <circle cx="8" cy="12" r="3" fill="#5aa9ff" stroke="#6b4508" strokeWidth="1.5" />
      <circle cx="56" cy="12" r="3" fill="#5aa9ff" stroke="#6b4508" strokeWidth="1.5" />
      <circle cx="32" cy="30" r="3.2" fill="#3ec7a0" stroke="#6b4508" strokeWidth="1.2" />
    </svg>
  );
}

export function Avatar({ name, photoUrl, premium, size = 34, className = '', children }: Props) {
  return (
    <div
      className={`avatar ${premium ? 'avatar--premium' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.46 }}
    >
      {photoUrl ? <img src={photoUrl} alt="" referrerPolicy="no-referrer" /> : Array.from(name)[0]?.toLocaleUpperCase('tr')}
      {premium && (
        <span className="avatar-premium-crown">
          <Crown size={size * 0.62} />
        </span>
      )}
      {children}
    </div>
  );
}
