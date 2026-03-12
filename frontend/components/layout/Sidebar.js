'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const models = [
  { key: 'mm1', label: 'M/M/1 Queue' },
  { key: 'mg1', label: 'M/G/1 Queue' },
  { key: 'gg1', label: 'G/G/1 Queue' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isQueueActive = pathname.startsWith('/queue');
  const [queueOpen, setQueueOpen] = useState(isQueueActive);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep submenu open when navigating to queue pages
  useEffect(() => {
    if (isQueueActive) setQueueOpen(true);
  }, [isQueueActive]);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className='mobile-toggle'
        onClick={() => setMobileOpen((o) => !o)}
        aria-label='Toggle sidebar'
      >
        ☰
      </button>

      <div
        className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}
        id='sidebar'
      >
        {/* Header */}
        <div className='sidebar-header'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className='sidebar-title' style={{ margin: 0 }}>
              ⚗️
              <Link href='/'>DL Sim</Link>
            </div>
            {/* Close button — visible on mobile only via CSS */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label='Close sidebar'
              className='sidebar-close-btn'
            >
              ✕
            </button>
          </div>
          <div className='sidebar-subtitle' style={{ marginTop: '0.4rem' }}>
            Lab Diagnostic
          </div>
        </div>

        {/* Queueing Models */}
        <div className='menu-section'>
          <div className='menu-label'>Analysis</div>

          <button
            className='menu-button'
            type='button'
            aria-expanded={queueOpen ? 'true' : 'false'}
            onClick={() => setQueueOpen((o) => !o)}
          >
            📊 Queueing Models
          </button>

          <div className={`submenu${queueOpen ? ' show' : ''}`}>
            {models.map(({ key, label }) => {
              const href = `/queue/${key}`;
              const active = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`submenu-link${active ? ' active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Simulator */}
        <div className='menu-section'>
          <div className='menu-label'>Tools</div>
          <button
            className='menu-button'
            type='button'
            onClick={() => alert('3D Simulator coming soon!')}
          >
            🧪 Simulator
          </button>
        </div>
      </div>
    </>
  );
}
