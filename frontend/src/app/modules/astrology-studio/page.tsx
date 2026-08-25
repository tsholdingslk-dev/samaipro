"use client";

export default function AstrologyStudio() {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 24px', background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Astrology Studio (Enterprise)</span>
          <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '10px', color: '#818cf8', textTransform: 'uppercase', fontWeight: 'bold' }}>Microservice Running</span>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        <iframe 
          src="http://localhost:3001" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Astrology Studio"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
