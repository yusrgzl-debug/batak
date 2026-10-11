import { useEffect, useState } from 'react';

const wide = () => window.matchMedia('(min-width: 700px) and (min-height: 700px)').matches;

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  return <>{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</>;
}

/**
 * On a desktop browser the app is shown inside a phone frame (390×844, with status bar and home
 * indicator) so it can be tried exactly as on a phone. On a real phone it runs full screen.
 */
export function DeviceFrame({ children }: { children: React.ReactNode }) {
  const [framed, setFramed] = useState(wide);
  useEffect(() => {
    const on = () => setFramed(wide());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  if (!framed) return <>{children}</>;
  return (
    <div className="device-stage">
      <div className="device">
        <div className="device-screen">
          <div className="device-status" aria-hidden>
            <span>
              <Clock />
            </span>
            <span className="device-island" />
            <span className="device-icons">
              <svg viewBox="0 0 18 12" width="17" height="11">
                <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
                <rect x="5" y="5" width="3" height="7" rx="1" fill="currentColor" />
                <rect x="10" y="2.5" width="3" height="9.5" rx="1" fill="currentColor" />
                <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
              </svg>
              <svg viewBox="0 0 26 12" width="25" height="12">
                <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
                <rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor" />
                <rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
              </svg>
            </span>
          </div>
          {children}
          <div className="device-home" aria-hidden />
        </div>
      </div>
      <p className="device-hint">
        Telefon görünümü · Gerçek telefonda bu bağlantıyı açtığında oyun tam ekran çalışır.
      </p>
    </div>
  );
}
