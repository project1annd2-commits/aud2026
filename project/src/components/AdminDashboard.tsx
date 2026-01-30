import { useState, useEffect } from 'react';
import { School as Building, Users, UserCheck, Search, Eye, LogOut, Download, Trash2, PieChart, Globe, Shield, MessageSquare, ChevronLeft, ChevronRight, Activity, RefreshCw, Database, Smartphone, Clock } from 'lucide-react';
import { School, Employee, Teacher, Mentor, Audit, InfrastructureAudit } from '../types';
import { storage } from '../utils/storage';
import { auth } from '../utils/auth';
import { formatDate, calculatePercentage, getEmployeeDisplayName } from '../utils/helpers';
import { generateSystemReportPDF } from '../utils/pdfGenerator';
import { fixDuplicateAccessCodes } from '../utils/fix_duplicate_codes';
import SchoolCard from './SchoolCard';
import ResultsViewer from './ResultsViewer';
import PerformanceAnalytics from './PerformanceAnalytics';
import StatePerformanceAnalytics from './StatePerformanceAnalytics';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import LoginHistory from './LoginHistory';
import EmployeeChatDashboard from './EmployeeChatDashboard';
import DeviceManagement from './DeviceManagement';

interface AdminDashboardProps {
  currentEmployee: Employee;
  onLogout: () => void;
}

