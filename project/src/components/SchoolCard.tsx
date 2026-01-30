import { useState, useEffect } from 'react';
import { School as Building, MapPin, Users, UserCheck, Wrench, Trash2, Edit2, Clock, ChevronRight } from 'lucide-react';
import { School, Teacher, Mentor, Audit, InfrastructureAudit } from '../types';
import { storage } from '../utils/storage';
import { formatDate, getEmployeeDisplayName } from '../utils/helpers';
import TeacherManager from './TeacherManager';
import MentorManager from './MentorManager';
import InfrastructureManager from './InfrastructureManager';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import EditSchoolModal from './EditSchoolModal';

interface SchoolCardProps {
  school: School;
  isDetailed?: boolean;
  onDelete?: () => void;
  onUpdate?: () => void;
  currentEmployee?: any;
  onClick?: () => void;
}

const SchoolCard = ({ school, isDetailed = false, onDelete, onUpdate, currentEmployee, onClick }: SchoolCardProps) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'mentors' | 'infrastructure'>('teachers');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [infraAudit, setInfraAudit] = useState<InfrastructureAudit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [teachersData, mentorsData, auditsData, infraAuditData] = await Promise.all([
          storage.getTeachersBySchool(school.id),
          storage.getMentorsBySchool(school.id),
          storage.getAudits(),
          storage.getInfrastructureAuditBySchool(school.id)
        ]);

        setTeachers(Array.isArray(teachersData) ? teachersData : []);
        setMentors(Array.isArray(mentorsData) ? mentorsData : []);

        const schoolAudits = Array.isArray(auditsData)
          ? auditsData.filter(audit => audit.schoolId === school.id)
          : [];
        setAudits(schoolAudits);

        setInfraAudit(infraAuditData || null);
      } catch (error) {
        console.error('Error loading school data:', error);
        setTeachers([]);
        setMentors([]);
        setAudits([]);
        setInfraAudit(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [school.id]);

  const canDelete = currentEmployee && (
    currentEmployee.role === 'admin' ||
    currentEmployee.username === school.createdBy
  );

  const canEdit = currentEmployee && (
    currentEmployee.role === 'admin' ||
    currentEmployee.username === school.createdBy
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await storage.deleteSchool(school.id);
      setShowDeleteModal(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting school:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (updatedSchool: School) => {
    try {
      await storage.updateSchool(updatedSchool);
      setShowEditModal(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating school:', error);
    }
  };

  const getCascadeInfo = () => {
    const info = [];
    if (teachers.length > 0) info.push(`${teachers.length} staff members`);
    if (mentors.length > 0) info.push(`${mentors.length} mentors`);
    if (audits.length > 0) info.push(`${audits.length} audit records`);
    if (infraAudit) info.push('Infrastructure audit data');
    return info;
  };

  if (isLoading) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-2xl p-6 border border-[var(--border-primary)] animate-pulse shadow-sm min-h-[200px]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[var(--bg-primary)] rounded w-32"></div>
            <div className="h-3 bg-[var(--bg-primary)] rounded w-24"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-[var(--bg-primary)] rounded-xl"></div>
          <div className="h-20 bg-[var(--bg-primary)] rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!isDetailed) {
    return (
      <div
        onClick={onClick}
        className="group relative bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 shadow-sm cursor-pointer overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-3xl group-hover:scale-150 transition-all"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] transition-transform group-hover:scale-105">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg tracking-tight group-hover:text-[var(--accent-primary)] transition-colors truncate max-w-[150px]">
                  {school.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium">
                  <MapPin size={12} />
                  {school.location}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {school.code && (
                <div className="text-[10px] font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/10 px-2 py-1 rounded-lg uppercase tracking-tight">
                  {school.code}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] text-center transition-all group-hover:bg-white group-hover:shadow-sm">
              <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{teachers.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Staff</div>
            </div>
            <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)] text-center transition-all group-hover:bg-white group-hover:shadow-sm">
              <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{mentors.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Mentors</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-[var(--text-muted)]" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Last Updated: {new Date(school.createdAt).toLocaleDateString()}</span>
            </div>
            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {showDeleteModal && (
          <ConfirmDeleteModal
            isOpen={true}
            title="Delete School"
            message="Are you sure you want to delete this school and all its data?"
            itemName={school.name}
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
            isDeleting={isDeleting}
            cascadeInfo={getCascadeInfo()}
          />
        )}

        {showEditModal && (
          <EditSchoolModal
            school={school}
            onSave={handleUpdate}
            onClose={() => setShowEditModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-[var(--bg-surface)] rounded-3xl p-8 border border-[var(--border-primary)] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-[var(--accent-primary)] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
              <Building size={48} />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
                {school.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6">
                <div className="flex items-center gap-2 text-[var(--text-muted)] font-medium text-sm">
                  <MapPin size={14} className="text-[var(--accent-primary)]" /> {school.location}
                </div>
                {school.code && (
                  <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-wider bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-primary)]">
                    ID: {school.code}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-6 mt-6 pt-4 border-t border-[var(--border-primary)] w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden border border-[var(--border-primary)]">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${school.createdBy}`} alt="avatar" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Created By</div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">{getEmployeeDisplayName(school.createdBy)}</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-[var(--border-primary)]"></div>
                <div className="text-left">
                  <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Created On</div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{formatDate(school.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px] w-full lg:w-auto">
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent-primary)] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:opacity-90 active:scale-95"
              >
                <Edit2 size={16} />
                Edit Details
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl font-bold text-sm transition-all border border-red-100 hover:bg-red-600 hover:text-white active:scale-95"
              >
                <Trash2 size={16} />
                Delete School
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-primary)] shadow-sm overflow-hidden min-h-[500px]">
        <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
          {[
            { id: 'teachers', icon: Users, color: 'indigo', label: 'Staff', count: teachers.length },
            { id: 'mentors', icon: UserCheck, color: 'emerald', label: 'Mentors', count: mentors.length },
            { id: 'infrastructure', icon: Wrench, color: 'sky', label: 'Equipment', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-5 font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id
                ? 'text-[var(--accent-primary)] border-[var(--accent-primary)] bg-white'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)] hover:bg-white/30'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-muted)]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="animate-fadeIn">
            {activeTab === 'teachers' && <TeacherManager schoolId={school.id} currentEmployee={currentEmployee} />}
            {activeTab === 'mentors' && <MentorManager schoolId={school.id} currentEmployee={currentEmployee} />}
            {activeTab === 'infrastructure' && <InfrastructureManager schoolId={school.id} currentEmployee={currentEmployee} />}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete School"
          message="Are you sure you want to permanently delete this school? All associated staff, mentors, and audit records will be removed."
          itemName={school.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
          cascadeInfo={getCascadeInfo()}
        />
      )}

      {showEditModal && (
        <EditSchoolModal
          school={school}
          onSave={handleUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default SchoolCard;