/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Storefront } from './components/storefront/Storefront';
import { AdminPortal } from './components/admin/AdminPortal';
import { db } from './services/mysqlMockDb';

export default function App() {
  const [currentAppMode, setCurrentAppMode] = useState<'storefront' | 'admin' | 'logo_studio'>('storefront');
  const [activeVersionTag, setActiveVersionTag] = useState<string>(db.getActiveVersion().versionTag);
  const [activeBrandName, setActiveBrandName] = useState<string>(db.getActiveVersion().config.brandName);

  useEffect(() => {
    const unsub = db.subscribe(() => {
      setActiveVersionTag(db.getActiveVersion().versionTag);
      setActiveBrandName(db.getActiveVersion().config.brandName);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#20241F]">
      {/* Top Floating Applet Switcher Bar (Quickly test Website vs Admin Portal vs Logo Technical Refresh) */}
      <div className="bg-[#15181A] text-white text-xs px-4 py-1.5 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[#D9A441] font-bold text-xs uppercase tracking-wider font-mono">
            {activeBrandName || 'TECH REFRESH SOLUTION'}
          </span>
          <span className="text-neutral-500 hidden sm:inline">|</span>
          <span className="text-neutral-300 hidden md:inline text-[11px]">
            Logo Technical Refresh Solution &amp; Multi-Category E-Commerce
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0F5257] text-[#D9A441] border border-[#0F5257]">
            Active Logo: {activeVersionTag}
          </span>
        </div>

        {/* Mode Switcher Tabs matching visual design text file (🛍️ Website / 🛠️ Admin Portal) */}
        <div className="flex items-center gap-1.5 bg-neutral-900 p-0.5 rounded-lg border border-neutral-700">
          <button
            onClick={() => setCurrentAppMode('storefront')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentAppMode === 'storefront'
                ? 'bg-[#0F5257] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🛍️ Storefront
          </button>

          <button
            onClick={() => setCurrentAppMode('logo_studio')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentAppMode === 'logo_studio'
                ? 'bg-[#D9A441] text-[#26210F] shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            ✨ Logo Refresh Studio (MySQL)
          </button>

          <button
            onClick={() => setCurrentAppMode('admin')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentAppMode === 'admin'
                ? 'bg-[#0F5257] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🛠️ Admin Portal
          </button>
        </div>
      </div>

      {/* View Rendering */}
      {currentAppMode === 'storefront' && (
        <Storefront
          onOpenAdminPortal={() => setCurrentAppMode('admin')}
          onOpenLogoStudio={() => setCurrentAppMode('logo_studio')}
        />
      )}

      {currentAppMode === 'admin' && (
        <AdminPortal
          initialTab="dashboard"
          onBackToStorefront={() => setCurrentAppMode('storefront')}
        />
      )}

      {currentAppMode === 'logo_studio' && (
        <AdminPortal
          initialTab="logo_studio"
          onBackToStorefront={() => setCurrentAppMode('storefront')}
        />
      )}
    </div>
  );
}
