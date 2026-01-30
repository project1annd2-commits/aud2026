import React, { useState, useEffect } from 'react';
import { Play, Trash2, Edit2, Database, Activity, Clock } from 'lucide-react';
import { InfrastructureAudit } from '../types';
import { database } from '../utils/database';
import { formatDate } from '../utils/helpers';
import InfrastructureAuditModal from './InfrastructureAuditModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface InfrastructureManagerProps {
  schoolId: string;
  currentEmployee?: any;
}

const InfrastructureManager: React.FC<InfrastructureManagerProps> = ({ schoolId, currentEmployee }) => {
  const [audit, setAudit] = useState<InfrastructureAudit | undefined>();
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        setIsLoading(true);
        const auditData = await database.getInfrastructureAuditBySchool(schoolId);
        setAudit(auditData || undefined);
      } catch (error) {
        console.error('Error fetching infrastructure audit:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudit();
  }, [schoolId]);

  const handleAuditComplete = async () => {
    try {
      const auditData = await database.getInfrastructureAuditBySchool(schoolId);
      setAudit(auditData || undefined);
      setShowAuditModal(false);
    } catch (error) {
      console.error('Error refreshing infrastructure audit:', error);
    }
  };

  const handleDeleteAudit = async () => {
    if (!audit) return;
    setIsDeleting(true);
    try {
      await database.deleteInfrastructureAudit(audit.id);
      setAudit(undefined);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting infrastructure audit:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditAccessCode = async () => {
    if (!audit) return;
    const currentCode = audit.accessCode;
    const newCode = prompt(`RE-CODE PROTOCOL: Enter new access code (Current: ${currentCode}):`, currentCode);
    if (!newCode || newCode === currentCode) return;
    if (newCode.length < 4) {
      alert('Violation: Access code must be > 4 digits.');
      return;
    }
    try {
      setIsLoading(true);
      const existing = await database.getAuditByAccessCode(newCode);
      if (existing && existing.id !== audit.id) {
        alert('Conflict: Code in use.');
        setIsLoading(false);
        return;
      }
      await database.updateInfrastructureAudit({ ...audit, accessCode: newCode });
      const updatedAudit = await database.getInfrastructureAuditBySchool(schoolId);
      setAudit(updatedAudit || undefined);
    } catch (error) {
      console.error('Error updating access code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canDelete = () => {
    if (!currentEmployee || !audit) return false;
    return currentEmployee.role === 'admin';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--accent-primary)] font-bold text-[10px] uppercase tracking-widest">Loading Infrastructure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-600/20">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Infrastructure Portfolio</h3>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Building & Asset Management Logs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {audit && canDelete() && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-600/10 active:scale-95"
          >
            <Play size={16} />
            {audit?.versions[audit.currentVersion]?.isDraft ? 'Resume Assessment' : audit ? 'Update Assessment' : 'New Assessment'}
          </button>
        </div>
      </div>

      {audit ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--bg-surface)] p-8 rounded-[2.5rem] border border-[var(--border-primary)] relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-3xl group-hover:scale-150 transition-all"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-[var(--accent-primary)]" /> Current Performance
                </h4>
                {audit.versions[audit.currentVersion]?.isDraft && (
                  <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/10 text-yellow-600 text-[8px] font-bold uppercase tracking-widest animate-pulse">
                    Assessment in Progress
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Overall Score</div>
                  <div className="flex items-end gap-3">
                    <div className={`text-4xl font-bold font-mono ${Math.round((audit.versions[audit.currentVersion]?.totalScore / audit.versions[audit.currentVersion]?.maxScore) * 100) >= 80 ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-primary)]'}`}>
                      {Math.round((audit.versions[audit.currentVersion]?.totalScore / audit.versions[audit.currentVersion]?.maxScore) * 100)}%
                    </div>
                    <div className="text-xs font-bold text-[var(--text-muted)] mb-1">{audit.versions[audit.currentVersion]?.totalScore} / {audit.versions[audit.currentVersion]?.maxScore} PTS</div>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-[var(--accent-primary)]" style={{ width: `${(audit.versions[audit.currentVersion]?.totalScore / audit.versions[audit.currentVersion]?.maxScore) * 100}%` }}></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Assessment ID</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-[var(--accent-primary)]">#{audit.accessCode}</div>
                      {canDelete() && (
                        <button onClick={handleEditAccessCode} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><Edit2 size={12} /></button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-primary)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Audit History</div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">{audit.versions?.filter(v => !v.isDraft).length || 0} COMPLETED</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-6 rounded-[2.5rem] border border-[var(--border-primary)] shadow-sm">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-6"><Clock size={14} /> Revision History</div>
            <div className="space-y-3">
              {audit.versions.map((version, index) => (
                <div key={version.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[10px]">
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--text-secondary)] uppercase tracking-wider">Cycle {index + 1}</span>
                    <span className="text-[var(--text-muted)] mt-0.5">{formatDate(version.timestamp)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[var(--text-primary)]">{Math.round((version.totalScore / version.maxScore) * 100)}%</div>
                    {version.isDraft && <span className="text-yellow-600 font-bold uppercase tracking-widest mt-0.5 block" style={{ fontSize: '7px' }}>Draft</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/5">
          <Database className="mx-auto mb-4 text-[var(--border-primary)]" size={48} />
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest mb-6">No infrastructure records found for this institution</p>
          <button
            onClick={() => setShowAuditModal(true)}
            className="bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-[10px] transition-all border border-[var(--accent-primary)]/20"
          >
            Start New Assessment
          </button>
        </div>
      )}

      {/* Modals */}
      {showAuditModal && (
        <InfrastructureAuditModal
          schoolId={schoolId}
          existingAudit={audit}
          onComplete={handleAuditComplete}
          onClose={() => setShowAuditModal(false)}
        />
      )}

      {showDeleteModal && audit && (
        <ConfirmDeleteModal
          isOpen={true}
          title="DELETE ASSESSMENT"
          message="Are you sure you want to delete this infrastructure assessment? This will permanently remove all historical revision data."
          itemName="Infrastructure Portfolio"
          onConfirm={handleDeleteAudit}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
          cascadeInfo={[]}
        />
      )}
    </div>
  );
};

export default InfrastructureManager;