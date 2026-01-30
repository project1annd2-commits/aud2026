import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Phone, Trash2, Edit2, Activity, Award, Play } from 'lucide-react';
import { Mentor, Audit } from '../types';
import { storage } from '../utils/storage';
import { calculatePercentage } from '../utils/helpers';
import AddMentorModal from './AddMentorModal';
import EditMentorModal from './EditMentorModal';
import AuditModal from './AuditModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface MentorManagerProps {
  schoolId: string;
  currentEmployee?: any;
}

const MentorManager: React.FC<MentorManagerProps> = ({ schoolId, currentEmployee }) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [showAddMentor, setShowAddMentor] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [editMentor, setEditMentor] = useState<Mentor | null>(null);
  const [deleteMentor, setDeleteMentor] = useState<Mentor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadMentors = async () => {
    try {
      setIsLoading(true);
      const mentorsData = await storage.getMentorsBySchool(schoolId);
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
    } catch (error) {
      console.error('Error loading mentors:', error);
      setMentors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMentors();
  }, [schoolId]);

  const handleAddMentor = async (mentor: Mentor) => {
    try {
      await storage.addMentor(mentor);
      await loadMentors();
      setShowAddMentor(false);
    } catch (error) {
      console.error('Error adding mentor:', error);
    }
  };

  const handleUpdateMentor = async (updatedMentor: Mentor) => {
    try {
      await storage.updateMentor(updatedMentor);
      await loadMentors();
      setEditMentor(null);
    } catch (error) {
      console.error('Error updating mentor:', error);
    }
  };

  const handleDeleteMentor = async () => {
    if (!deleteMentor) return;

    setIsDeleting(true);
    try {
      await storage.deleteMentor(deleteMentor.id);
      await loadMentors();
      setDeleteMentor(null);
    } catch (error) {
      console.error('Error deleting mentor:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = (_mentor: Mentor) => {
    if (!currentEmployee) return false;
    return currentEmployee.role === 'admin' || currentEmployee.role === 'employee';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--accent-emerald)] font-bold text-[10px] uppercase tracking-widest">Synchronizing board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-600/20">
            <UserCheck size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Mentorship Board</h3>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{mentors.length} Specialist Mentors active</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddMentor(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} />
          Add Mentor
        </button>
      </div>

      {mentors.length > 0 ? (
        <div className="grid gap-6">
          {mentors.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              canDelete={canDelete(mentor)}
              onDelete={() => setDeleteMentor(mentor)}
              onStartAudit={() => setSelectedMentor(mentor)}
              onEdit={() => setEditMentor(mentor)}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/5">
          <UserCheck className="mx-auto mb-4 text-[var(--border-primary)]" size={48} />
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest mb-6">No mentor records found for this institution</p>
          <button
            onClick={() => setShowAddMentor(true)}
            className="bg-[var(--accent-emerald)]/10 hover:bg-[var(--accent-emerald)] text-[var(--accent-emerald)] hover:text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-[10px] transition-all border border-[var(--accent-emerald)]/20"
          >
            Register Primary Mentor
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddMentor && (
        <AddMentorModal
          schoolId={schoolId}
          onAdd={handleAddMentor}
          onClose={() => setShowAddMentor(false)}
        />
      )}

      {editMentor && (
        <EditMentorModal
          mentor={editMentor}
          onSave={handleUpdateMentor}
          onClose={() => setEditMentor(null)}
        />
      )}

      {selectedMentor && (
        <AuditModal
          type="mentor"
          subject={selectedMentor}
          schoolId={schoolId}
          onClose={() => {
            setSelectedMentor(null);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {deleteMentor && (
        <ConfirmDeleteModal
          isOpen={true}
          title="REMOVE MENTOR"
          message="Are you sure you want to remove this mentor? This will permanently delete their profile and all associated interaction logs."
          itemName={deleteMentor.name}
          onConfirm={handleDeleteMentor}
          onCancel={() => setDeleteMentor(null)}
          isDeleting={isDeleting}
          cascadeInfo={[]}
        />
      )}
    </div>
  );
};

const MentorCard: React.FC<{
  mentor: Mentor;
  canDelete: boolean;
  onDelete: () => void;
  onStartAudit: () => void;
  onEdit: () => void;
  refreshKey?: number;
}> = ({ mentor, canDelete, onDelete, onStartAudit, onEdit, refreshKey }) => {
  const [latestAudit, setLatestAudit] = useState<Audit | null>(null);
  const [allAudits, setAllAudits] = useState<Audit[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);

  useEffect(() => {
    const loadAuditInfo = async () => {
      try {
        setIsLoadingAudits(true);
        const audits = await storage.getAuditsBySubject(mentor.id);
        const sortedAudits = audits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllAudits(sortedAudits);
        setLatestAudit(sortedAudits[0] || null);
      } catch (error) {
        console.error('Error loading audit info:', error);
      } finally {
        setIsLoadingAudits(false);
      }
    };
    loadAuditInfo();
  }, [mentor.id, refreshKey]);

  return (
    <div className="group relative bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] rounded-[2.5rem] p-8 border border-[var(--border-primary)] hover:border-[var(--accent-emerald)]/30 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-emerald)]/5 rounded-full blur-3xl group-hover:scale-150 transition-all"></div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--accent-emerald)]/10 rounded-2xl blur-lg"></div>
              <div className="relative w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.id + 100}`} alt="avatar" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{mentor.name}</h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={onEdit} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-emerald)] transition-all"><Edit2 size={12} /></button>
                  {canDelete && <button onClick={onDelete} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-all"><Trash2 size={12} /></button>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-emerald)]/70 uppercase">
                  <Award size={10} /> {mentor.expertise} • {mentor.qualification}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onStartAudit}
              className="flex items-center gap-2 bg-[var(--accent-emerald)] hover:bg-emerald-500 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-emerald-600/10 active:scale-95"
            >
              <Play size={14} />
              {latestAudit && latestAudit.versions.some(v => v.isDraft) ? 'Resume Assessment' : 'New Assessment'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-white/5">
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Phone size={10} /> Contact Details</div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">{mentor.phone}</div>
            {mentor.email && <div className="text-[10px] font-medium text-[var(--text-muted)] truncate">{mentor.email}</div>}
          </div>

          <div className="lg:col-span-2">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-4"><Activity size={10} /> Interaction History</div>
            {!isLoadingAudits && (
              <div className="flex flex-wrap gap-4">
                {allAudits.length > 0 ? (
                  allAudits.slice(0, 2).map((audit, i) => {
                    const latestVer = audit.versions[audit.currentVersion];
                    const percentage = calculatePercentage(latestVer.totalScore, latestVer.maxScore);
                    return (
                      <div key={audit.id} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-4 min-w-[200px] hover:border-[var(--accent-emerald)]/20 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Log {allAudits.length - i}</span>
                          <span className="text-[9px] font-mono text-[var(--accent-emerald)] opacity-50">#{audit.accessCode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-1 flex-1 bg-[var(--border-primary)] rounded-full overflow-hidden mr-3">
                            <div className={`h-full ${percentage >= 80 ? 'bg-[var(--accent-emerald)]' : 'bg-[var(--accent-primary)]'}`} style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className={`text-sm font-bold ${percentage >= 80 ? 'text-[var(--accent-emerald)]' : 'text-[var(--accent-primary)]'}`}>{percentage}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[10px] font-mono text-gray-700 uppercase">No activity logs recorded</div>
                )}
                {allAudits.length > 2 && <div className="flex items-center text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">+{allAudits.length - 2} archives</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorManager;