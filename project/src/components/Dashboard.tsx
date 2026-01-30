import { useState, useEffect } from 'react';
import { School as Building, Users, UserCheck, Search, Plus, LogOut, User, ChevronRight, Activity, BarChart3, LayoutDashboard, MessageSquare, PieChart, RefreshCw } from 'lucide-react';
import { School, Employee, Audit } from '../types';
import { storage } from '../utils/storage';
import { auth } from '../utils/auth';
import { formatDate, calculatePercentage } from '../utils/helpers';
import SchoolCard from './SchoolCard';
import AddSchoolModal from './AddSchoolModal';
import ResultsViewer from './ResultsViewer';
import PerformanceAnalytics from './PerformanceAnalytics';
import EmployeeChatDashboard from './EmployeeChatDashboard';

interface DashboardProps {
  currentEmployee: Employee;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentEmployee, onLogout }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'analytics' | 'results' | 'support'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [allMentors, setAllMentors] = useState<any[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const userSchools = await storage.getSchoolsByEmployee(currentEmployee.username);
      setSchools(userSchools);

      const [teachers, mentors, audits, infraAudits] = await Promise.all([
        Promise.all(userSchools.map(s => storage.getTeachersBySchool(s.id))),
        Promise.all(userSchools.map(s => storage.getMentorsBySchool(s.id))),
        storage.getAudits(),
        storage.getInfrastructureAudits()
      ]);

      setAllTeachers(teachers.flat());
      setAllMentors(mentors.flat());

      const userSchoolIds = userSchools.map(s => s.id);
      const combinedAudits = [
        ...audits.filter(a => userSchoolIds.includes(a.schoolId)),
        ...infraAudits.filter(a => userSchoolIds.includes(a.schoolId))
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setRecentAudits(combinedAudits);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentEmployee.username]);

  const handleAddSchool = async (school: School) => {
    try {
      await storage.addSchool(school);
      await loadData();
      setShowAddSchool(false);
    } catch (error) {
      console.error('Failed to add school:', error);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    onLogout();
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.code && school.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest animate-pulse">Syncing Portal...</p>
        </div>
      </div>
    );
  }

  // Header Nav Content
  const renderHeader = () => (
    <div className="bg-[var(--bg-surface)] border-b border-[var(--border-primary)] sticky top-0 z-[100] transition-all">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Activity size={22} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Audit<span className="text-[var(--accent-primary)]">Sync</span>
              </div>
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Portal V2.0</div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-primary)]">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'schools', label: 'Institutions', icon: Building },
              { id: 'analytics', label: 'Analytics', icon: PieChart },
              { id: 'support', label: 'Support', icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedSchool(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-[var(--text-primary)]">{currentEmployee.displayName}</div>
              <div className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">{currentEmployee.role}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[var(--accent-primary)] border border-indigo-500/10">
              <User size={20} />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all active:scale-95"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {renderHeader()}

      <div className="max-w-[1600px] mx-auto px-6 py-10">
        {selectedSchool ? (
          <div className="space-y-8 animate-fadeIn">
            <button
              onClick={() => setSelectedSchool(null)}
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-primary)] font-bold text-sm transition-all group"
            >
              <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
              Back to Overview
            </button>
            <SchoolCard
              school={selectedSchool}
              isDetailed
              onDelete={loadData}
              onUpdate={loadData}
              currentEmployee={currentEmployee}
            />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-12 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Active Institutions', value: schools.length, icon: Building, color: 'indigo', desc: 'Managed sites' },
                    { label: 'Total Instructors', value: allTeachers.length, icon: Users, color: 'blue', desc: 'Verified staff' },
                    { label: 'Total Mentors', value: allMentors.length, icon: UserCheck, color: 'emerald', desc: 'Active Mentors' },
                    { label: 'Recent Audits', value: recentAudits.length, icon: RefreshCw, color: 'sky', desc: 'Activity count' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[var(--bg-surface)] p-8 rounded-2xl border border-[var(--border-primary)] shadow-sm group hover:border-[var(--accent-primary)] transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                          <stat.icon size={24} />
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">{stat.label}</h4>
                      <div className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{stat.value}</div>
                      <p className="text-[11px] font-medium text-[var(--text-muted)] mt-2">{stat.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-2xl p-8 border border-[var(--border-primary)] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Activity size={20} className="text-[var(--accent-primary)]" />
                        Recent Performance Data
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {recentAudits.slice(0, 6).map((audit) => {
                        const school = schools.find((s: School) => s.id === audit.schoolId);
                        const currentVersion = audit.versions && audit.versions[audit.currentVersion];
                        const percentage = currentVersion ? calculatePercentage(currentVersion.totalScore || 0, currentVersion.maxScore || 100) : 0;
                        const auditType = 'type' in audit ? (audit as Audit).type : 'Infrastructure';

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
                                  setActiveTab('results');
                                  // Pass access code
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

                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-surface)] rounded-2xl p-8 border border-[var(--border-primary)] shadow-sm">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowAddSchool(true)}
                          className="w-full flex items-center justify-between p-4 bg-[var(--bg-primary)] hover:bg-[var(--accent-primary)] hover:text-white group rounded-xl transition-all font-bold text-sm border border-[var(--border-primary)]"
                        >
                          <div className="flex items-center gap-3">
                            <Plus size={18} /> Add New Institution
                          </div>
                          <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                          onClick={() => setActiveTab('analytics')}
                          className="w-full flex items-center justify-between p-4 bg-[var(--bg-primary)] hover:bg-[var(--accent-primary)] hover:text-white group rounded-xl transition-all font-bold text-sm border border-[var(--border-primary)]"
                        >
                          <div className="flex items-center gap-3">
                            <BarChart3 size={18} /> Performance Analytics
                          </div>
                          <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button
                          onClick={() => setActiveTab('support')}
                          className="w-full flex items-center justify-between p-4 bg-[var(--bg-primary)] hover:bg-[var(--accent-primary)] hover:text-white group rounded-xl transition-all font-bold text-sm border border-[var(--border-primary)]"
                        >
                          <div className="flex items-center gap-3">
                            <MessageSquare size={18} /> Contact Admin Support
                          </div>
                          <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                      <div className="relative z-10">
                        <h4 className="text-xl font-bold mb-2">Need Assistance?</h4>
                        <p className="text-indigo-100 text-sm mb-6 font-medium">Our support team is available 24/7 for technical assistance.</p>
                        <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
                          Start Conversation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schools' && (
              <div className="space-y-10 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 max-w-xl">
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
                  <button
                    onClick={() => setShowAddSchool(true)}
                    className="flex items-center gap-2 bg-[var(--accent-primary)] text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                  >
                    <Plus size={20} /> Register Institution
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredSchools.map((school) => (
                    <SchoolCard
                      key={school.id}
                      school={school}
                      onDelete={loadData}
                      onUpdate={loadData}
                      currentEmployee={currentEmployee}
                      onClick={() => setSelectedSchool(school)}
                    />
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'analytics' || activeTab === 'results' || activeTab === 'support') && (
              <div className="bg-[var(--bg-surface)] rounded-3xl p-8 border border-[var(--border-primary)] shadow-sm animate-fadeIn min-h-[600px]">
                {activeTab === 'analytics' && <PerformanceAnalytics currentEmployee={currentEmployee} />}
                {activeTab === 'results' && <ResultsViewer />}
                {activeTab === 'support' && <EmployeeChatDashboard currentUser={currentEmployee} />}
              </div>
            )}
          </>
        )}
      </div>

      {showAddSchool && (
        <AddSchoolModal
          onAdd={handleAddSchool}
          onClose={() => setShowAddSchool(false)}
          currentEmployee={currentEmployee}
        />
      )}
    </div>
  );
};

export default Dashboard;