const AdminDashboard = ({ currentEmployee, onLogout }: AdminDashboardProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [allAudits, setAllAudits] = useState<Audit[]>([]);
  const [allInfrastructureAudits, setAllInfrastructureAudits] = useState<InfrastructureAudit[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'audits' | 'results' | 'analytics' | 'stateAnalytics' | 'loginHistory' | 'support' | 'devices'>('overview');
  const [selectedAuditCode, setSelectedAuditCode] = useState<string>('');
  const [deleteAudit, setDeleteAudit] = useState<Audit | InfrastructureAudit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = currentEmployee.role === 'admin';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schoolsData, auditsData, infraAuditsData] = await Promise.all([
        storage.getSchools(),
        storage.getAudits(),
        storage.getInfrastructureAudits()
      ]);

      const schoolsArray = Array.isArray(schoolsData) ? schoolsData : [];
      const auditsArray = Array.isArray(auditsData) ? auditsData : [];
      const infraAuditsArray = Array.isArray(infraAuditsData) ? infraAuditsData : [];

      setSchools(schoolsArray);
      setAllAudits(auditsArray);
      setAllInfrastructureAudits(infraAuditsArray);

      // Load teachers and mentors for all schools
      const teachersPromises = schoolsArray.map(school => storage.getTeachersBySchool(school.id));
      const mentorsPromises = schoolsArray.map(school => storage.getMentorsBySchool(school.id));

      const [teachersResults, mentorsResults] = await Promise.all([
        Promise.all(teachersPromises),
        Promise.all(mentorsPromises)
      ]);

      const flatTeachers = teachersResults.flat().filter(teacher => teacher != null);
      const flatMentors = mentorsResults.flat().filter(mentor => mentor != null);

      setAllTeachers(Array.isArray(flatTeachers) ? flatTeachers : []);
      setAllMentors(Array.isArray(flatMentors) ? flatMentors : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setSchools([]);
      setAllTeachers([]);
      setAllMentors([]);
      setAllAudits([]);
      setAllInfrastructureAudits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await auth.logout();
    onLogout();
  };

  const handleDeleteAudit = async () => {
    if (!deleteAudit) return;

    setIsDeleting(true);
    try {
      if ('type' in deleteAudit) {
        await storage.deleteAudit(deleteAudit.id);
      } else {
        await storage.deleteInfrastructureAudit(deleteAudit.id);
      }
      setDeleteAudit(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting audit:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFixDuplicates = async () => {
    if (!confirm('This will scan for duplicate access codes and regenerate unique ones for duplicates. The original (oldest) audit will keep its code. Continue?')) {
      return;
    }

    setIsFixing(true);
    try {
      const result = await fixDuplicateAccessCodes();
      alert(result);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error fixing duplicates:', error);
      alert('Failed to fix duplicates. Check console for details.');
    } finally {
      setIsFixing(false);
    }
  };

  const handleSchoolUpdated = async () => {
    await loadData();
    if (selectedSchool) {
      const schools = await storage.getSchools();
      const updatedSchool = schools.find(s => s.id === selectedSchool.id);
      if (updatedSchool) {
        setSelectedSchool(updatedSchool);
      }
    }
  };

  const filteredSchools = schools.filter((school: School) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.createdBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getEmployeeDisplayName(school.createdBy).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.code && school.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentAudits = [...allAudits, ...allInfrastructureAudits]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 20);

  const schoolsByEmployee = schools.reduce((acc: Record<string, number>, school: School) => {
    acc[school.createdBy] = (acc[school.createdBy] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const downloadSystemReport = async () => {
    await generateSystemReportPDF(currentEmployee);
  };

  const getCascadeInfo = (audit: Audit | InfrastructureAudit) => {
    return [`${audit.versions.length} audit version${audit.versions.length > 1 ? 's' : ''}`];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] grid-pattern flex items-center justify-center relative overflow-hidden">
        <div className="space-y-6 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--accent-primary)] font-semibold uppercase tracking-widest text-xs animate-pulse">Synchronizing Data...</p>
        </div>
      </div>
    );
  }

  if (selectedSchool) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] grid-pattern text-[var(--text-primary)] selection:bg-[var(--accent-primary)]/30 relative">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-10 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-primary)] shadow-sm">
            <button
              onClick={() => setSelectedSchool(null)}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all group px-4 py-2"
            >
              <ChevronLeft size={20} />
              <span className="font-bold tracking-tight text-sm">Back to Overview</span>
            </button>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                <div className="text-right">
                  <div className="font-bold text-[var(--text-primary)] text-sm">{currentEmployee.displayName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{currentEmployee.role}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/20 shadow-sm">
                  {currentEmployee.displayName[0]}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="animate-fadeIn">
            <SchoolCard
              school={selectedSchool}
              isDetailed
              onDelete={loadData}
              onUpdate={handleSchoolUpdated}
              currentEmployee={currentEmployee}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] grid-pattern text-[var(--text-primary)] selection:bg-[var(--accent-primary)]/30 relative">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Main Header */}
        <div className="bg-[var(--bg-surface)] rounded-[2rem] border border-[var(--border-primary)] shadow-md p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-primary)]/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[var(--accent-primary)] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <Activity size={40} />
              </div>
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)]">
                  Audit<span className="text-[var(--accent-primary)]">Sync</span>
                </h1>
                <p className="text-sm font-medium text-[var(--text-muted)] mt-1">
                  Enterprise Quality Assurance & Performance Tracking
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4">
              <div className="flex items-center gap-4 bg-[var(--bg-primary)] px-6 py-3 rounded-2xl border border-[var(--border-primary)] shadow-sm">
                <div className="text-right">
                  <div className="text-sm font-bold text-[var(--text-primary)]">{currentEmployee.displayName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-success)] flex items-center justify-end gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[var(--accent-success)] rounded-full"></div>
                    Session Active
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white border border-[var(--border-primary)] flex items-center justify-center shadow-sm overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentEmployee.username}`} alt="avatar" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={handleFixDuplicates}
                    disabled={isFixing}
                    className="p-3.5 rounded-xl bg-white text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all shadow-sm"
                    title="Optimization Protocol"
                  >
                    <Shield size={20} className={isFixing ? 'animate-spin' : ''} />
                  </button>
                )}
                <button
                  onClick={downloadSystemReport}
                  className="flex items-center gap-2 bg-[var(--accent-primary)] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95"
                >
                  <Download size={18} />
                  <span>Generate Reports</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="inline-flex bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-primary)] shadow-sm">
            {[
              { id: 'overview', icon: Activity, label: 'Overview' },
              { id: 'schools', icon: Building, label: 'Schools' },
              { id: 'audits', icon: RefreshCw, label: 'Audits' },
              { id: 'results', icon: Eye, label: 'Results' },
              { id: 'analytics', icon: PieChart, label: 'Analytics' },
              { id: 'stateAnalytics', icon: Globe, label: 'Regional' },
              { id: 'loginHistory', icon: Shield, label: 'Security' },
              { id: 'devices', icon: Smartphone, label: 'Devices' },
              { id: 'support', icon: MessageSquare, label: 'Feedback' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${activeTab === tab.id
                  ? 'bg-[var(--accent-primary)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                  }`}
              >
                <tab.icon size={16} />
                <span className="hidden xl:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Viewport */}
        <div className="relative">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-fadeIn">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Active Schools', value: schools.length, icon: Building, color: 'indigo', desc: 'Managed institutions' },
                  { label: 'Field Personnel', value: allTeachers.length, icon: Users, color: 'blue', desc: 'Staff members' },
                  { label: 'Verified Mentors', value: allMentors.length, icon: UserCheck, color: 'emerald', desc: 'Support staff' },
                  { label: 'Audit Completions', value: allAudits.length + allInfrastructureAudits.length, icon: RefreshCw, color: 'sky', desc: 'Total logs' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[var(--bg-surface)] p-8 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all shadow-sm group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 border border-${stat.color}-500/10 transition-transform group-hover:scale-105`}>
                        <stat.icon size={24} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">{stat.label}</h4>
                      <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{stat.value}</div>
                      <p className="text-[11px] font-medium text-[var(--text-muted)] mt-2">{stat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Distribution */}
                <div className="lg:col-span-1 glass-card rounded-[3rem] p-10 border-[var(--border-primary)] shadow-2xl h-fit bg-[var(--bg-surface)] dark:bg-[var(--bg-glass)]">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-10 flex items-center gap-3 uppercase tracking-tight">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-[var(--accent-blue)] border border-blue-500/20">
                      <Users size={22} />
                    </div>
                    Institutional Distribution
                  </h3>
                  <div className="space-y-6">
                    {(Object.entries(schoolsByEmployee) as [string, number][]).map(([employee, count]) => (
                      <div key={employee} className="group p-5 bg-[var(--bg-glass)] rounded-[1.5rem] border border-[var(--border-primary)] hover:border-[var(--accent-blue)] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-bold text-[var(--text-secondary)] uppercase text-xs tracking-tight">{getEmployeeDisplayName(employee)}</div>
                          <div className="text-lg font-black font-mono text-[var(--accent-blue)]">{count}</div>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent-blue)] rounded-full" style={{ width: `${(count / schools.length) * 100}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-2xl p-8 border border-[var(--border-primary)] shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Activity size={20} className="text-[var(--accent-primary)]" />
                      Recent Activity Feed
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {recentAudits.slice(0, 8).map((audit) => {
                      const school = schools.find((s: School) => s.id === audit.schoolId);
                      const currentVersion = audit.versions && audit.versions[audit.currentVersion];
                      const percentage = currentVersion ? calculatePercentage(currentVersion.totalScore || 0, currentVersion.maxScore || 100) : 0;
                      let auditType = 'Infrastructure';
                      if ('type' in audit) auditType = (audit as Audit).type === 'infrastructure' ? 'Infrastructure' : 'Personnel';

                      return (
                        <div key={audit.id} className="group flex items-center justify-between p-4 bg-[var(--bg-primary)] hover:bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-[var(--border-primary)] shadow-sm ${auditType === 'Infrastructure' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {auditType === 'Infrastructure' ? <Building size={18} /> : <Users size={18} />}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[var(--text-primary)]">{school?.name}</div>
                              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5 font-medium">
                                <span className="bg-white px-2 py-0.5 rounded border border-[var(--border-primary)] text-[9px] font-bold uppercase">{auditType}</span>
                                <span>{audit.accessCode}</span>
                                <span className="opacity-30">•</span>
                                <span>{formatDate(audit.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className={`text-lg font-bold ${percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                              {percentage}%
                            </div>
                            <button
                              onClick={() => {
                                setSelectedAuditCode(audit.accessCode);
                                setActiveTab('results');
                              }}
                              className="p-2 rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-all text-[var(--text-muted)] border border-transparent hover:border-[var(--accent-primary)]"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'schools' && (
            <div className="space-y-10 animate-fadeIn">
              <div className="max-w-xl">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
                  <input
                    type="text"
                    placeholder="Search schools, locations, or codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-[var(--accent-primary)] transition-all shadow-sm text-sm font-semibold placeholder:text-[var(--text-muted)] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSchools.map((school: School) => (
                  <SchoolCard
                    key={school.id}
                    school={school}
                    onDelete={loadData}
                    onUpdate={handleSchoolUpdated}
                    currentEmployee={currentEmployee}
                    onClick={() => setSelectedSchool(school)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'schools' && (
            <div className="bg-[var(--bg-surface)] rounded-3xl p-8 border border-[var(--border-primary)] shadow-sm animate-fadeIn min-h-[600px]">
              {activeTab === 'analytics' && <PerformanceAnalytics currentEmployee={currentEmployee} />}
              {activeTab === 'stateAnalytics' && <StatePerformanceAnalytics currentEmployee={currentEmployee} />}
              {activeTab === 'results' && <ResultsViewer initialAccessCode={selectedAuditCode} />}
              {activeTab === 'loginHistory' && <LoginHistory />}
              {activeTab === 'support' && <EmployeeChatDashboard currentUser={currentEmployee} />}
              {activeTab === 'devices' && <DeviceManagement currentEmployee={currentEmployee} />}
              {activeTab === 'audits' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                      <RefreshCw size={24} className="text-[var(--accent-primary)]" />
                      Manage Audit Records
                    </h3>
                  </div>
                  <div className="grid gap-4">
                    {recentAudits.map((audit) => {
                      const school = schools.find((s: School) => s.id === audit.schoolId);
                      const currentVersion = audit.versions && audit.versions[audit.currentVersion];
                      const percentage = currentVersion ? calculatePercentage(currentVersion.totalScore || 0, currentVersion.maxScore || 100) : 0;
                      let auditType = 'infrastructure';
                      if ('type' in audit) auditType = (audit as Audit).type;

                      return (
                        <div key={audit.id} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-[var(--bg-primary)]/50 hover:bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-primary)] transition-all gap-6">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center border border-[var(--border-primary)] shadow-sm ${auditType === 'infrastructure' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              <Database size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="font-bold text-lg text-[var(--text-primary)]">{audit.accessCode}</div>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white border border-[var(--border-primary)] text-[var(--text-muted)]">{auditType}</span>
                              </div>
                              <div className="text-xs font-medium text-[var(--text-muted)] mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1.5"><Building size={12} /> {school?.name}</span>
                                <span className="opacity-30">•</span>
                                <span className="flex items-center gap-1.5"><Clock size={12} /> {formatDate(audit.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                            <div className="text-right">
                              <div className={`text-2xl font-bold tracking-tight ${percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                {percentage}%
                              </div>
                              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">Audit Score</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedAuditCode(audit.accessCode);
                                  setActiveTab('results');
                                }}
                                className="p-2.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all border border-[var(--border-primary)] shadow-sm"
                                title="View Results"
                              >
                                <Eye size={18} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteAudit(audit)}
                                  className="p-2.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 transition-all border border-[var(--border-primary)] shadow-sm"
                                  title="Delete Audit"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteAudit && (
          <ConfirmDeleteModal
            isOpen={true}
            title="Confirm Deletion"
            message="Are you sure you want to permanently delete this audit record? This action cannot be undone."
            itemName={`${'type' in deleteAudit ? deleteAudit.type : 'Infrastructure'} Audit (${deleteAudit.accessCode})`}
            onConfirm={handleDeleteAudit}
            onCancel={() => setDeleteAudit(null)}
            isDeleting={isDeleting}
            cascadeInfo={getCascadeInfo(deleteAudit)}
          />
        )}
      </div>
    </div >
  );
};

export default AdminDashboard;