'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletModal from './WalletModal';

export default function Navbar() {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number>(100.0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance ?? 100.0);
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 3000);

    const handleExecuted = (e: any) => {
      if (e.detail?.remainingBalance !== undefined) {
        setBalance(e.detail.remainingBalance);
      } else {
        fetchBalance();
      }
    };

    window.addEventListener('orchestra:tool-executed', handleExecuted);
    return () => {
      clearInterval(interval);
      window.removeEventListener('orchestra:tool-executed', handleExecuted);
    };
  }, []);

  const syncExtension = () => {
    setSyncStatus('Syncing...');
    window.dispatchEvent(new CustomEvent('orchestra:refresh-request'));
    
    const chromeObj = typeof window !== 'undefined' ? (window as any).chrome : undefined;
    if (chromeObj && chromeObj.runtime?.sendMessage) {
      try {
        chromeObj.runtime.sendMessage({
          type: "ORCHESTRA_MARKETPLACE_SYNC",
          payload: { walletBalance: balance, tools: [] }
        }, () => {
          setSyncStatus('Synced!');
          setTimeout(() => setSyncStatus(null), 2000);
        });
        return;
      } catch (e) {}
    }

    setTimeout(() => {
      setSyncStatus('Extension Synced');
      setTimeout(() => setSyncStatus(null), 2000);
    }, 400);
  };

  const navLinks = [
    { name: 'Marketplace', href: '/' },
    { name: 'Dashboard / Ledger', href: '/dashboard' },
    { name: 'Multi-Agent Roster', href: '/roster' },
    { name: 'Dev Studio & Evals', href: '/studio' },
    { name: 'IDE Bridge', href: '/ide-bridge' },
    { name: 'Target Demo', href: '/demo-target' },
  ];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-200">
                O
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    Orchestra
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  Client-Side Agent Marketplace
                </span>
              </div>
            </Link>

            {/* Nav Menu */}
            <nav className="hidden md:flex items-center space-x-1 pl-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Extension Sync + Wallet Indicator */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Sync Extension Pill */}
            <button
              onClick={syncExtension}
              title="Sync with Chrome Extension & active DOM sessions"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-800/50 text-xs font-mono transition-all"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${syncStatus ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`}></span>
              <span>{syncStatus || 'Sync Runtime'}</span>
            </button>

            {/* Wallet Balance Pill */}
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="flex items-center space-x-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 px-3.5 py-1.5 rounded-full font-mono text-xs sm:text-sm shadow-inner transition-all group"
            >
              <span className={`h-2 w-2 rounded-full ${balance > 0 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'} animate-pulse`}></span>
              <span className="text-slate-400 text-xs font-sans group-hover:text-slate-200">Wallet:</span>
              <span className="text-cyan-400 font-bold tracking-wider">{balance.toFixed(2)} CR</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded font-sans font-bold border border-cyan-800/50">
                + Top Up
              </span>
            </button>

            {/* Mobile Nav Links Dropdown Indicator */}
            <div className="md:hidden flex space-x-1">
              <Link href="/dashboard" className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-xs">
                Ledger
              </Link>
              <Link href="/demo-target" className="p-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs">
                Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Wallet Top-Up & Circuit Breaker Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        currentBalance={balance}
        onRefilled={(newBal) => setBalance(newBal)}
      />
    </>
  );
}
