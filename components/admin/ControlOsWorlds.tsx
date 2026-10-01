'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

// Types
export interface CaseStudyItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  projectId?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  published: boolean;
  publishedAt?: string;
  featured: boolean;
  isArchived: boolean;
  archivedAt?: string;
  space: string;
  clientContext?: string;
  scale: string;
  aquariumVolume?: string;
  aquariumType?: string;
  biome?: string;
  image: string;
  gallery: Array<{ url: string; caption?: string; alt?: string }>;
  beforeAfter?: {
    beforeImage?: string;
    afterImage?: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
  };
  imageStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'FALLBACK';
  designIntent: string;
  result: string;
  materials: string[];
  engineering: string[];
  marineWorld: {
    biome: string;
    livestock: string;
    corals: string;
  };
  introduction?: string;
  challenge?: string;
  concept?: string;
  architecture?: string;
  execution?: string;
  transformation?: string;
  conclusion?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalOverride?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProjectItem {
  id: string; // Project Code, e.g. "CP-2025-001"
  projectName: string;
  status: 'lead' | 'planning' | 'design' | 'fabrication' | 'installation' | 'completed' | 'archived';
  installationStatus: 'pending' | 'in_progress' | 'commissioning' | 'completed';
  aquariumVolume?: string;
  aquariumType?: string;
  biome?: string;
  designStyle?: string;
  materials: string[];
  equipment: string[];
  marineLifeNotes?: string;
  installationDetails?: string;
  city: string;
  siteType: 'residential' | 'commercial' | 'hospitality' | 'institutional';
  // Sensitive private client info
  privateAddress?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  projectStartDate?: string;
  projectCompletionDate?: string;
  internalNotes?: string;
  estimatedBudget?: number;
  caseStudyId?: string;
  internalGallery: string[];
  isArchived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorldsMetrics {
  caseStudies: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  clientProjects: {
    total: number;
    active: number;
    completed: number;
    archived: number;
  };
  media: {
    projectsWithGallery: number;
    needsMediaReview: number;
  };
}

export function ControlOsWorlds() {
  // Navigation sub-tab: 'overview' | 'case_studies' | 'client_projects'
  const [subTab, setSubTab] = useState<'overview' | 'case_studies' | 'client_projects'>('overview');

  // Operational State
  const [metrics, setMetrics] = useState<WorldsMetrics | null>(null);
  const [caseStudies, setCaseStudies] = useState<CaseStudyItem[]>([]);
  const [clientProjects, setClientProjects] = useState<ClientProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [publicationFilter, setPublicationFilter] = useState('all');

  // Modals & Editors
  const [isCaseStudyModalOpen, setIsCaseStudyModalOpen] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<Partial<CaseStudyItem> | null>(null);
  const [caseStudyStep, setCaseStudyStep] = useState<number>(1);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<ClientProjectItem> | null>(null);
  const [projectStep, setProjectStep] = useState<number>(1);

  // Confirmation Modals
  const [confirmAction, setConfirmAction] = useState<{
    type: 'publish' | 'unpublish' | 'archive_cs' | 'duplicate_cs' | 'archive_cp';
    targetId: string;
    title: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Worlds Data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (publicationFilter !== 'all') params.set('publication', publicationFilter);

      const res = await fetch(`/api/admin/worlds?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        setMetrics(json.metrics);
        setCaseStudies(json.caseStudies || []);
        setClientProjects(json.clientProjects || []);
      } else {
        throw new Error(json.error || 'Failed to fetch Worlds telemetry');
      }
    } catch (err: any) {
      setError(err.message || 'Operational communication error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, publicationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Case Study Actions
  const handleCaseStudyAction = async (action: 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'duplicate', id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/worlds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, entity: 'case_study', action }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action} case study`);
      }

      showToast(`Case Study successfully ${action}ed`);
      setConfirmAction(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Client Project Archive
  const handleProjectArchive = async (id: string, action: 'archive' | 'unarchive') => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/worlds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, entity: 'client_project', action }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action} client project`);
      }

      showToast(`Client project ${action}ed successfully`);
      setConfirmAction(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle "Create Case Study From Project"
  const handleCreateCaseStudyFromProject = async (projectId: string) => {
    if (!confirm('Generate a public Case Study draft from this Client Project? (Private client details will be strictly excluded)')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entity: 'case_study_from_project', projectId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create case study from project');
      }

      showToast(`Draft Case Study created for project ${projectId}`);
      setSubTab('case_studies');
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Case Study (Create or Update)
  const handleSaveCaseStudy = async (publishImmediate = false) => {
    if (!editingCaseStudy?.title?.trim()) {
      alert('Case Study title is required.');
      setCaseStudyStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        ...editingCaseStudy,
        entity: 'case_study',
        published: publishImmediate ? true : Boolean(editingCaseStudy.published),
        status: publishImmediate ? 'published' : editingCaseStudy.status || 'draft',
      };

      const isEditing = Boolean(editingCaseStudy.slug || editingCaseStudy.id);
      const url = '/api/admin/worlds';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to persist case study');
      }

      showToast(isEditing ? 'Case Study updated successfully' : 'Case Study created successfully');
      setIsCaseStudyModalOpen(false);
      setEditingCaseStudy(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Client Project (Create or Update)
  const handleSaveProject = async () => {
    if (!editingProject?.projectName?.trim()) {
      alert('Project name is required.');
      setProjectStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        ...editingProject,
        entity: 'client_project',
      };

      const isEditing = Boolean(editingProject.id);
      const url = '/api/admin/worlds';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to persist client project');
      }

      showToast(isEditing ? 'Client project updated successfully' : 'Client project created successfully');
      setIsProjectModalOpen(false);
      setEditingProject(null);
      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard accessibility for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmAction) setConfirmAction(null);
        else if (isCaseStudyModalOpen) setIsCaseStudyModalOpen(false);
        else if (isProjectModalOpen) setIsProjectModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmAction, isCaseStudyModalOpen, isProjectModalOpen]);

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-950 border border-cyan-400 text-cyan-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Sub-Navigation & Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              CONTROL OS // WORLDS MODULE
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              Live Governance
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Worlds &amp; Aquascaping Portfolio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational governance of private client projects and authoritative public case studies.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              subTab === 'overview'
                ? 'bg-cyan-500 text-black shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setSubTab('case_studies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              subTab === 'case_studies'
                ? 'bg-cyan-500 text-black shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Case Studies</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-current">
              {metrics?.caseStudies.total || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('client_projects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              subTab === 'client_projects'
                ? 'bg-cyan-500 text-black shadow font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Client Projects</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-current">
              {metrics?.clientProjects.total || 0}
            </span>
          </button>
        </div>
      </div>

      {/* ── Real Database-Backed Metrics Summary Cards ──────────────────── */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Published Case Studies */}
          <button
            type="button"
            onClick={() => {
              setSubTab('case_studies');
              setPublicationFilter('published');
            }}
            className={`text-left p-3.5 rounded-2xl border transition-all ${
              subTab === 'case_studies' && publicationFilter === 'published'
                ? 'bg-cyan-950/40 border-cyan-400/80 shadow-lg'
                : 'bg-[#0b121a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              PUBLISHED CASES
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">
              {metrics.caseStudies.published}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Live on /our-worlds</span>
          </button>

          {/* Card 2: Draft Case Studies */}
          <button
            type="button"
            onClick={() => {
              setSubTab('case_studies');
              setPublicationFilter('draft');
            }}
            className={`text-left p-3.5 rounded-2xl border transition-all ${
              subTab === 'case_studies' && publicationFilter === 'draft'
                ? 'bg-cyan-950/40 border-cyan-400/80 shadow-lg'
                : 'bg-[#0b121a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              DRAFT CASES
            </span>
            <span className="text-xl font-bold font-mono text-amber-400 block mt-1">
              {metrics.caseStudies.draft}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Pending review</span>
          </button>

          {/* Card 3: Active Client Projects */}
          <button
            type="button"
            onClick={() => {
              setSubTab('client_projects');
              setStatusFilter('all');
            }}
            className={`text-left p-3.5 rounded-2xl border transition-all ${
              subTab === 'client_projects'
                ? 'bg-cyan-950/40 border-cyan-400/80 shadow-lg'
                : 'bg-[#0b121a] border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              ACTIVE PROJECTS
            </span>
            <span className="text-xl font-bold font-mono text-cyan-300 block mt-1">
              {metrics.clientProjects.active}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Design &amp; build pipeline</span>
          </button>

          {/* Card 4: Completed Projects */}
          <button
            type="button"
            onClick={() => {
              setSubTab('client_projects');
              setStatusFilter('completed');
            }}
            className="text-left p-3.5 rounded-2xl border bg-[#0b121a] border-slate-800 hover:border-slate-700 transition-all"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              COMPLETED
            </span>
            <span className="text-xl font-bold font-mono text-white block mt-1">
              {metrics.clientProjects.completed}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Turnkey handovers</span>
          </button>

          {/* Card 5: Gallery Health */}
          <div className="p-3.5 rounded-2xl border bg-[#0b121a] border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              GALLERY ASSETS
            </span>
            <span className="text-xl font-bold font-mono text-white block mt-1">
              {metrics.media.projectsWithGallery}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Cases with gallery</span>
          </div>

          {/* Card 6: Media Needs Review */}
          <div className="p-3.5 rounded-2xl border bg-[#0b121a] border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
              MEDIA REVIEW
            </span>
            <span className="text-xl font-bold font-mono text-pink-400 block mt-1">
              {metrics.media.needsMediaReview}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Pending verification</span>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0b121a] p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-1 items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, project code, city, volume, biotope..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Publication Filter (for Case Studies) */}
          {subTab !== 'client_projects' && (
            <select
              value={publicationFilter}
              onChange={(e) => setPublicationFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">All Publications</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Operational Statuses</option>
            {subTab === 'client_projects' ? (
              <>
                <option value="lead">Lead</option>
                <option value="planning">Planning</option>
                <option value="design">Design</option>
                <option value="fabrication">Fabrication</option>
                <option value="installation">Installation</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </>
            ) : (
              <>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </>
            )}
          </select>

          {/* Clear Filters */}
          {(search || publicationFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPublicationFilter('all');
                setStatusFilter('all');
              }}
              className="px-2.5 py-2 text-xs text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
            >
              Clear
            </button>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {subTab !== 'client_projects' && (
            <button
              type="button"
              onClick={() => {
                setEditingCaseStudy({
                  status: 'draft',
                  published: false,
                  imageStatus: 'VERIFIED',
                  materials: [],
                  engineering: [],
                  gallery: [],
                  marineWorld: { biome: '', livestock: '', corals: '' },
                });
                setCaseStudyStep(1);
                setIsCaseStudyModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-all flex items-center gap-1.5 shadow"
            >
              <span>+ Add Case Study</span>
            </button>
          )}

          {subTab !== 'case_studies' && (
            <button
              type="button"
              onClick={() => {
                setEditingProject({
                  status: 'lead',
                  installationStatus: 'pending',
                  city: 'Kolkata',
                  siteType: 'residential',
                  materials: [],
                  equipment: [],
                  internalGallery: [],
                });
                setProjectStep(1);
                setIsProjectModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <span>+ Add Client Project</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono">
          Operational Error: {error}
        </div>
      )}

      {/* ── MAIN CONTENT ACCORDING TO ACTIVE SUBTAB ────────────────────── */}

      {/* VIEW A: OVERVIEW & COMBINED PIPELINE */}
      {subTab === 'overview' && (
        <div className="space-y-8">
          {/* Top Section: Recent Case Studies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                AUTHORITATIVE CASE STUDIES ({caseStudies.length})
              </h3>
              <button
                type="button"
                onClick={() => setSubTab('case_studies')}
                className="text-xs text-cyan-400 hover:underline"
              >
                View all case studies →
              </button>
            </div>
            {renderCaseStudiesTable(caseStudies.slice(0, 5))}
          </div>

          {/* Bottom Section: Active Client Projects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  PRIVATE CLIENT PROJECTS ({clientProjects.length})
                </h3>
                <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  Private Operational Data
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('client_projects')}
                className="text-xs text-cyan-400 hover:underline"
              >
                View all client projects →
              </button>
            </div>
            {renderClientProjectsTable(clientProjects.slice(0, 5))}
          </div>
        </div>
      )}

      {/* VIEW B: FULL CASE STUDIES TABLE */}
      {subTab === 'case_studies' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing {caseStudies.length} case study records</span>
            <span className="font-mono text-cyan-400">Public Portfolio Control</span>
          </div>
          {renderCaseStudiesTable(caseStudies)}
        </div>
      )}

      {/* VIEW C: FULL CLIENT PROJECTS TABLE */}
      {subTab === 'client_projects' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Showing {clientProjects.length} private client project records</span>
            <span className="font-mono text-amber-400">Confidential Business Directory</span>
          </div>
          {renderClientProjectsTable(clientProjects)}
        </div>
      )}

      {/* ── MODAL 1: CASE STUDY EDITOR (10 STEPS / SECTIONS) ─────────────── */}
      {isCaseStudyModalOpen && editingCaseStudy && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0b121a] border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                  CASE STUDY GOVERNANCE // {editingCaseStudy.slug ? 'EDITING RECORD' : 'NEW RECORD'}
                </span>
                <h3 className="text-base font-bold text-white">
                  {editingCaseStudy.title || 'Untitled Case Study'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCaseStudyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="px-6 py-2 border-b border-slate-800/80 bg-slate-900/30 flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
              {[
                { s: 1, label: '01 STORY' },
                { s: 2, label: '02 PROJECT' },
                { s: 3, label: '03 BIOTOPE' },
                { s: 4, label: '04 MATERIALS' },
                { s: 5, label: '05 MEDIA' },
                { s: 6, label: '06 BEFORE/AFTER' },
                { s: 7, label: '07 SEO' },
                { s: 8, label: '08 REVIEW & SAVE' },
              ].map((tab) => (
                <button
                  key={tab.s}
                  type="button"
                  onClick={() => setCaseStudyStep(tab.s)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    caseStudyStep === tab.s
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Step 1: Story & Identity */}
              {caseStudyStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Project Title *</label>
                    <input
                      type="text"
                      value={editingCaseStudy.title || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, title: e.target.value })}
                      placeholder="e.g. The Alipore Penthouse Monolith"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Subtitle / Headline</label>
                      <input
                        type="text"
                        value={editingCaseStudy.subtitle || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, subtitle: e.target.value })}
                        placeholder="e.g. Dual-Sided Architectural Living Partition"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Eyebrow / Badge</label>
                      <input
                        type="text"
                        value={editingCaseStudy.eyebrow || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, eyebrow: e.target.value })}
                        placeholder="e.g. CASE STUDY 01"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={editingCaseStudy.slug || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, slug: e.target.value })}
                      placeholder="Auto-generated from title if blank"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Public path: /our-worlds/[slug]
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Introduction Narrative</label>
                    <textarea
                      rows={3}
                      value={editingCaseStudy.introduction || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, introduction: e.target.value })}
                      placeholder="High-level narrative introduction..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Structural Challenge</label>
                      <textarea
                        rows={2}
                        value={editingCaseStudy.challenge || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, challenge: e.target.value })}
                        placeholder="Technical and spatial constraints..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Living Concept</label>
                      <textarea
                        rows={2}
                        value={editingCaseStudy.concept || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, concept: e.target.value })}
                        placeholder="Conceptual biological vision..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Project Facts */}
              {caseStudyStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Setting / Space *</label>
                      <input
                        type="text"
                        value={editingCaseStudy.space || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, space: e.target.value })}
                        placeholder="e.g. Private Penthouse Residence, Alipore, Kolkata"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Public Collaborator / Context</label>
                      <input
                        type="text"
                        value={editingCaseStudy.clientContext || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, clientContext: e.target.value })}
                        placeholder="e.g. Commissioned in collaboration with Studio Morphogenesis • Completed 2025"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Scale / Dimensions *</label>
                      <input
                        type="text"
                        value={editingCaseStudy.scale || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, scale: e.target.value })}
                        placeholder="e.g. 7,800 Liters / 2,060 Gallons • 4.8m × 1.8m"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Water Volume</label>
                      <input
                        type="text"
                        value={editingCaseStudy.aquariumVolume || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, aquariumVolume: e.target.value })}
                        placeholder="e.g. 7800L"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Construction Type</label>
                      <input
                        type="text"
                        value={editingCaseStudy.aquariumType || ''}
                        onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, aquariumType: e.target.value })}
                        placeholder="e.g. 90mm Monolithic Cast Acrylic"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Design Intent Statement *</label>
                    <textarea
                      rows={3}
                      value={editingCaseStudy.designIntent || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, designIntent: e.target.value })}
                      placeholder="Detailed spatial design objectives..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Project Outcome / Result *</label>
                    <textarea
                      rows={2}
                      value={editingCaseStudy.result || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, result: e.target.value })}
                      placeholder="Verified biological survival, acoustic rating, client reception..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Biotope & Marine World */}
              {caseStudyStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Target Biome Profile</label>
                    <input
                      type="text"
                      value={editingCaseStudy.marineWorld?.biome || editingCaseStudy.biome || ''}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          biome: e.target.value,
                          marineWorld: {
                            ...(editingCaseStudy.marineWorld || { livestock: '', corals: '' }),
                            biome: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Indo-Pacific Shallow Coral Atoll"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Living Livestock Stocking</label>
                    <textarea
                      rows={3}
                      value={editingCaseStudy.marineWorld?.livestock || ''}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          marineWorld: {
                            ...(editingCaseStudy.marineWorld || { biome: '', corals: '' }),
                            livestock: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Schooling Threadfin Anthias, Blue-Throat Triggerfish, Captive-Bred Ocellaris pairs"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Curated Coral Biodiversity</label>
                    <textarea
                      rows={3}
                      value={editingCaseStudy.marineWorld?.corals || ''}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          marineWorld: {
                            ...(editingCaseStudy.marineWorld || { biome: '', livestock: '' }),
                            corals: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Cultured Australian Acropora millepora, branching Montipora, and Euphyllia fields"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Materials & Engineering */}
              {caseStudyStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Architectural Materials (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={(editingCaseStudy.materials || []).join('\n')}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          materials: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                        })
                      }
                      placeholder="90mm Monolithic Thermoformed Cast Acrylic&#10;Italian Calacatta marble cladding"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Life Support &amp; Engineering Specifications (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={(editingCaseStudy.engineering || []).join('\n')}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          engineering: e.target.value.split('\n').filter((l) => l.trim().length > 0),
                        })
                      }
                      placeholder="Concealed sub-level life-support plant room operating below 24dB&#10;Dual titanium chillers"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Media Governance */}
              {caseStudyStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Hero Image URL *</label>
                    <input
                      type="text"
                      value={editingCaseStudy.image || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Media Asset Health</label>
                    <select
                      value={editingCaseStudy.imageStatus || 'VERIFIED'}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          imageStatus: e.target.value as any,
                        })
                      }
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="VERIFIED">VERIFIED PHOTOGRAPHY</option>
                      <option value="FALLBACK">LUXURY BLUEPRINT / FALLBACK</option>
                      <option value="NEEDS_REVIEW">NEEDS MEDIA REVIEW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Gallery Images (URLs, one per line)</label>
                    <textarea
                      rows={3}
                      value={(editingCaseStudy.gallery || []).map((g) => g.url).join('\n')}
                      onChange={(e) => {
                        const urls = e.target.value.split('\n').filter((u) => u.trim().length > 0);
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          gallery: urls.map((url) => ({ url: url.trim() })),
                        });
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 6: Before & After Transformation */}
              {caseStudyStep === 6 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Before Image URL</label>
                      <input
                        type="text"
                        value={editingCaseStudy.beforeAfter?.beforeImage || ''}
                        onChange={(e) =>
                          setEditingCaseStudy({
                            ...editingCaseStudy,
                            beforeAfter: {
                              ...editingCaseStudy.beforeAfter,
                              beforeImage: e.target.value,
                            },
                          })
                        }
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">After Image URL</label>
                      <input
                        type="text"
                        value={editingCaseStudy.beforeAfter?.afterImage || ''}
                        onChange={(e) =>
                          setEditingCaseStudy({
                            ...editingCaseStudy,
                            beforeAfter: {
                              ...editingCaseStudy.beforeAfter,
                              afterImage: e.target.value,
                            },
                          })
                        }
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Transformation Caption</label>
                    <input
                      type="text"
                      value={editingCaseStudy.beforeAfter?.caption || ''}
                      onChange={(e) =>
                        setEditingCaseStudy({
                          ...editingCaseStudy,
                          beforeAfter: {
                            ...editingCaseStudy.beforeAfter,
                            caption: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. Conversion of empty structural partition into a living coral reef"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 7: SEO Governance */}
              {caseStudyStep === 7 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-1">SEO Title Override</label>
                    <input
                      type="text"
                      value={editingCaseStudy.seoTitle || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, seoTitle: e.target.value })}
                      placeholder="Custom page title (defaults to Title — Architectural Living Reef)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      value={editingCaseStudy.seoDescription || ''}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, seoDescription: e.target.value })}
                      placeholder="Compelling meta description for search snippets..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="cs_noindex"
                      checked={editingCaseStudy.noIndex || false}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, noIndex: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <label htmlFor="cs_noindex" className="text-slate-300">
                      noindex (Hide from search engines while maintaining public accessibility)
                    </label>
                  </div>
                </div>
              )}

              {/* Step 8: Review & Save */}
              {caseStudyStep === 8 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                      Case Study Review Summary
                    </span>
                    <div className="text-xs space-y-1">
                      <p>
                        <span className="text-slate-500">Title:</span>{' '}
                        <span className="text-white font-semibold">{editingCaseStudy.title || 'Missing'}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Scale:</span>{' '}
                        <span className="text-white">{editingCaseStudy.scale || 'Missing'}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Space:</span>{' '}
                        <span className="text-white">{editingCaseStudy.space || 'Missing'}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Status:</span>{' '}
                        <span className="text-cyan-300 uppercase">{editingCaseStudy.status || 'draft'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="cs_featured"
                      checked={editingCaseStudy.featured || false}
                      onChange={(e) => setEditingCaseStudy({ ...editingCaseStudy, featured: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <label htmlFor="cs_featured" className="text-slate-300">
                      Editorial Feature (Prioritized display in portfolio)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCaseStudyStep(Math.max(1, caseStudyStep - 1))}
                disabled={caseStudyStep === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 text-xs"
              >
                ← Back
              </button>

              <div className="flex items-center gap-2">
                {caseStudyStep < 8 ? (
                  <button
                    type="button"
                    onClick={() => setCaseStudyStep(Math.min(8, caseStudyStep + 1))}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700"
                  >
                    Next →
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveCaseStudy(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveCaseStudy(true)}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs disabled:opacity-50"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish to Portfolio'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CLIENT PROJECT EDITOR ───────────────────────────────── */}
      {isProjectModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0b121a] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                  CLIENT PROJECT RECORD // CONFIDENTIAL
                </span>
                <h3 className="text-base font-bold text-white">
                  {editingProject.projectName || 'New Client Commission'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={editingProject.projectName || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, projectName: e.target.value })}
                    placeholder="e.g. Alipore Penthouse Monolith"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Project Code</label>
                  <input
                    type="text"
                    value={editingProject.id || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, id: e.target.value })}
                    placeholder="e.g. CP-2026-004 (Auto if blank)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">City *</label>
                  <input
                    type="text"
                    value={editingProject.city || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, city: e.target.value })}
                    placeholder="e.g. Kolkata"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Site Type</label>
                  <select
                    value={editingProject.siteType || 'residential'}
                    onChange={(e) => setEditingProject({ ...editingProject, siteType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="institutional">Institutional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Aquarium Volume</label>
                  <input
                    type="text"
                    value={editingProject.aquariumVolume || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, aquariumVolume: e.target.value })}
                    placeholder="e.g. 7800L"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* STRICT PRIVACY SECTION */}
              <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                    CONFIDENTIAL CLIENT INFORMATION — STRICTLY PRIVATE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Client identity, phone numbers, emails, and internal pricing are isolated in the private database and NEVER serialized to public APIs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-400 mb-1">Client Contact Name</label>
                    <input
                      type="text"
                      value={editingProject.clientName || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, clientName: e.target.value })}
                      placeholder="Private client name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Client Phone</label>
                    <input
                      type="text"
                      value={editingProject.clientPhone || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, clientPhone: e.target.value })}
                      placeholder="+91..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Client Email</label>
                    <input
                      type="email"
                      value={editingProject.clientEmail || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, clientEmail: e.target.value })}
                      placeholder="client@private..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Confidential Site Address</label>
                  <input
                    type="text"
                    value={editingProject.privateAddress || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, privateAddress: e.target.value })}
                    placeholder="Private address details..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Internal Notes &amp; Logistics</label>
                  <textarea
                    rows={2}
                    value={editingProject.internalNotes || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, internalNotes: e.target.value })}
                    placeholder="Internal maintenance agreements, engineering access details..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveProject}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Client Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CONFIRMATION PROMPTS ────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b121a] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">
              {confirmAction.type === 'publish' && 'Publish Case Study to Portfolio?'}
              {confirmAction.type === 'unpublish' && 'Unpublish Case Study?'}
              {confirmAction.type === 'archive_cs' && 'Archive Case Study?'}
              {confirmAction.type === 'duplicate_cs' && 'Duplicate Case Study?'}
              {confirmAction.type === 'archive_cp' && 'Archive Client Project?'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Target: <strong className="text-cyan-400 font-mono">{confirmAction.title}</strong>
              <br />
              {confirmAction.type === 'publish' &&
                'This will make the case study publicly accessible on /our-worlds and indexable by search engines.'}
              {confirmAction.type === 'unpublish' &&
                'The case study will revert to draft state and immediately become inaccessible to public visitors.'}
              {confirmAction.type === 'archive_cs' &&
                'The case study will be removed from the public website while retaining historical records in Control OS.'}
              {confirmAction.type === 'duplicate_cs' &&
                'A safe duplicate draft will be created with a new unique slug, allowing rapid story creation.'}
              {confirmAction.type === 'archive_cp' &&
                'The client project will be moved to archived state.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (confirmAction.type === 'publish') handleCaseStudyAction('publish', confirmAction.targetId);
                  else if (confirmAction.type === 'unpublish') handleCaseStudyAction('unpublish', confirmAction.targetId);
                  else if (confirmAction.type === 'archive_cs') handleCaseStudyAction('archive', confirmAction.targetId);
                  else if (confirmAction.type === 'duplicate_cs') handleCaseStudyAction('duplicate', confirmAction.targetId);
                  else if (confirmAction.type === 'archive_cp') handleProjectArchive(confirmAction.targetId, 'archive');
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper Renderer: Case Studies Table & Mobile Cards
  function renderCaseStudiesTable(items: CaseStudyItem[]) {
    if (items.length === 0) {
      return (
        <div className="p-8 rounded-2xl border border-slate-800/80 bg-[#0b121a] text-center text-xs text-slate-500">
          No case studies match current query.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Desktop Table */}
        <div className="hidden md:block rounded-2xl border border-slate-800 bg-[#0b121a] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Exhibit</th>
                <th className="py-3 px-4">Scale / Biome</th>
                <th className="py-3 px-4">Publication</th>
                <th className="py-3 px-4">Media</th>
                <th className="py-3 px-4">SEO</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {items.map((cs) => (
                <tr key={cs.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cs.image}
                        alt={cs.title}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                      <div>
                        <span className="font-semibold text-white block hover:text-cyan-300">
                          {cs.title}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          /{cs.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-white block">{cs.scale}</span>
                    <span className="text-[11px] text-slate-400 block">{cs.biome || 'Indo-Pacific Biotope'}</span>
                  </td>
                  <td className="py-3 px-4">
                    {cs.isArchived ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                        Archived
                      </span>
                    ) : cs.published ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        cs.imageStatus === 'VERIFIED'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {cs.imageStatus || 'VERIFIED'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-400 block">
                      {cs.seoTitle ? '✓ Custom Title' : '• Auto Title'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {cs.noIndex ? 'noindex' : 'indexable'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/our-worlds/${cs.slug}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px]"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCaseStudy(cs);
                          setCaseStudyStep(1);
                          setIsCaseStudyModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: 'duplicate_cs',
                            targetId: cs.id,
                            title: cs.title,
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                        title="Safe Duplicate"
                      >
                        Copy
                      </button>
                      {cs.published ? (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'unpublish',
                              targetId: cs.id,
                              title: cs.title,
                            })
                          }
                          className="px-2 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-[11px] border border-amber-500/30"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'publish',
                              targetId: cs.id,
                              title: cs.title,
                            })
                          }
                          className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-[11px] border border-emerald-500/30"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="md:hidden space-y-3">
          {items.map((cs) => (
            <div
              key={cs.id}
              className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-3"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cs.image}
                  alt={cs.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{cs.title}</h4>
                  <span className="text-[11px] font-mono text-cyan-400 block truncate">/{cs.slug}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300">
                      {cs.scale}
                    </span>
                    {cs.published ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5">
                <Link
                  href={`/our-worlds/${cs.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-300 text-xs"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCaseStudy(cs);
                    setCaseStudyStep(1);
                    setIsCaseStudyModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Helper Renderer: Client Projects Table & Mobile Cards
  function renderClientProjectsTable(items: ClientProjectItem[]) {
    if (items.length === 0) {
      return (
        <div className="p-8 rounded-2xl border border-slate-800/80 bg-[#0b121a] text-center text-xs text-slate-500">
          No client projects found.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="hidden md:block rounded-2xl border border-slate-800 bg-[#0b121a] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Volume</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4">Case Study Link</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {items.map((cp) => (
                <tr key={cp.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">{cp.id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{cp.projectName}</td>
                  <td className="py-3 px-4">
                    <span className="text-white block">{cp.city}</span>
                    <span className="text-[11px] text-slate-400 capitalize">{cp.siteType}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{cp.aquariumVolume || '—'}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {cp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {cp.caseStudyId ? (
                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <span>✓ Linked:</span>
                        <span className="text-slate-300 truncate max-w-[120px]">{cp.caseStudyId}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateCaseStudyFromProject(cp.id)}
                        className="text-[11px] font-mono text-cyan-400 hover:underline"
                      >
                        + Create Case Study
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(cp);
                          setProjectStep(1);
                          setIsProjectModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: 'archive_cp',
                            targetId: cp.id,
                            title: cp.projectName,
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 text-[11px]"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Project Cards */}
        <div className="md:hidden space-y-3">
          {items.map((cp) => (
            <div key={cp.id} className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{cp.id}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {cp.status}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white">{cp.projectName}</h4>
              <p className="text-xs text-slate-400">
                {cp.city} • {cp.aquariumVolume || 'Custom volume'}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProject(cp);
                    setProjectStep(1);
                    setIsProjectModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs"
                >
                  Edit Project
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
