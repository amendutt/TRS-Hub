/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Storefront } from './components/storefront/Storefront';
import { AdminPortal } from './components/admin/AdminPortal';
import { db } from './services/mysqlMockDb';
import { loadPublicState } from './services/api';

export default function App() {
  const [currentAppMode, setCurrentAppMode] = useState<'storefront' | 'admin'>('storefront');
  const [isStoreLoaded, setIsStoreLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    loadPublicState()
      .then(snapshot => {
        if (isMounted && snapshot) db.importPublicSnapshot(snapshot);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsStoreLoaded(true);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#20241F]">
      {/* Top app switcher bar */}
      <div className="bg-[#15181A] text-white text-xs px-4 py-1.5 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[#D9A441] font-bold text-xs uppercase tracking-wider font-mono">
            TRS HUB
          </span>
          <span className="text-neutral-500 hidden sm:inline">|</span>
          <span className="text-neutral-300 hidden md:inline text-[11px]">
            Professional tech refresh storefront &amp; admin operations
          </span>
        </div>

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
      {!isStoreLoaded ? (
        <div className="min-h-[70vh] flex items-center justify-center text-sm text-[#666B62]" role="status">
          Loading store...
        </div>
      ) : currentAppMode === 'storefront' ? (
        <Storefront
          onOpenAdminPortal={() => setCurrentAppMode('admin')}
        />
      ) : (
        <AdminPortal
          initialTab="dashboard"
          onBackToStorefront={() => setCurrentAppMode('storefront')}
        />
      )}
    </div>
  );
}
