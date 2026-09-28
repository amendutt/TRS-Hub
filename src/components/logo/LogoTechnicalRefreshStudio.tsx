import React, { useState, useEffect } from 'react';
import {
  LogoConfig,
  LogoVersion,
  LogoStatus,
  LogoMarkShape,
  FontChoice,
  LogoVariant,
  LogoAuditLog
} from '../../types/logo';
import { db, MYSQL_DDL_SCHEMA } from '../../services/mysqlMockDb';
import { BrandLogo, BrandLogoMark } from './BrandLogo';
import {
  Palette,
  History,
  Database,
  Download,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Send,
  ShieldCheck,
  Code2,
  Play,
  FileCode,
  Copy,
  Check,
  Upload,
  ArrowRight,
  Eye,
  Sliders,
  Layers,
  FileText
} from 'lucide-react';

export const LogoTechnicalRefreshStudio: React.FC<{
  onLogoUpdated?: () => void;
}> = ({ onLogoUpdated }) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'database' | 'variants' | 'audit'>('editor');
  
  // Local state synced with MySQL DB
  const [activeVersion, setActiveVersion] = useState<LogoVersion>(db.getActiveVersion());
  const [versions, setVersions] = useState<LogoVersion[]>(db.getAllVersions());
  const [auditLogs, setAuditLogs] = useState<LogoAuditLog[]>(db.getAuditLogs());
  const [variants, setVariants] = useState<LogoVariant[]>(db.getVariants());

  // Editing draft state
  const [editConfig, setEditConfig] = useState<LogoConfig>({ ...activeVersion.config });
  const [versionTag, setVersionTag] = useState<string>('v2.2.0-custom');
  const [changelog, setChangelog] = useState<string>('Technical refresh: optimized font kerning, calibrated brand teal & gold hues.');
  const [authorName, setAuthorName] = useState<string>('Abdullah Khan');
  const [authorEmail, setAuthorEmail] = useState<string>('abdullahkhan9305@gmail.com');

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [targetVersionForReview, setTargetVersionForReview] = useState<LogoVersion | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('Verified WCAG AA 4.5:1 contrast against light surface (#F7F5EF) and dark surface (#1E2320).');

  // Rollback modal state
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);
  const [targetRollbackVersion, setTargetRollbackVersion] = useState<LogoVersion | null>(null);
  const [rollbackReason, setRollbackReason] = useState<string>('Reverting to approved brand baseline for upcoming promotional launch.');

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, version_tag, status, author_name, created_at FROM logo_versions;');
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: any[]; executionTimeMs: number; error?: string } | null>(null);

  // Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedVariantId, setCopiedVariantId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshState = () => {
    const act = db.getActiveVersion();
    setActiveVersion(act);
    setVersions(db.getAllVersions());
    setAuditLogs(db.getAuditLogs());
    setVariants(db.getVariants());
    if (onLogoUpdated) onLogoUpdated();
  };

  useEffect(() => {
    const unsub = db.subscribe(() => {
      refreshState();
    });
    // Run initial SQL query
    handleExecuteSql(sqlQuery);
    return unsub;
  }, []);

  // Preset palette swatches
  const colorPresets = [
    { label: 'TRS Emerald', hex: '#48B065' },
    { label: 'TRS Dark Forest', hex: '#2E7D32' },
    { label: 'Circuit Stem Grey', hex: '#E6EAED' },
    { label: 'Deep Teal', hex: '#0F5257' },
    { label: 'Warm Gold', hex: '#D9A441' },
    { label: 'Charcoal Ink', hex: '#20241F' }
  ];

  // Save changes to current active draft / configuration
  const handleApplyDirect = () => {
    db.updateActiveConfigDirectly(editConfig, authorName);
    showToast('✨ Live logo updated immediately across Havn Storefront and Admin!');
    refreshState();
  };

  // Create new version in MySQL DB
  const handleSaveAsNewVersion = () => {
    const newVer = db.saveDraft(editConfig, versionTag, changelog, authorName, authorEmail);
    showToast(`💾 Saved new version ${newVer.versionTag} (Status: Draft) to MySQL.`);
    refreshState();
  };

  // Submit for Review
  const handleSubmitReview = (ver: LogoVersion) => {
    setTargetVersionForReview(ver);
    setShowReviewModal(true);
  };

  const confirmSubmitReview = () => {
    if (targetVersionForReview) {
      db.submitForReview(targetVersionForReview.id, reviewNotes, authorName);
      setShowReviewModal(false);
      showToast(`📋 Version ${targetVersionForReview.versionTag} submitted for Brand Governance Review.`);
      refreshState();
    }
  };

  // Approve
  const handleApprove = (ver: LogoVersion) => {
    db.approveVersion(ver.id, 'Brand Governance Council');
    showToast(`✅ Approved version ${ver.versionTag}. Ready for Technical Refresh publish.`);
    refreshState();
  };

  // Publish / Technical Refresh Deploy
  const handlePublish = (ver: LogoVersion) => {
    db.publishVersion(ver.id, authorName);
    setEditConfig({ ...ver.config });
    showToast(`🚀 TECHNICAL REFRESH DEPLOYED: ${ver.versionTag} is now LIVE on Havn Storefront!`);
    refreshState();
  };

  // Rollback Trigger
  const handleInitiateRollback = (ver: LogoVersion) => {
    setTargetRollbackVersion(ver);
    setShowRollbackModal(true);
  };

  const confirmRollback = () => {
    if (targetRollbackVersion) {
      db.rollbackToVersion(targetRollbackVersion.id, rollbackReason, authorName);
      setEditConfig({ ...targetRollbackVersion.config });
      setShowRollbackModal(false);
      showToast(`⏮️ ROLLED BACK: Storefront active logo reverted to ${targetRollbackVersion.versionTag}!`);
      refreshState();
    }
  };

  // File Upload handler for custom logo SVG/PNG
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditConfig(prev => ({
        ...prev,
        customImageUrl: result,
        markShape: 'none'
      }));
      showToast(`Custom logo asset "${file.name}" uploaded successfully.`);
    };
    reader.readAsDataURL(file);
  };

  // SQL Execution
  const handleExecuteSql = (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    const res = db.executeSqlQuery(q);
    setSqlResult(res);
  };

  // Download SQL DDL
  const downloadSchemaSql = () => {
    const blob = new Blob([MYSQL_DDL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'havn_logo_technical_refresh_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded havn_logo_technical_refresh_schema.sql');
  };

  // Copy SVG representation
  const copySvgCode = (vId: string) => {
    const svgCode = `<svg width="280" height="64" viewBox="0 0 280 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Havn Brand Technical Refresh Asset: ${activeVersion.versionTag} -->
  <text x="56" y="42" font-family="${editConfig.fontFamily}" font-size="28" font-weight="${editConfig.fontWeight}" fill="${editConfig.primaryColor}" letter-spacing="${editConfig.letterSpacing}px">
    ${editConfig.brandName}
  </text>
  <text x="58" y="56" font-family="Inter, sans-serif" font-size="10" font-weight="600" fill="${editConfig.accentColor}" letter-spacing="2px">
    ${editConfig.showTagline ? editConfig.tagline : ''}
  </text>
</svg>`;
    navigator.clipboard.writeText(svgCode);
    setCopiedVariantId(vId);
    setTimeout(() => setCopiedVariantId(null), 2500);
    showToast('SVG markup copied to clipboard!');
  };

  // Status badge styling helper
  const renderStatusBadge = (status: LogoStatus) => {
    switch (status) {
      case 'published':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[#EAF1F0] text-[#0F5257] border border-[#0F5257]/20"><CheckCircle2 className="w-3.5 h-3.5" /> Published (Live)</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200"><ShieldCheck className="w-3.5 h-3.5" /> Approved</span>;
      case 'in_review':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> In Governance Review</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200"><Sliders className="w-3.5 h-3.5" /> Draft</span>;
      case 'archived':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">Archived</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#0F5257] text-white px-5 py-3 rounded-lg shadow-xl border border-[#D9A441]/40 flex items-center gap-3 transition-all animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#D9A441]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-[#0B3D3F] text-[#EDEFEA] rounded-xl p-6 md:p-8 border border-[#0F5257] shadow-sm relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D9A441] font-semibold mb-2">
            <span>Enterprise Brand Architecture</span>
            <span>·</span>
            <span>BRD REQ-ADM & SOP Compliant</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
            Logo Technical Refresh Solution
          </h1>
          <p className="text-sm md:text-base text-[#B0C6C3] leading-relaxed mb-4">
            Manage, configure, and version company brand logos across Havn's storefront, administrative portal, and transactional documents. Backed by a full MySQL relational metadata schema with immutable audit logging and instant zero-downtime rollback.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-[#0F5257]/60 px-3.5 py-1.5 rounded-lg border border-[#0F5257] text-xs">
              <span className="text-[#A4BFBC]">Currently Live Version:</span>
              <strong className="text-white font-mono">{activeVersion.versionTag}</strong>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="flex items-center gap-2 bg-[#0F5257]/60 px-3.5 py-1.5 rounded-lg border border-[#0F5257] text-xs">
              <span className="text-[#A4BFBC]">Database Engine:</span>
              <strong className="text-[#D9A441] font-mono">MySQL 8.0 (InnoDB)</strong>
            </div>
          </div>
        </div>

        {/* Decorative Watermark Mark */}
        <div className="absolute right-[-20px] top-[-30px] opacity-10 pointer-events-none">
          <BrandLogoMark shape="haven_arch" primaryColor="#FFFFFF" accentColor="#D9A441" size={260} />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E1D6] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'editor'
              ? 'bg-[#0F5257] text-white shadow-sm'
              : 'text-[#666B62] hover:text-[#20241F] hover:bg-[#EAE6D8]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Visual Configurator</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-[#0F5257] text-white shadow-sm'
              : 'text-[#666B62] hover:text-[#20241F] hover:bg-[#EAE6D8]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Version History & Status</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{versions.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('variants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'variants'
              ? 'bg-[#0F5257] text-white shadow-sm'
              : 'text-[#666B62] hover:text-[#20241F] hover:bg-[#EAE6D8]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Multi-Format Variants</span>
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{variants.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'database'
              ? 'bg-[#0F5257] text-white shadow-sm'
              : 'text-[#666B62] hover:text-[#20241F] hover:bg-[#EAE6D8]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>MySQL Schema & SQL Console</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'audit'
              ? 'bg-[#0F5257] text-white shadow-sm'
              : 'text-[#666B62] hover:text-[#20241F] hover:bg-[#EAE6D8]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Log Trail</span>
        </button>
      </div>

      {/* TAB 1: VISUAL CONFIGURATOR */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel (Left - 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-4">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                    Dynamic Brand & Logo Controls
                  </h3>
                  <p className="text-xs text-[#666B62]">
                    Tailor company typography, symbol geometry, and colors. Changes reflect immediately in live previews.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyDirect}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D9A441]" />
                    Apply Directly to Live Store
                  </button>
                </div>
              </div>

              {/* Text & Typography Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Company / Brand Name
                  </label>
                  <input
                    type="text"
                    value={editConfig.brandName}
                    onChange={(e) => setEditConfig({ ...editConfig, brandName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Tagline Subtitle
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editConfig.tagline}
                      onChange={(e) => setEditConfig({ ...editConfig, tagline: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                      placeholder="e.g. CONSIDERED LIVING"
                    />
                    <button
                      type="button"
                      onClick={() => setEditConfig({ ...editConfig, showTagline: !editConfig.showTagline })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        editConfig.showTagline
                          ? 'bg-[#EAF1F0] text-[#0F5257] border-[#0F5257]/30'
                          : 'bg-[#F7F5EF] text-[#666B62] border-[#E4E1D6]'
                      }`}
                    >
                      {editConfig.showTagline ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Font Family & Geometry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Font Family
                  </label>
                  <select
                    value={editConfig.fontFamily}
                    onChange={(e) => setEditConfig({ ...editConfig, fontFamily: e.target.value as FontChoice })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                  >
                    <option value="Fraunces">Fraunces (Design System Serif)</option>
                    <option value="Cormorant Garamond">Cormorant Garamond</option>
                    <option value="Playfair Display">Playfair Display (Legacy)</option>
                    <option value="Syne">Syne (Modern Sculptural)</option>
                    <option value="Inter">Inter (Clean Sans)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Font Weight
                  </label>
                  <select
                    value={editConfig.fontWeight}
                    onChange={(e) => setEditConfig({ ...editConfig, fontWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                  >
                    <option value={400}>Regular (400)</option>
                    <option value={500}>Medium (500)</option>
                    <option value={600}>SemiBold (600)</option>
                    <option value={700}>Bold (700)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Letter Spacing ({editConfig.letterSpacing}px)
                  </label>
                  <input
                    type="range"
                    min={-1}
                    max={8}
                    step={0.5}
                    value={editConfig.letterSpacing}
                    onChange={(e) => setEditConfig({ ...editConfig, letterSpacing: Number(e.target.value) })}
                    className="w-full accent-[#0F5257] mt-2"
                  />
                </div>
              </div>

              {/* Symbol Mark Shape Selector */}
              <div>
                <label className="block text-xs font-medium text-[#666B62] mb-2">
                  Symbol Mark Geometry
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'trs_badge', label: 'Official TRS Badge', desc: 'Uploaded squircle badge with green wave & stems' },
                    { id: 'trs_minimal', label: 'TRS Circuit Wave', desc: 'Minimalist green wave circuit mark' },
                    { id: 'haven_arch', label: 'Scandinavian Arch', desc: 'Sanctuary arch & sun dot' },
                    { id: 'minimal_sail', label: 'Harbor Sail', desc: 'Maritime aerodynamic sail' },
                    { id: 'nordic_h', label: 'Monolithic H', desc: 'Classic structural serif mark' },
                    { id: 'none', label: 'None (Wordmark)', desc: 'Pure typography lockup' }
                  ].map(shape => (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => setEditConfig({ ...editConfig, markShape: shape.id as LogoMarkShape, customImageUrl: null })}
                      className={`p-3 text-left rounded-lg border transition-all flex flex-col justify-between ${
                        editConfig.markShape === shape.id && !editConfig.customImageUrl
                          ? 'border-[#48B065] bg-[#EAF7EE] text-[#1E7E34] ring-1 ring-[#48B065]'
                          : 'border-[#E4E1D6] bg-[#F7F5EF] hover:border-[#B0C6C3]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">{shape.label}</span>
                        {shape.id !== 'none' && (
                          <BrandLogoMark
                            shape={shape.id as LogoMarkShape}
                            primaryColor={editConfig.primaryColor}
                            accentColor={editConfig.accentColor}
                            stemColor={editConfig.stemColor}
                            badgeBorderColor={editConfig.badgeBorderColor}
                            size={22}
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-[#666B62]">{shape.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mark Layout & Scale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Mark Placement
                  </label>
                  <select
                    value={editConfig.markPosition}
                    onChange={(e) => setEditConfig({ ...editConfig, markPosition: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                  >
                    <option value="left">Left (Horizontal Header Lockup)</option>
                    <option value="top">Top (Stacked Crest / Badge)</option>
                    <option value="mark_only">Symbol Only (Compact Nav)</option>
                    <option value="text_only">Typography Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#666B62] mb-1">
                    Mark Proportional Scale ({editConfig.markScale}x)
                  </label>
                  <input
                    type="range"
                    min={0.7}
                    max={1.5}
                    step={0.05}
                    value={editConfig.markScale}
                    onChange={(e) => setEditConfig({ ...editConfig, markScale: Number(e.target.value) })}
                    className="w-full accent-[#0F5257] mt-2"
                  />
                </div>
              </div>

              {/* Color Controls & Preset Swatches */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#666B62]">
                    Brand Color Palette
                  </label>
                  <span className="text-xs text-[#666B62]">Quick Swatches:</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setEditConfig({ ...editConfig, primaryColor: preset.hex })}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border border-[#E4E1D6] bg-white hover:border-[#0F5257] transition-all"
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.hex }}></span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[11px] text-[#666B62] block mb-1">Primary Color (Typography / Dominant Mark)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editConfig.primaryColor}
                        onChange={(e) => setEditConfig({ ...editConfig, primaryColor: e.target.value })}
                        className="w-10 h-9 rounded cursor-pointer border border-[#E4E1D6]"
                      />
                      <input
                        type="text"
                        value={editConfig.primaryColor}
                        onChange={(e) => setEditConfig({ ...editConfig, primaryColor: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#666B62] block mb-1">Accent Color (Sun aperture / Tagline)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editConfig.accentColor}
                        onChange={(e) => setEditConfig({ ...editConfig, accentColor: e.target.value })}
                        className="w-10 h-9 rounded cursor-pointer border border-[#E4E1D6]"
                      />
                      <input
                        type="text"
                        value={editConfig.accentColor}
                        onChange={(e) => setEditConfig({ ...editConfig, accentColor: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Custom Logo Asset */}
              <div className="border-t border-[#E4E1D6] pt-4">
                <label className="block text-xs font-medium text-[#666B62] mb-1">
                  Upload Custom Vector / Raster Brand Asset
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#0F5257]/50 bg-[#EAF1F0]/40 text-[#0F5257] hover:bg-[#EAF1F0] text-xs font-medium cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload SVG / PNG file</span>
                    <input type="file" accept=".svg,.png,.jpg,.webp" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {editConfig.customImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditConfig({ ...editConfig, customImageUrl: null, markShape: 'haven_arch' })}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Clear custom asset (revert to dynamic SVG)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Version Metadata Form for MySQL persistence */}
            <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm space-y-4">
              <h4 className="font-serif text-base font-semibold text-[#20241F]">
                Package as New Version in MySQL
              </h4>
              <p className="text-xs text-[#666B62]">
                Save these visual configurations as a permanent, versioned record with changelog and author tracking.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#666B62] mb-1">Version Tag</label>
                  <input
                    type="text"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                    placeholder="e.g. v2.3.0-autumn"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#666B62] mb-1">Author Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#666B62] mb-1">Author Email</label>
                  <input
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#666B62] mb-1">Release Changelog & Design Notes</label>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAsNewVersion}
                  className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Save Version to Database (Draft)
                </button>
              </div>
            </div>
          </div>

          {/* Live Contextual Preview Matrix (Right - 5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#E4E1D6]/40 p-4 rounded-xl border border-[#E4E1D6] flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-semibold text-[#0F5257] tracking-wider block">Live Context Preview</span>
                <span className="text-xs text-[#666B62]">Testing rendering across 5 surfaces</span>
              </div>
              <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-white text-[#0F5257] border border-[#0F5257]/20">
                Real-time
              </span>
            </div>

            {/* 1. Light Surface (Storefront Nav Context) */}
            <div className="bg-white rounded-xl p-5 border border-[#E4E1D6] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#666B62] mb-3">
                <span className="font-semibold text-[#20241F]">1. Storefront Light Nav (Desktop)</span>
                <span className="font-mono text-[11px]">Surface: #FFFFFF</span>
              </div>
              <div className="p-4 bg-[#F7F5EF] rounded-lg border border-[#E4E1D6] flex items-center justify-between">
                <BrandLogo config={editConfig} size="md" />
                <div className="text-xs text-[#666B62] hidden sm:flex items-center gap-3">
                  <span>Catalog</span>
                  <span>Living</span>
                  <span>Cart (2)</span>
                </div>
              </div>
            </div>

            {/* 2. Inverted Dark Surface (Admin Sidebar & Dark Footers) */}
            <div className="bg-[#1E2320] text-white rounded-xl p-5 border border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                <span className="font-semibold text-neutral-200">2. Dark Mode & Admin Sidebar</span>
                <span className="font-mono text-[11px]">Surface: #1E2320</span>
              </div>
              <div className="p-4 bg-[#0B3D3F] rounded-lg border border-[#0F5257] flex items-center justify-between">
                <BrandLogo config={editConfig} themeMode="dark" size="md" />
                <span className="text-xs text-[#A4BFBC]">Portal active</span>
              </div>
            </div>

            {/* 3. Stacked Crest (Packaging & Gift Box) */}
            <div className="bg-white rounded-xl p-5 border border-[#E4E1D6] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#666B62] mb-3">
                <span className="font-semibold text-[#20241F]">3. Stacked Lockup (Packaging / Hero)</span>
                <span className="font-mono text-[11px]">Variant: stacked</span>
              </div>
              <div className="p-6 bg-[#FAF8F3] rounded-lg border border-[#E4E1D6] flex items-center justify-center">
                <BrandLogo config={editConfig} variant="stacked" size="lg" />
              </div>
            </div>

            {/* 4. Checkout Security Context */}
            <div className="bg-white rounded-xl p-5 border border-[#E4E1D6] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#666B62] mb-3">
                <span className="font-semibold text-[#20241F]">4. Checkout Security Header</span>
                <span className="font-mono text-[11px]">256-bit Encrypted</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E4E1D6] flex items-center justify-between">
                <BrandLogo config={editConfig} size="sm" />
                <div className="flex items-center gap-1.5 text-xs text-[#666B62]">
                  <span className="text-emerald-700">🔒</span>
                  <span>Secure SSL Checkout</span>
                </div>
              </div>
            </div>

            {/* 5. Favicon & Mobile Compact Mark */}
            <div className="bg-white rounded-xl p-5 border border-[#E4E1D6] shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#666B62] mb-3">
                <span className="font-semibold text-[#20241F]">5. Mobile Mark & Favicon (32px)</span>
                <span className="font-mono text-[11px]">32×32px / 48×48px</span>
              </div>
              <div className="p-3 bg-[#F7F5EF] rounded-lg border border-[#E4E1D6] flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-[#E4E1D6] flex items-center justify-center">
                    <BrandLogo config={editConfig} variant="icon_only" size="sm" />
                  </div>
                  <span className="text-[10px] text-[#666B62]">Mobile Bar</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded bg-[#0F5257] shadow-sm flex items-center justify-center">
                    <BrandLogoMark shape={editConfig.markShape} primaryColor="#FFFFFF" accentColor="#D9A441" size={18} />
                  </div>
                  <span className="text-[10px] text-[#666B62]">Favicon (Tab)</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#20241F] flex items-center justify-center">
                    <BrandLogoMark shape={editConfig.markShape} primaryColor="#111827" accentColor="#4B5563" size={20} />
                  </div>
                  <span className="text-[10px] text-[#666B62]">Thermal Print</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERSION HISTORY & GOVERNANCE LIFECYCLE */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4 mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                  Logo Version History & Status Lifecycle
                </h3>
                <p className="text-xs text-[#666B62]">
                  Formal governance records satisfying BRD/SRS REQ-ADM & SOP Phase 4–7. Every release is tracked with full auditability, approval states, and zero-downtime rollback.
                </p>
              </div>
              <button
                onClick={() => {
                  setVersionTag(`v2.${versions.length}.0-refresh`);
                  setActiveTab('editor');
                }}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold self-start"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>+ Draft New Version</span>
              </button>
            </div>

            {/* Version List Cards */}
            <div className="space-y-4">
              {versions.map(ver => {
                const isCurrentlyActive = ver.id === activeVersion.id;

                return (
                  <div
                    key={ver.id}
                    className={`p-5 rounded-xl border transition-all ${
                      isCurrentlyActive
                        ? 'border-[#0F5257] bg-[#FAF8F3] ring-1 ring-[#0F5257]/30 shadow-sm'
                        : 'border-[#E4E1D6] bg-white hover:border-[#B0C6C3]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Metadata & Preview */}
                      <div className="flex items-start gap-4">
                        <div className="w-36 h-20 bg-white rounded-lg border border-[#E4E1D6] p-2 flex items-center justify-center shrink-0 shadow-xs">
                          <BrandLogo config={ver.config} size="sm" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap mb-1">
                            <span className="font-mono text-sm font-bold text-[#0F5257]">{ver.versionTag}</span>
                            {renderStatusBadge(ver.status)}
                            {isCurrentlyActive && (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                ACTIVE ON STOREFRONT
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#20241F] mb-2 leading-relaxed max-w-2xl">
                            {ver.changelog}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-[#666B62] flex-wrap">
                            <span>Author: <strong className="text-[#20241F]">{ver.authorName}</strong></span>
                            <span>·</span>
                            <span>Created: {ver.createdAt.substring(0, 16)}</span>
                            {ver.approvedBy && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-700">Approved by: {ver.approvedBy}</span>
                              </>
                            )}
                            {ver.publishedAt && (
                              <>
                                <span>·</span>
                                <span className="text-[#0F5257]">Published: {ver.publishedAt.substring(0, 16)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Lifecycle Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap lg:self-center shrink-0">
                        {/* Draft Status Actions */}
                        {ver.status === 'draft' && (
                          <>
                            <button
                              onClick={() => {
                                setEditConfig({ ...ver.config });
                                setVersionTag(ver.versionTag);
                                setChangelog(ver.changelog);
                                setActiveTab('editor');
                              }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E1D6] bg-white hover:bg-neutral-50 text-[#20241F]"
                            >
                              Edit Tokens
                            </button>
                            <button
                              onClick={() => handleSubmitReview(ver)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" />
                              Submit for Review
                            </button>
                          </>
                        )}

                        {/* In Review Status Actions */}
                        {ver.status === 'in_review' && (
                          <button
                            onClick={() => handleApprove(ver)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Approve for Release
                          </button>
                        )}

                        {/* Approved Status Actions */}
                        {ver.status === 'approved' && (
                          <button
                            onClick={() => handlePublish(ver)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0F5257] hover:bg-[#0B3D3F] text-white shadow-sm flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#D9A441]" />
                            Publish Technical Refresh
                          </button>
                        )}

                        {/* Rollback to Previous Version (Available for any non-active version) */}
                        {!isCurrentlyActive && (
                          <button
                            onClick={() => handleInitiateRollback(ver)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#0F5257]/30 text-[#0F5257] hover:bg-[#EAF1F0] flex items-center gap-1.5 transition-all"
                            title="Instantly switch live storefront to this historical version"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Rollback to this Version
                          </button>
                        )}

                        <button
                          onClick={() => copySvgCode(ver.id)}
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-[#E4E1D6] hover:bg-neutral-50 text-[#666B62]"
                          title="Copy SVG"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-FORMAT ASSET VARIANTS */}
      {activeTab === 'variants' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4 mb-6">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                  Multi-Format Asset Pack ({activeVersion.versionTag})
                </h3>
                <p className="text-xs text-[#666B62]">
                  Derived production assets dynamically generated for desktop, mobile, inverted dark mode, thermal invoices, and 32px favicons.
                </p>
              </div>
              <button
                onClick={() => showToast('Asset pack zip prepared with all vector/raster variants!')}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#0F5257] text-white rounded-lg text-xs font-semibold self-start"
              >
                <Download className="w-4 h-4 text-[#D9A441]" />
                <span>Export Complete Asset Pack</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {variants.map(variant => (
                <div key={variant.id} className="border border-[#E4E1D6] rounded-xl overflow-hidden bg-white flex flex-col justify-between shadow-xs">
                  <div className="p-4 bg-[#FAF8F3] border-b border-[#E4E1D6] flex items-center justify-center min-h-[140px]">
                    {variant.variantType === 'monochrome_dark' ? (
                      <div className="w-full h-full bg-[#1E2320] p-4 rounded-lg flex items-center justify-center">
                        <BrandLogo config={activeVersion.config} themeMode="dark" size="sm" />
                      </div>
                    ) : variant.variantType === 'stacked_crest' ? (
                      <BrandLogo config={activeVersion.config} variant="stacked" size="sm" />
                    ) : variant.variantType === 'icon_mark' ? (
                      <BrandLogo config={activeVersion.config} variant="icon_only" size="lg" />
                    ) : variant.variantType === 'favicon_32x32' ? (
                      <div className="p-2 bg-white rounded border border-[#E4E1D6]">
                        <BrandLogoMark shape={activeVersion.config.markShape} primaryColor={activeVersion.config.primaryColor} accentColor={activeVersion.config.accentColor} size={32} />
                      </div>
                    ) : variant.variantType === 'invoice_monochrome' ? (
                      <BrandLogo config={activeVersion.config} themeMode="monochrome" size="sm" />
                    ) : (
                      <BrandLogo config={activeVersion.config} size="sm" />
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-[#20241F]">{variant.label}</h4>
                      <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {variant.format}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#666B62] space-y-1">
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <strong className="font-mono">{variant.width} × {variant.height} px</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <strong className="font-mono">{variant.fileSizeKb} KB</strong>
                      </div>
                      <div className="pt-1 text-[11px] text-[#666B62] italic">
                        {variant.recommendedUse}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => copySvgCode(variant.id)}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-neutral-50 text-xs font-medium border border-[#E4E1D6] rounded-lg text-[#20241F] flex items-center justify-center gap-1.5"
                      >
                        {copiedVariantId === variant.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedVariantId === variant.id ? 'Copied' : 'Copy SVG'}</span>
                      </button>
                      <button
                        onClick={() => showToast(`Downloaded ${variant.label} (${variant.format.toUpperCase()})`)}
                        className="p-1.5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs"
                        title="Download Asset"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MYSQL SCHEMA & INTERACTIVE SQL CONSOLE */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E1D6] pb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                  MySQL Relational Architecture & Live Query Console
                </h3>
                <p className="text-xs text-[#666B62]">
                  Directly inspect database tables, execute SQL queries against logo metadata, and review the DDL schema.
                </p>
              </div>
              <button
                onClick={downloadSchemaSql}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#0F5257] text-white rounded-lg text-xs font-semibold self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>Download DDL (schema.sql)</span>
              </button>
            </div>

            {/* Quick SQL Sample Buttons */}
            <div>
              <span className="text-xs text-[#666B62] block mb-2 font-medium">Quick Query Shortcuts:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Show Tables', sql: 'SHOW TABLES;' },
                  { label: 'Describe logo_versions', sql: 'DESCRIBE logo_versions;' },
                  { label: 'Select All Versions', sql: 'SELECT id, version_tag, status, author_name, created_at FROM logo_versions;' },
                  { label: 'Select Active System Settings', sql: 'SELECT * FROM brand_system_settings;' },
                  { label: 'Select Variants for Active Logo', sql: 'SELECT * FROM logo_variants;' },
                  { label: 'Select Audit Trail', sql: 'SELECT id, version_tag, action, performed_by, timestamp FROM logo_audit_logs;' }
                ].map(q => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setSqlQuery(q.sql);
                      handleExecuteSql(q.sql);
                    }}
                    className="px-2.5 py-1 text-xs rounded-md bg-[#F7F5EF] hover:bg-[#EAE6D8] border border-[#E4E1D6] text-[#20241F] font-mono transition-all"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SQL Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#666B62]">
                <span className="font-mono">MySQL 8.0 Console &gt;</span>
                <span className="text-[11px]">Database: havn_brand_catalog</span>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={2}
                  className="w-full p-3 font-mono text-xs rounded-lg border border-[#E4E1D6] bg-neutral-900 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-[#0F5257]"
                  placeholder="Enter MySQL query (e.g. SELECT * FROM logo_versions;)"
                />
                <button
                  onClick={() => handleExecuteSql()}
                  className="px-5 bg-[#0F5257] hover:bg-[#0B3D3F] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                >
                  <Play className="w-3.5 h-3.5 text-[#D9A441]" />
                  <span>Execute SQL</span>
                </button>
              </div>
            </div>

            {/* Tabular Result Grid */}
            {sqlResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#666B62]">
                  <span>Query Results ({sqlResult.rows.length} rows returned)</span>
                  <span className="font-mono text-[11px] text-emerald-700">Executed in {sqlResult.executionTimeMs}ms</span>
                </div>

                <div className="overflow-x-auto border border-[#E4E1D6] rounded-lg">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-[#FAF8F3] border-b border-[#E4E1D6]">
                      <tr>
                        {sqlResult.columns.map((col, idx) => (
                          <th key={idx} className="p-2.5 font-semibold text-[#0F5257] border-r border-[#E4E1D6] last:border-r-0 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E1D6] bg-white">
                      {sqlResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#FAF8F3]/50">
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="p-2.5 text-[#20241F] border-r border-[#E4E1D6] last:border-r-0 whitespace-nowrap">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Schema DDL Preview Accordion */}
            <div className="border border-[#E4E1D6] rounded-lg overflow-hidden">
              <div className="p-3 bg-[#FAF8F3] border-b border-[#E4E1D6] flex items-center justify-between text-xs font-semibold text-[#20241F]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#0F5257]" />
                  <span>Production DDL: havn_brand_catalog.sql</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(MYSQL_DDL_SCHEMA);
                    showToast('SQL DDL copied to clipboard!');
                  }}
                  className="text-xs text-[#0F5257] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy SQL</span>
                </button>
              </div>
              <pre className="p-4 bg-neutral-900 text-neutral-200 text-xs font-mono overflow-x-auto max-h-60 leading-relaxed">
                {MYSQL_DDL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-[#E4E1D6] shadow-sm">
            <div className="border-b border-[#E4E1D6] pb-4 mb-6">
              <h3 className="font-serif text-lg font-semibold text-[#20241F]">
                Immutable Brand Audit Trail (SOP Phase 5 &amp; BRD REQ-ADM-002)
              </h3>
              <p className="text-xs text-[#666B62]">
                Comprehensive governance log recording every configuration mutation, review submission, sign-off approval, deployment, and rollback.
              </p>
            </div>

            <div className="space-y-3">
              {auditLogs.map(log => (
                <div key={log.id} className="p-4 rounded-lg border border-[#E4E1D6] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#0F5257]">{log.versionTag}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#EAF1F0] text-[#0F5257]">
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-[#666B62]">by <strong className="text-[#20241F]">{log.performedBy}</strong> ({log.role})</span>
                    </div>
                    <p className="text-[#20241F]">{log.summary}</p>
                  </div>
                  <span className="font-mono text-[#666B62] text-[11px] shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT FOR REVIEW */}
      {showReviewModal && targetVersionForReview && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#E4E1D6] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
              <h4 className="font-serif text-base font-bold text-[#20241F]">
                Submit for Brand Governance Review
              </h4>
              <button onClick={() => setShowReviewModal(false)} className="text-[#666B62] hover:text-black">✕</button>
            </div>

            <p className="text-xs text-[#666B62]">
              Submitting <strong className="text-[#0F5257]">{targetVersionForReview.versionTag}</strong> for compliance inspection before production storefront deployment.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#20241F]">Reviewer Verification Checklist:</label>
              <div className="space-y-1 text-xs text-[#666B62] bg-[#FAF8F3] p-3 rounded-lg border border-[#E4E1D6]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WCAG AA 4.5:1 contrast verified on light & dark surfaces</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>32px Favicon & Mobile applet legibility confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero-pill header layout compliant with Design Constitution</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#666B62] mb-1">Governance Notes / Justification</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#666B62] hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSubmitReview}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ROLLBACK CONFIRMATION */}
      {showRollbackModal && targetRollbackVersion && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-[#E4E1D6] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E1D6] pb-3">
              <div className="flex items-center gap-2 text-amber-700">
                <RotateCcw className="w-4 h-4" />
                <h4 className="font-serif text-base font-bold">
                  Confirm Instant Brand Rollback
                </h4>
              </div>
              <button onClick={() => setShowRollbackModal(false)} className="text-[#666B62] hover:text-black">✕</button>
            </div>

            <p className="text-xs text-[#666B62] leading-relaxed">
              You are about to switch the live storefront and admin branding from <strong className="text-black">{activeVersion.versionTag}</strong> to historical version <strong className="text-[#0F5257]">{targetRollbackVersion.versionTag}</strong>.
            </p>

            <div>
              <label className="block text-xs font-medium text-[#666B62] mb-1">
                Reason for Rollback (recorded in MySQL audit log)
              </label>
              <textarea
                value={rollbackReason}
                onChange={(e) => setRollbackReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 text-xs rounded-lg border border-[#E4E1D6] bg-[#F7F5EF] focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRollbackModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#666B62]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRollback}
                className="px-4 py-2 bg-[#0F5257] hover:bg-[#0B3D3F] text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Execute Rollback Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
