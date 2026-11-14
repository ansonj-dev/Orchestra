'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  { name: 'Home', href: '/' },
  { name: 'Agents', href: '/near' },
  { name: 'Marketplace', href: '/near#marketplace' },
  { name: 'NEAR Economy', href: '/near' },
  { name: 'Build', href: '/near#register' },
  { name: 'Docs', href: 'https://github.com/ansonj-dev/Orchestra#readme', external: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link href="/" className="brand" aria-label="Orchestra home"><span className="brand-word">ORCHESTRA</span></Link>
        <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'} aria-label="Main navigation">
          {links.map((link) => {
            const active = !link.external && pathname === link.href;
            return link.external
              ? <a key={link.name} href={link.href} target="_blank" rel="noreferrer" className="nav-link">{link.name}</a>
              : <Link key={link.name} href={link.href} onClick={() => setMenuOpen(false)} className={active ? 'nav-link active' : 'nav-link'}>{link.name}</Link>;
          })}
        </nav>
        <div className="nav-actions">
          <span className="network-pill"><span /> NEAR TESTNET <b>⌄</b></span>
          <Link href="/near" className="wallet-link"><span>▣</span> CONNECT WALLET</Link>
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? '✕' : '☰'}</button>
        </div>
      </div>
    </header>
  );
}
