import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Database,
  FileText,
  AlertTriangle,
  DatabaseZap,
  Users,
  Lock,
  Unlock,
  Plus,
  Compass,
  ArrowRight,
  Terminal,
  Activity,
  Award,
  RefreshCw,
  Clock,
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import { UserPersona, EnterpriseDocument, RagResponse } from './types';

export default function App() {
  // Application State
  const [personas, setPersonas] = useState<UserPersona[]>([]);
  const [activePersona, setActivePersona] = useState<UserPersona | null>(null);
  const [documents, setDocuments] = useState<EnterpriseDocument[]>([]);
  const [searchTarget, setSearchTarget] = useState<string>('');
  
  // Pipeline Query States
  const [userInput, setUserInput] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [ragResponse, setRagResponse] = useState<RagResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [activeCitationUrl, setActiveCitationUrl] = useState<string | null>(null);

  // Ingestion Form States
  const [ingestTitle, setIngestTitle] = useState<string>('');
  const [ingestSilo, setIngestSilo] = useState<'Document' | 'Database' | 'JSONLogs' | 'Compliance'>('Document');
  const [ingestFormat, setIngestFormat] = useState<'PDF' | 'SQL' | 'CSV' | 'JSON' | 'Report'>('PDF');
  const [ingestContent, setIngestContent] = useState<string>('');
  const [ingestRoles, setIngestRoles] = useState<string[]>(['Admin']);
  const [ingestClearance, setIngestClearance] = useState<number>(3);
  const [ingestTags, setIngestTags] = useState<string>('');
  const [ingestAuthor, setIngestAuthor] = useState<string>('');
  const [ingestMsg, setIngestMsg] = useState<{ type: 'success' | 'resError'; text: string } | null>(null);
  const [showIngestForm, setShowIngestForm] = useState<boolean>(false);

  // Active Selected Document for Expanded Reading
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Fetch initial system state
  useEffect(() => {
    fetchSystemData();
  }, []);

  // Sync documents list when persona switches relative to active RBAC contexts
  useEffect(() => {
    fetchDocuments();
  }, [activePersona]);

  const fetchSystemData = async () => {
    try {
      const perRes = await fetch('/api/personas');
      const perData = await perRes.json();
      setPersonas(perData);
      
      // Auto-select Admin (Alex Mercer) initially to demo fully-cleared view first
      const adminUser = perData.find((p: any) => p.role === 'Admin') || perData[0];
      setActivePersona(adminUser);
    } catch (err) {
      console.error('Error bootstrapping personas database:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const url = activePersona 
        ? `/api/documents?personaId=${activePersona.id}`
        : `/api/documents`;
      const docRes = await fetch(url);
      const docData = await docRes.json();
      setDocuments(docData);
    } catch (err) {
      console.error('Error retrieving secure document silos index:', err);
    }
  };

  // Preset query trigger
  const triggerPresetQuery = (queryText: string) => {
    setUserInput(queryText);
    executeRagQuery(queryText);
  };

  // Submit and run contextual RAG query
  const executeRagQuery = async (queryTextToRun?: string) => {
    const activeQuery = queryTextToRun || userInput;
    if (!activeQuery.trim()) return;

    if (!activePersona) {
      setQueryError('Please select an active enterprise persona from the identity index card to authenticate.');
      return;
    }

    setIsQuerying(true);
    setQueryError(null);
    setRagResponse(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: activeQuery,
          personaId: activePersona.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an audit failure status.');
      }

      const data: RagResponse = await response.json();
      setRagResponse(data);
    } catch (err: any) {
      setQueryError(err.message || 'System network timeout or authentication gateway failure.');
    } finally {
      setIsQuerying(false);
    }
  };

  // Synthetic Document ingestion trigger
  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestTitle || !ingestContent) {
      setIngestMsg({ type: 'resError', text: 'Document Title and Content are required field parameters.' });
      return;
    }

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ingestTitle,
          silo: ingestSilo,
          format: ingestFormat,
          content: ingestContent,
          requiredRole: ingestRoles,
          minClearanceLevel: ingestClearance,
          tags: ingestTags.split(',').map(t => t.trim()).filter(Boolean),
          author: ingestAuthor || 'Web Context Ingestion Service',
        }),
      });

      if (!res.ok) {
        throw new Error('Database server rejected custom schema validation rules.');
      }

      const newDoc = await res.json();
      setIngestMsg({ type: 'success', text: `Successfully ingested "${newDoc.title}" inside ${newDoc.silo} silo index!` });
      
      // Reset forms and trigger reload
      setIngestTitle('');
      setIngestContent('');
      setIngestTags('');
      setIngestAuthor('');
      fetchDocuments();

      setTimeout(() => setIngestMsg(null), 8500);
    } catch (err: any) {
      setIngestMsg({ type: 'resError', text: err.message || 'Error occurred while connecting to index daemon.' });
    }
  };

  // Reset database index back to seed models
  const resetDatabaseIndex = async () => {
    if (!window.confirm('Reset all custom ingested silos back to default Nexatech corporate seed databases?')) return;
    try {
      await fetch('/api/documents/reset', { method: 'POST' });
      fetchDocuments();
      setRagResponse(null);
      setIngestMsg({ type: 'success', text: 'Database files and context indices reset successfully.' });
      setTimeout(() => setIngestMsg(null), 4000);
    } catch (err) {
      console.error('Error resetting database:', err);
    }
  };

  // Quick preset samples suited for testing authentication matrices
  const testSampleQueries = [
    {
      title: 'Salary & Equity Limits',
      query: 'What are the executive pay bands for engineering leads?',
      description: 'Tests salary guidelines. Authorized for HR (Sarah) & Admin (Alex). Blocked for Dev (David) and Support (Emily).',
    },
    {
      title: 'Infrastructure Keys',
      query: 'Show me AWS and Database connection string Secrets',
      description: 'Tests sensitive system keys. Authorized for Dev (David) & Admin (Alex). Blocked for HR (Sarah) & Support (Emily).',
    },
    {
      title: 'Firewall IP Denials',
      query: 'What security incidents or IP blockages happened today?',
      description: 'Tests json log query. Authorized for Support (Emily), Dev (David), and Admin (Alex). Blocked for HR (Sarah).',
    },
    {
      title: 'GDPR Compliance Issue',
      query: 'What was the GDPR compliance issue David Chen need to fix?',
      description: 'Tests cross-silo audit reports. Authorized for HR (Sarah), Dev (David) & Admin (Alex). Blocked for Support (Emily).',
    }
  ];

  // Helper styles based on chosen active identity
  const getPersonaColorTheme = (role: string) => {
    switch (role) {
      case 'Admin': return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-500 text-white',
        ring: 'ring-emerald-500/20 shadow-emerald-100',
        accentBadge: 'bg-emerald-50 text-emerald-800 border gap-1 border-emerald-300'
      };
      case 'HR': return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-600 text-white',
        ring: 'ring-purple-600/20 shadow-purple-100',
        accentBadge: 'bg-purple-50 text-purple-800 border gap-1 border-purple-300'
      };
      case 'Engineering': return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-600 text-white',
        ring: 'ring-blue-600/20 shadow-blue-100',
        accentBadge: 'bg-blue-50 text-blue-800 border gap-1 border-blue-300'
      };
      case 'Support': return {
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        text: 'text-indigo-700',
        badge: 'bg-indigo-600 text-white',
        ring: 'ring-indigo-600/20 shadow-indigo-100',
        accentBadge: 'bg-indigo-50 text-indigo-800 border gap-1 border-indigo-300'
      };
      default: return {
        bg: 'bg-gray-50 text-gray-800 border-gray-200',
        text: 'text-gray-700',
        badge: 'bg-gray-600 text-white',
        ring: 'ring-gray-600/20 shadow-gray-100',
        accentBadge: 'bg-gray-50 text-gray-800 border gap-1 border-gray-300'
      };
    }
  };

  const getSiloBadgeColor = (silo: string) => {
    switch (silo) {
      case 'Document': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Database': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'JSONLogs': return 'bg-neutral-100 text-neutral-800 border border-neutral-300';
      case 'Compliance': return 'bg-rose-100 text-rose-800 border border-rose-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const themeColors = activePersona ? getPersonaColorTheme(activePersona.role) : getPersonaColorTheme('Guest');

  // Filter documents in silo viewing explorer based on user search in explorer
  const filteredDocuments = documents.filter(doc => {
    if (!searchTarget) return true;
    const kw = searchTarget.toLowerCase();
    return doc.title.toLowerCase().includes(kw) || 
           doc.tags.some(t => t.toLowerCase().includes(kw)) ||
           doc.silo.toLowerCase().includes(kw);
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-slate-700 selection:text-white" id="main-frame-root">
      {/* 1. TOP ENTERPRISE COMPLIANCE HEADER */}
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 sticky top-0 z-50 shadow-md" id="master-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2.5 rounded-xl shadow-inner shadow-cyan-400/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-wider text-xs uppercase text-cyan-400 font-mono">NEXATECH SYSTEMS</span>
                <span className="bg-rose-500/10 text-rose-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-rose-500/20 animate-pulse-subtle">
                  SECURE STORAGE RAG
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
                Enterprise Intelligence Core
              </h1>
            </div>
          </div>

          {/* Core Telemetry and Status Displays */}
          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>TUNNEL AUDITING: <b className="text-slate-200">WAF SECURE</b></span>
            </div>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-700 pl-4">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>STABILITY CLOCK: <b className="text-slate-200">2026-Q3</b></span>
            </div>
            <button
              id="reset-db-index-btn"
              onClick={resetDatabaseIndex}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold border-l border-slate-700 pl-4 transition-colors"
              title="Reset Sandbox Datasets"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              <span>RESET SEED CHUNKS</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC WORKSPACE BODY */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6" id="master-main">
        
        {/* SECTION A: INDIVIDUAL IDENTITY AUTHENTICATION SELECTOR & SCENARIO CARD */}
        <section className="mb-8" id="persona-sec">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1.5 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Role-Based Authentication Gateway <span className="text-xs text-indigo-400 font-mono font-normal tracking-wide">(Simulated Clearance Tokens)</span>
                </h3>
                <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Enterprise security models mandate that different staff can only pull contents matching their precise 
                  <b> Access Policy Role</b> and <b>Clearance Rating</b>. Choose a credentials mask below to simulate query routing.
                </p>
              </div>
              
              {/* Reset database or active stats token indication */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500">ACTIVE TOKEN SIGNATURE:</span>
                <span className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-emerald-400 font-mono text-xs font-semibold">
                  {activePersona ? `SHA256:NEXA_${activePersona.role.toUpperCase()}_L${activePersona.clearanceLevel}` : 'NO_SESSION_TOKEN'}
                </span>
              </div>
            </div>

            {/* Persona Picker GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6" id="persona-picker-grid">
              {personas.map((per) => {
                const isActive = activePersona?.id === per.id;
                const perTheme = getPersonaColorTheme(per.role);
                return (
                  <button
                    key={per.id}
                    id={`persona-btn-${per.id}`}
                    onClick={() => {
                      setActivePersona(per);
                      setSelectedDocId(null); // Close document expand views
                    }}
                    className={`text-left p-4 rounded-xl border transition-all duration-300 relative ${
                      isActive 
                        ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-2 ring-indigo-500/20' 
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Selected Overlay Indicator */}
                    {isActive && (
                      <span className="absolute top-3 right-3 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <img 
                        src={per.avatar} 
                        alt={per.name} 
                        className={`w-11 h-11 rounded-full object-cover border-2 ${isActive ? 'border-indigo-500' : 'border-slate-700'}`} 
                      />
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm leading-tight">{per.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">{per.department}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded font-semibold ${perTheme.badge}`}>
                        {per.role}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 font-semibold">
                        <Award className="w-3.5 h-3.5 text-cyan-400" />
                        Clearance Lvl {per.clearanceLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SAMPLE PRESET ACTIONABLE BENCHMARKS */}
        <section className="mb-8" id="preset-queries-sec">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs tracking-wider uppercase font-mono text-slate-400 font-bold">RAG Security Penetration Scenarios (Preset Matrix Tests)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" id="sample-queries-grid">
            {testSampleQueries.map((item, idx) => (
              <button
                key={idx}
                id={`preset-query-btn-${idx}`}
                onClick={() => triggerPresetQuery(item.query)}
                className="bg-slate-950 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl text-left transition-all duration-200 shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono tracking-wide">SCENARIO {idx + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 decoration-neutral-100 transition-all" />
                  </div>
                  <h4 className="text-slate-200 font-semibold text-xs mb-2 leading-snug font-sans group-hover:text-white line-clamp-2">
                    &quot;{item.query}&quot;
                  </h4>
                </div>
                <p className="text-[10.5px] leading-relaxed text-slate-400 mt-2 border-t border-slate-800/50 pt-2 font-mono">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* SECTION B: CORE APPLICATION GRID (Silos Explorer vs RAG Pipeline Console) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="workspace-main-grid">
          
          {/* COLUMN 1: INTELLECTUAL MULTI-SOURCE KNOWLEDGE SILOS BLOCK (4 CORES) - spans 5 cols */}
          <div className="lg:col-span-5 flex flex-col gap-6" id="explorer-panel">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-sm uppercase font-mono tracking-wider text-slate-200">
                      Nexatech Silo Database
                    </h3>
                    <p className="text-[10.5px] text-slate-400 font-mono">
                      Query matches against {documents.length} secure document indexes
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 px-2 py-1 rounded text-[10.5px] font-mono text-cyan-400 border border-slate-800 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>SECURED CHUNKS INGEST</span>
                </div>
              </div>

              {/* Internal Metadata Filter search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="search-explorer-input"
                  type="text"
                  placeholder="Filter silos (e.g. Compensation, GDPR, firewalls)..."
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                />
                {searchTarget && (
                  <button 
                    onClick={() => setSearchTarget('')}
                    className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300 font-mono"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* LIST OF CHUNKS COMPLYING WITH DYNAMIC RBAC SELECTION */}
              <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3.5 pr-1 font-sans" id="chunks-silo-vault">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl" id="no-filtered-docs">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No enterprise chunks found matching &quot;{searchTarget}&quot;</p>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isAuthorized = 'isAuthorized' in doc ? (doc as any).isAuthorized : true; 
                    const isSelected = selectedDocId === doc.id;
                    const meta = doc.referenceMeta || {};

                    return (
                      <div
                        key={doc.id}
                        id={`document-item-${doc.id}`}
                        className={`border rounded-xl p-3.5 transition-all duration-200 ${
                          isSelected 
                            ? 'bg-slate-900/90 border-indigo-500 shadow-md shadow-indigo-950/20' 
                            : isAuthorized 
                              ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60' 
                              : 'bg-slate-950 border-red-950/50 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {doc.format === 'PDF' && <FileText className="w-4 h-4 text-rose-400 shrink-0" />}
                            {doc.format === 'CSV' && <DatabaseZap className="w-4 h-4 text-blue-400 shrink-0" />}
                            {doc.format === 'SQL' && <Database className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {doc.format === 'JSON' && <Terminal className="w-4 h-4 text-neutral-400 shrink-0" />}
                            {doc.format === 'Report' && <BookOpen className="w-4 h-4 text-yellow-500 shrink-0" />}
                            
                            <h4 className="font-bold text-xs text-slate-200 leading-snug line-clamp-1 truncate" title={doc.title}>
                              {doc.title}
                            </h4>
                          </div>

                          <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase shrink-0 ${getSiloBadgeColor(doc.silo)}`}>
                            {doc.silo}
                          </span>
                        </div>

                        {/* RBAC constraints tags block */}
                        <div className="flex flex-wrap gap-1 mt-2 mb-2 font-mono text-[9px]">
                          <span className="text-[10px] text-slate-500 border border-slate-800 bg-slate-950 px-1 rounded flex items-center gap-1 uppercase">
                            FORMAT: {doc.format}
                          </span>
                          <span className="text-[10px] text-slate-500 border border-slate-800 bg-slate-950 px-1 rounded flex items-center gap-1">
                            ROLES: {doc.requiredRole.join('/')}
                          </span>
                          <span className="text-[10px] text-slate-500 border border-slate-800 bg-slate-950 px-1 rounded flex items-center gap-1">
                            MIN_CLEARANCE: LVL {doc.minClearanceLevel}
                          </span>
                        </div>

                        {/* Expandable Read Area */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/50">
                          {isSelected ? (
                            <div className="text-xs space-y-2">
                              {/* Decrypted or warning view */}
                              <div className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed select-text overflow-x-auto whitespace-pre-wrap max-h-60 border border-slate-800 shadow-inner">
                                {doc.content}
                              </div>

                              {/* External links and metadata stats */}
                              <div className="text-[10.5px] text-slate-400 grid grid-cols-2 gap-y-1 bg-slate-900 p-2 rounded border border-slate-850 font-mono">
                                <div>Author: <b className="text-slate-300">{meta.author || 'N/A'}</b></div>
                                <div>Date: <b className="text-slate-300">{meta.date || 'N/A'}</b></div>
                                <div className="col-span-2 text-[10px] break-all pt-1 border-t border-slate-800/60 flex items-center justify-between gap-1">
                                  <span className="text-slate-500">Path: {meta.siloPath || 'N/A'}</span>
                                  <span className="text-emerald-400 text-[10px] font-semibold tracking-wide shrink-0">VERIFIED DIRECTORY CHUNK</span>
                                </div>
                              </div>

                              <button
                                onClick={() => setSelectedDocId(null)}
                                className="w-full py-1 text-center font-mono text-[10px] text-slate-400 bg-slate-800/50 hover:bg-slate-850 rounded text-xs transition duration-150"
                              >
                                Collapse Content Section
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <button
                                onClick={() => setSelectedDocId(doc.id)}
                                className="text-indigo-400 hover:text-indigo-300 font-semibold font-mono tracking-wide flex items-center gap-1 cursor-pointer"
                              >
                                <BookOpen className="w-3 h-3 text-indigo-400" />
                                READ EXTRACTED TEXT
                              </button>

                              <div className="flex items-center gap-1 text-[10px]">
                                {isAuthorized ? (
                                  <span className="text-emerald-400 font-semibold font-mono flex items-center gap-0.5">
                                    <Unlock className="w-3 h-3" />
                                    DECRYPTED
                                  </span>
                                ) : (
                                  <span className="text-rose-400 font-semibold font-mono flex items-center gap-0.5" title="Access policy restricted. Switch persona.">
                                    <Lock className="w-3 h-3" />
                                    ENCRYPTED
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* SECTION: SIMULATION CHUNK INGESTION (DYNAMIC DATABASE SEEDING) */}
              <div className="mt-4 pt-4 border-t border-slate-800" id="seeding-form-container">
                <button
                  onClick={() => setShowIngestForm(!showIngestForm)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                  id="toggle-ingest-btn"
                >
                  <span className="text-xs font-bold font-mono tracking-wider text-slate-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-cyan-400" />
                    INGEST CUSTOM DOCUMENT / LOG CHUNK
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {showIngestForm ? '[ COLLAPSE ]' : '[ EXPAND ]'}
                  </span>
                </button>

                {showIngestForm && (
                  <form onSubmit={handleIngestSubmit} className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3" id="ingestion-form">
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Publish a new piece of raw infrastructure, compliance audit, or compensation guideline data structure live to investigate retrieval results.
                    </p>

                    <div>
                      <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">DOCUMENT TITLE</label>
                      <input
                        id="ingest-title"
                        type="text"
                        required
                        placeholder="e.g., Q3 Cloud Security Budget.pdf"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        value={ingestTitle}
                        onChange={(e) => setIngestTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">TARGET SILO</label>
                        <select
                          id="ingest-silo"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                          value={ingestSilo}
                          onChange={(e: any) => setIngestSilo(e.target.value)}
                        >
                          <option value="Document">Document Silo</option>
                          <option value="Database">Database Silo</option>
                          <option value="JSONLogs">JSONLogs Silo</option>
                          <option value="Compliance">Compliance Silo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">FILE FORMAT</label>
                        <select
                          id="ingest-format"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                          value={ingestFormat}
                          onChange={(e: any) => setIngestFormat(e.target.value)}
                        >
                          <option value="PDF">PDF</option>
                          <option value="SQL">SQL</option>
                          <option value="CSV">CSV</option>
                          <option value="JSON">JSON</option>
                          <option value="Report">Report</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">REQUIRED ROLES</label>
                        <select
                          id="ingest-roles"
                          multiple
                          className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 h-24"
                          value={ingestRoles}
                          onChange={(e: any) => {
                            const values = Array.from(e.target.selectedOptions, (option: any) => option.value);
                            setIngestRoles(values);
                          }}
                        >
                          <option value="Admin">Admin</option>
                          <option value="HR">HR</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Support">Support</option>
                        </select>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 block">Cmd/Ctrl + click to select multiple</span>
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">MIN SECURITY LEVEL</label>
                        <input
                          id="ingest-clearance"
                          type="number"
                          min={1}
                          max={5}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                          value={ingestClearance}
                          onChange={(e) => setIngestClearance(Number(e.target.value))}
                        />
                        <span className="text-[9px] text-slate-500 font-mono mt-1 block">Value between 1 (low) and 5 (highly restricted)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">TAGS (COMMA SEPARATED)</label>
                      <input
                        id="ingest-tags"
                        type="text"
                        placeholder="e.g., Finance, Secret-Key, Infra"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        value={ingestTags}
                        onChange={(e) => setIngestTags(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">AUTHOR DESCRIPTION</label>
                      <input
                        id="ingest-author"
                        type="text"
                        placeholder="e.g., CSO Auditor Group"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        value={ingestAuthor}
                        onChange={(e) => setIngestAuthor(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-mono font-semibold text-slate-400 mb-1">DOCUMENT BODY CONTENT</label>
                      <textarea
                        id="ingest-content"
                        required
                        rows={4}
                        placeholder="Type executive, system secrets or database elements to test RAG..."
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono whitespace-pre"
                        value={ingestContent}
                        onChange={(e) => setIngestContent(e.target.value)}
                      />
                    </div>

                    <button
                      id="submit-ingest-btn"
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono font-bold py-2 px-4 rounded text-xs transition duration-200"
                    >
                      EXECUTE INGESTION PROCESS
                    </button>

                    {ingestMsg && (
                      <div id="ingest-msg-box" className={`p-2.5 rounded text-xs font-mono border ${
                        ingestMsg.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60' : 'bg-rose-950/40 text-rose-300 border-rose-950/60'
                      }`}>
                        {ingestMsg.text}
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: ACTIVE CONTEXT-AWARE RAG QUERY TERMINAL & TRACER - spans 7 cols */}
          <div className="lg:col-span-7 flex flex-col gap-6" id="rag-terminal-panel">
            
            {/* SEARCH EXECUTIVE ELEMENT BOX */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xs tracking-wider uppercase font-mono text-slate-400 mb-3 font-bold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                Query Orchestration Pipeline console
              </h3>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-4.5 h-5 w-5 text-slate-400" />
                  <input
                    id="rag-query-input"
                    type="text"
                    placeholder="Enter natural language query to seek answers across multiple silos..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans shadow-inner select-text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') executeRagQuery();
                    }}
                  />
                  
                  {/* Dynamic Execute Button */}
                  <button
                    id="submit-query-btn"
                    onClick={() => executeRagQuery()}
                    disabled={isQuerying}
                    className="absolute right-2 top-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold font-mono rounded-lg text-xs transition-all duration-150 shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isQuerying ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-3.5 h-3.5" />
                        <span>EXECUTE RAG</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    Querying as: 
                    {activePersona ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${themeColors.accentBadge}`}>
                        {activePersona.name} ({activePersona.role} Lvl {activePersona.clearanceLevel})
                      </span>
                    ) : (
                      <b className="text-rose-400">🚨 NO PERSONA SELECTED</b>
                    )}
                  </span>

                  <span className="text-[11px]">
                    Pipeline: <b className="text-slate-200">Gemini-3.5-flash AI Routing</b>
                  </span>
                </div>
              </div>
            </div>

            {/* ERROR BOUNDARY OUTPUT BANNER */}
            {queryError && (
              <div id="query-error-banner" className="bg-rose-950/50 border border-rose-900/50 rounded-xl p-4 text-slate-100 flex items-start gap-3 shadow-md">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-rose-300">
                    Query Compliance & Execution Restriction
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                    {queryError}
                  </p>
                </div>
              </div>
            )}

            {/* PIPELINE OUTPUT DISPLAY: ANSWER & TRUSTED EXPLAINABILITY METRICS */}
            {ragResponse && (
              <div className="space-y-6" id="rag-output-workspace">
                
                {/* A. GROUNDED SYNTHESIS VIEW CARD */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Header Metrics Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] tracking-wider uppercase font-mono text-cyan-400 font-bold block">
                        GROUNDED RESPONSE GENERATION
                      </span>
                      <h4 className="text-sm font-bold text-slate-300 font-mono mt-0.5">
                        Factual Corporate Synthesis
                      </h4>
                    </div>

                    {/* Grounding Confidence Radial Dial visualization */}
                    <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800 shrink-0">
                      <div className="relative w-9 h-9">
                        <svg className="w-9 h-9" viewBox="0 0 36 36">
                          <path
                            className="text-slate-800 stroke-current"
                            strokeWidth="3.5"
                            strokeDasharray="100, 100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                          />
                          <path
                            className={`${
                              ragResponse.confidenceScore >= 0.8 ? 'text-emerald-500' : 'text-amber-500'
                            } stroke-current`}
                            strokeWidth="3.5"
                            strokeDasharray={`${ragResponse.confidenceScore * 100}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-white">
                          {Math.round(ragResponse.confidenceScore * 100)}%
                        </div>
                      </div>

                      <div className="text-[10.5px] font-mono leading-tight">
                        <div className="text-slate-400">FACTIONAL EVAL:</div>
                        <div className="font-bold text-slate-200">
                          {ragResponse.confidenceScore >= 0.85 ? 'HIGH COHERENCE' : 'ADEQUATE COVERAGE'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grounded Rich Text Response (Markdown Styled) */}
                  <div className="prose prose-invert max-w-none text-slate-200 text-[13.5px] leading-relaxed select-text space-y-3 font-sans relative">
                    {ragResponse.answer.split('\n\n').map((para, i) => {
                      if (para.startsWith('- ') || para.startsWith('* ')) {
                        return (
                          <ul className="list-disc list-inside space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-850 my-2 font-sans" key={i}>
                            {para.split('\n').map((item, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {item.replace(/^-\s*|^\*\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={i} className="whitespace-pre-line leading-relaxed">
                          {para}
                        </p>
                      );
                    })}
                  </div>

                  {/* CITATIONS BAR */}
                  {ragResponse.citations.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-850" id="citations-panel">
                      <span className="text-[10px] tracking-wider uppercase font-mono text-slate-400 block mb-2 font-bold select-none">
                        VERIFYABLE DATA SOURCE CITATIONS ({ragResponse.citations.length})
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="citations-grid">
                        {ragResponse.citations.map((cite) => (
                          <div
                            key={cite.id}
                            id={`citation-item-${cite.id}`}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-indigo-500 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <span className="text-[11px] font-bold text-slate-300 font-mono truncate max-w-[140px]" title={cite.title}>
                                {cite.title}
                              </span>
                              <span className={`text-[8.5px] px-1.5 font-semibold font-mono rounded uppercase ${getSiloBadgeColor(cite.silo)}`}>
                                {cite.silo}
                              </span>
                            </div>
                            
                            <p className="text-[10.5px] text-slate-400 leading-normal line-clamp-2 select-text font-mono italic">
                              &quot;{cite.snippet}&quot;
                            </p>

                            <div className="mt-2 text-[10px] flex items-center justify-between border-t border-slate-800/80 pt-1.5 font-mono">
                              <span className="text-indigo-400 text-[10px]">ID: {cite.id}</span>
                              <button
                                onClick={() => {
                                  setSelectedDocId(cite.id);
                                  document.getElementById(`document-item-${cite.id}`)?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5"
                              >
                                View Silo Target <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* B. UNDER-THE-HOOD PIPELINE TRACE EXPLAINABILITY */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-200">
                          Secure RAG Pipeline Trace Logging
                        </h4>
                        <p className="text-[10.5px] text-indigo-400 font-mono">
                          Traceability audit reporting & access metric monitors
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
                      <span>BLOCKED: <b className="text-rose-400">{ragResponse.trace.blockedSourcesCount}</b></span>
                      <span>RETRIEVED: <b className="text-emerald-400">{ragResponse.trace.sourcesRetrievedCount}</b></span>
                    </div>
                  </div>

                  {/* STEP BY STEP PIPELINE */}
                  <div className="space-y-4 font-mono text-xs" id="interactive-trace-timeline">
                    {ragResponse.trace.steps.map((step, sIdx) => {
                      const isError = step.status === 'error';
                      const isWarning = step.status === 'warning';
                      const isInfo = step.status === 'info';

                      return (
                        <div
                          key={step.id}
                          id={`trace-step-${step.id}`}
                          className="flex items-start gap-3.5 relative pl-2 border-l-2 border-slate-800 pb-1"
                        >
                          {/* Dot step design */}
                          <span className={`absolute -left-[7px] top-[4px] rounded-full h-3 w-3 ${
                            isError ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : isInfo ? 'bg-indigo-400' : 'bg-emerald-500'
                          }`}></span>

                          <div className="flex-1 bg-slate-900/60 border border-slate-850 rounded-lg p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                <span className="text-slate-500">[{sIdx + 1}]</span>
                                {step.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">{step.timestamp}</span>
                            </div>

                            <p className="text-slate-400 leading-normal text-[11px] select-text">
                              {step.details}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* TERMINAL LANDING NO RESULTS VIEW */}
            {!ragResponse && !isQuerying && !queryError && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-10 text-center shadow-lg" id="rag-terminal-placeholder">
                <Compass className="w-12 h-12 text-slate-600 mx-auto mb-4 animate-pulse-subtle" />
                <h4 className="text-sm font-bold text-slate-300 font-mono">Nexatech Storage Intelligence System Ready</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                  Choose a user persona, review existing documents, or select one of the high-priority compliance audit scenario cards above to run the RAG query engine.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. MASTHEAD FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-12 py-6 px-4 text-center text-xs text-slate-500 font-mono max-w-7xl mx-auto" id="master-footer">
        <p>© 2026 Nexatech Cloud Systems. Strict Role-Based Cryptographic Access Auditing Active.</p>
        <p className="mt-1 text-slate-600">Enterprise RAG Intelligence System is fully powered by Gemini 3.5 Flash Model SDK.</p>
      </footer>
    </div>
  );
}
