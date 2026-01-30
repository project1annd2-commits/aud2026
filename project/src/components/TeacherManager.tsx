import React, { useState, useEffect } from 'react';
import { Users, Plus, Phone, BookOpen, Play, Trash2, Edit2, Copy, Activity } from 'lucide-react';
import { Teacher, Audit } from '../types';
import { storage } from '../utils/storage';
import { calculatePercentage } from '../utils/helpers';
import AddTeacherModal from './AddTeacherModal';
import EditTeacherModal from './EditTeacherModal';
import AuditModal from './AuditModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface TeacherManagerProps {
  schoolId: string;
  currentEmployee?: any;
}

const TeacherManager: React.FC<TeacherManagerProps> = ({ schoolId, currentEmployee }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeachers = async () => {
    try {
      setIsLoading(true);
      const teachersData = await storage.getTeachersBySchool(schoolId);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [schoolId]);

  const handleAddTeacher = async (teacher: Teacher) => {
    try {
      await storage.addTeacher(teacher);
      await loadTeachers();
      setShowAddTeacher(false);
    } catch (error) {
      console.error('Error adding teacher:', error);
    }
  };

  const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
    try {
      await storage.updateTeacher(updatedTeacher);
      await loadTeachers();
      setEditTeacher(null);
    } catch (error) {
      console.error('Error updating teacher:', error);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacher) return;

    setIsDeleting(true);
    try {
      await storage.deleteTeacher(deleteTeacher.id);
      await loadTeachers();
      setDeleteTeacher(null);
    } catch (error) {
      console.error('Error deleting teacher:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = (_teacher: Teacher) => {
    if (!currentEmployee) return false;
    return currentEmployee.role === 'admin' || currentEmployee.role === 'employee';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--accent-primary)] font-bold text-[10px] uppercase tracking-widest">Synchronizing records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-600/20">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Staff Directory</h3>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{teachers.length} Active Instructors Registered</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddTeacher(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} />
          Add Instructor
        </button>
      </div>

      {teachers.length > 0 ? (
        <div className="grid gap-6">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              canDelete={canDelete(teacher)}
              onDelete={() => setDeleteTeacher(teacher)}
              onStartAudit={() => setSelectedTeacher(teacher)}
              onEdit={() => setEditTeacher(teacher)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/5">
          <Users className="mx-auto mb-4 text-[var(--border-primary)]" size={48} />
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest mb-6">No instructor records found for this institution</p>
          <button
            onClick={() => setShowAddTeacher(true)}
            className="bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-[10px] transition-all border border-[var(--accent-primary)]/20"
          >
            Start Instructor Database
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddTeacher && (
        <AddTeacherModal
          schoolId={schoolId}
          onAdd={handleAddTeacher}
          onClose={() => setShowAddTeacher(false)}
        />
      )}

      {editTeacher && (
        <EditTeacherModal
          teacher={editTeacher}
          onSave={handleUpdateTeacher}
          onClose={() => setEditTeacher(null)}
        />
      )}

      {selectedTeacher && (
        <AuditModal
          type="teacher"
          subject={selectedTeacher}
          schoolId={schoolId}
          onClose={() => setSelectedTeacher(null)}
        />
      )}

      {deleteTeacher && (
        <ConfirmDeleteModal
          isOpen={true}
          title="REMOVE INSTRUCTOR"
          message="Are you sure you want to remove this instructor? This will permanently delete their profile and all associated performance history."
          itemName={deleteTeacher.name}
          onConfirm={handleDeleteTeacher}
          onCancel={() => setDeleteTeacher(null)}
          isDeleting={isDeleting}
          cascadeInfo={[]}
        />
      )}
    </div>
  );
};

const TeacherCard: React.FC<{
  teacher: Teacher;
  canDelete: boolean;
  onDelete: () => void;
  onStartAudit: () => void;
  onEdit: () => void;
}> = ({ teacher, canDelete, onDelete, onStartAudit, onEdit }) => {
  const [latestAudit, setLatestAudit] = useState<Audit | null>(null);
  const [allAudits, setAllAudits] = useState<Audit[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(true);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const loadAuditInfo = async () => {
      try {
        setIsLoadingAudits(true);
        const audits = await storage.getAuditsBySubject(teacher.id);
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
  }, [teacher.id]);

  const handleCopyAccessCode = async (accessCode: string, auditId: string) => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopyStatus(prev => ({ ...prev, [auditId]: 'COPIED' }));
      setTimeout(() => setCopyStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[auditId];
        return newStatus;
      }), 2000);
    } catch (err) {
      setCopyStatus(prev => ({ ...prev, [auditId]: 'FAIL' }));
    }
  };

  return (
    <div className="group relative bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] rounded-[2.5rem] p-8 border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/30 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-3xl group-hover:scale-150 transition-all"></div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[var(--accent-primary)]/10 rounded-2xl blur-lg"></div>
              <div className="relative w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.id}`} alt="avatar" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">{teacher.name}</h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={onEdit} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-all"><Edit2 size={12} /></button>
                  {canDelete && <button onClick={onDelete} className="p-1.5 rounded-lg bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-all"><Trash2 size={12} /></button>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-primary)]/70 uppercase">
                  <BookOpen size={10} /> {teacher.subject} • {teacher.qualification}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onStartAudit}
              className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-600/10 active:scale-95"
            >
              <Play size={14} />
              {latestAudit && latestAudit.versions.some(v => v.isDraft) ? 'Resume Assessment' : 'New Assessment'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-white/5">
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Phone size={10} /> Contact Details</div>
            <div className="text-xs font-bold text-[var(--text-secondary)]">{teacher.phone}</div>
            {teacher.email && <div className="text-[10px] font-medium text-[var(--text-muted)] truncate">{teacher.email}</div>}
          </div>

          <div className="lg:col-span-2">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mb-4"><Activity size={10} /> Performance History</div>
            {!isLoadingAudits && (
              <div className="flex flex-wrap gap-4">
                {allAudits.length > 0 ? (
                  allAudits.slice(0, 2).map((audit, i) => {
                    const latestVer = audit.versions[audit.currentVersion];
                    const percentage = calculatePercentage(latestVer.totalScore, latestVer.maxScore);
                    return (
                      <div key={audit.id} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-4 min-w-[200px] hover:border-[var(--accent-primary)]/20 transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cycle {allAudits.length - i}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-[var(--accent-primary)] opacity-50">#{audit.accessCode}</span>
                            <button onClick={() => handleCopyAccessCode(audit.accessCode, audit.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                              <Copy size={10} />
                            </button>
                            {copyStatus[audit.id] && <span className="text-[8px] font-bold text-[var(--accent-emerald)]">{copyStatus[audit.id]}</span>}
                          </div>
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
                  <div className="text-[10px] font-mono text-gray-700 uppercase">No historical data recorded</div>
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

export default TeacherManager;