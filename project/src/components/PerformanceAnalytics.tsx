import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, UserCheck, Award, Target, Activity, Building, Database, ArrowUpRight, ArrowDownRight, LayoutDashboard, Search, RefreshCw, BarChart3 } from 'lucide-react';
import { Employee } from '../types';
import { storage } from '../utils/storage';
import { calculatePercentage, calculateAdjustedScore } from '../utils/helpers';
import { teacherAuditCriteria, mentorAuditCriteria, infrastructureAuditCriteria } from '../data/auditCriteria';

interface PerformanceAnalyticsProps {
  currentEmployee: Employee;
}

interface AuditData {
  id: string;
  type: 'teacher' | 'mentor' | 'infrastructure';
  subjectName: string;
  schoolName: string;
  versions: {
    timestamp: string;
    percentage: number;
    totalScore: number;
    maxScore: number;
    auditNumber: number;
  }[];
  latestPercentage: number;
  trend: 'improving' | 'stable' | 'declining';
  improvementRate: number;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ currentEmployee }) => {
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'comparison'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAnalyticsData();
  }, [currentEmployee]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      const [schoolsData, allAudits, allInfraAudits] = await Promise.all([
        currentEmployee.role === 'admin' ? storage.getSchools() : storage.getSchoolsByEmployee(currentEmployee.username),
        storage.getAudits(),
        storage.getInfrastructureAudits()
      ]);

      const teacherPromises = schoolsData.map(school => storage.getTeachersBySchool(school.id));
      const mentorPromises = schoolsData.map(school => storage.getMentorsBySchool(school.id));

      const [teacherResults, mentorResults] = await Promise.all([
        Promise.all(teacherPromises),
        Promise.all(mentorPromises)
      ]);

      const allTeachers = teacherResults.flat();
      const allMentors = mentorResults.flat();

      const userSchoolIds = schoolsData.map(s => s.id);
      const userAudits = allAudits.filter(audit => userSchoolIds.includes(audit.schoolId));
      const userInfraAudits = allInfraAudits.filter(audit => userSchoolIds.includes(audit.schoolId));

      const processedData: AuditData[] = [];

      userAudits.forEach(audit => {
        const school = schoolsData.find(s => s.id === audit.schoolId);
        let subjectName = '';

        if (audit.type === 'teacher') {
          const teacher = allTeachers.find(t => t.id === audit.subjectId);
          subjectName = teacher?.name || 'Unknown Teacher';
        } else {
          const mentor = allMentors.find(m => m.id === audit.subjectId);
          subjectName = mentor?.name || 'Unknown Mentor';
        }

        const completedVersions = audit.versions.filter(v => !v.isDraft);

        if (completedVersions.length > 0) {
          const criteria = audit.type === 'teacher' ? teacherAuditCriteria : mentorAuditCriteria;

          const versions = completedVersions.map((version, index) => {
            const { totalScore, maxScore } = calculateAdjustedScore(version.responses, criteria);
            return {
              timestamp: version.timestamp,
              percentage: calculatePercentage(totalScore, maxScore),
              totalScore,
              maxScore,
              auditNumber: index + 1
            };
          }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          let trend: 'improving' | 'stable' | 'declining' = 'stable';
          let improvementRate = 0;

          if (versions.length > 1) {
            improvementRate = versions[versions.length - 1].percentage - versions[0].percentage;
            if (improvementRate > 5) trend = 'improving';
            else if (improvementRate < -5) trend = 'declining';
          }

          processedData.push({
            id: audit.id,
            type: audit.type,
            subjectName,
            schoolName: school?.name || 'Unknown School',
            versions,
            latestPercentage: versions[versions.length - 1].percentage,
            trend,
            improvementRate
          });
        }
      });

      userInfraAudits.forEach(audit => {
        const school = schoolsData.find(s => s.id === audit.schoolId);
        const completedVersions = audit.versions.filter(v => !v.isDraft);

        if (completedVersions.length > 0) {
          const versions = completedVersions.map((version, index) => {
            const { totalScore, maxScore } = calculateAdjustedScore(version.responses, infrastructureAuditCriteria);
            return {
              timestamp: version.timestamp,
              percentage: calculatePercentage(totalScore, maxScore),
              totalScore,
              maxScore,
              auditNumber: index + 1
            };
          }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          let trend: 'improving' | 'stable' | 'declining' = 'stable';
          let improvementRate = 0;

          if (versions.length > 1) {
            improvementRate = versions[versions.length - 1].percentage - versions[0].percentage;
            if (improvementRate > 5) trend = 'improving';
            else if (improvementRate < -5) trend = 'declining';
          }

          processedData.push({
            id: audit.id,
            type: 'infrastructure',
            subjectName: 'Infrastructure',
            schoolName: school?.name || 'Unknown School',
            versions,
            latestPercentage: versions[versions.length - 1].percentage,
            trend,
            improvementRate
          });
        }
      });

      setAuditData(processedData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => ({
    totalAudits: auditData.reduce((sum, item) => sum + item.versions.length, 0),
    averageScore: auditData.length > 0
      ? Math.round(auditData.reduce((sum, item) => sum + item.latestPercentage, 0) / auditData.length)
      : 0,
    improving: auditData.filter(item => item.trend === 'improving').length,
    stable: auditData.filter(item => item.trend === 'stable').length,
    declining: auditData.filter(item => item.trend === 'declining').length,
    multipleAudits: auditData.filter(item => item.versions.length > 1).length
  }), [auditData]);

  const filteredAuditData = useMemo(() => {
    return auditData.filter(item =>
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [auditData, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest animate-pulse">Aggregating Global Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-wider mb-4">
            <BarChart3 size={12} /> Performance Insights
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">System <span className="text-[var(--accent-primary)]">Analytics</span></h1>
          <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Institutional Performance & Reliability Tracking</p>
        </div>

        <div className="flex bg-[var(--bg-primary)] p-1.5 rounded-xl border border-[var(--border-primary)] shadow-sm">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'trends', icon: Activity, label: 'Growth' },
            { id: 'comparison', icon: Target, label: 'Benchmarks' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-[var(--accent-primary)] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Audits', val: stats.totalAudits, icon: RefreshCw, color: 'indigo', desc: 'System total' },
              { label: 'Average Score', val: `${stats.averageScore}%`, icon: Target, color: 'emerald', desc: 'Network average' },
              { label: 'Recurring Data', val: stats.multipleAudits, icon: Database, color: 'blue', desc: 'Sync points' },
              { label: 'Improving', val: stats.improving, icon: ArrowUpRight, color: 'emerald', desc: 'Positive trends' }
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm group hover:border-[var(--accent-primary)] transition-all overflow-hidden relative">
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                      <stat.icon size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-1">{stat.val}</div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)]">{stat.label}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-2 font-medium">{stat.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Distribution */}
          <div className="glass-card rounded-[2rem] p-8 border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Performance Spectrum</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Improving', val: stats.improving, icon: TrendingUp, color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-400', desc: 'Significant Growth' },
                { label: 'Operational', val: stats.stable, icon: Award, color: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-400', desc: 'Stable Flux' },
                { label: 'Critical', val: stats.declining, icon: TrendingDown, color: 'red', bg: 'bg-red-500/10', text: 'text-red-400', desc: 'Priority Focus' }
              ].map((cat, i) => (
                <div key={i} className={`p-6 rounded-2xl ${cat.bg} border border-${cat.color}-500/20 flex flex-col items-center text-center group hover:scale-105 transition-transform`}>
                  <cat.icon size={32} className={`${cat.text} mb-4 group-hover:animate-bounce`} />
                  <div className={`text-4xl font-black font-mono ${cat.text} tracking-tighter`}>{cat.val}</div>
                  <div className="text-sm font-black text-white uppercase tracking-widest mt-2">{cat.label}</div>
                  <p className="text-[10px] font-mono opacity-50 uppercase mt-1">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-8">
          <div className="glass-card rounded-[2rem] p-8 border-white/10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-600/20">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Timeline Analytics</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Growth trajectories of top subjects</p>
                </div>
              </div>
            </div>

            {auditData.length > 0 ? (
              <div className="space-y-12">
                {/* Simplified Trend Visualization */}
                <div className="grid grid-cols-1 gap-6">
                  {auditData.filter(item => item.versions.length > 1).slice(0, 5).map((item, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-white/5">
                            {item.type === 'teacher' ? <Users size={18} className="text-blue-400" /> : <UserCheck size={18} className="text-emerald-400" />}
                          </div>
                          <div>
                            <div className="text-sm font-black text-white uppercase tracking-tight">{item.subjectName}</div>
                            <div className="text-[10px] font-mono text-gray-500 uppercase">{item.schoolName}</div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black font-mono ${item.improvementRate >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {item.improvementRate >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {Math.abs(Math.round(item.improvementRate))}%
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {item.versions.map((v, vi) => (
                          <div key={vi} className="flex-1">
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                              <div className={`h-full ${v.percentage >= 80 ? 'bg-emerald-500' : v.percentage >= 60 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${v.percentage}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase">
                              <span>Rev 0{v.auditNumber}</span>
                              <span className="text-white">{v.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                <Activity size={48} className="mx-auto text-gray-800 mb-4 animate-pulse" />
                <p className="text-gray-500 font-mono uppercase tracking-[0.2em] text-sm">Awaiting Multi-cycle Data...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="space-y-8">
          <div className="glass-card rounded-[2rem] p-8 border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-600/10 text-purple-400 border border-purple-600/20">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Precision Mapping</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Compare individual operator efficiency</p>
                </div>
              </div>

              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="FILTER BY OPERATOR/SECTOR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/5 rounded-xl focus:border-blue-500 focus:bg-white/10 text-xs font-mono text-white transition-all uppercase placeholder:text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAuditData.length > 0 ? (
                filteredAuditData.map((item, i) => (
                  <div key={i} className="group glass-card p-6 rounded-2xl border-white/5 hover:border-blue-500/20 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform ${item.type === 'teacher' ? 'bg-blue-500/10 text-blue-400' : item.type === 'mentor' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {item.type === 'teacher' ? <Users size={20} /> : item.type === 'mentor' ? <UserCheck size={20} /> : <Building size={20} />}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white uppercase tracking-tight">{item.subjectName}</div>
                        <div className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-2">
                          <Building size={10} /> {item.schoolName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold font-mono ${item.latestPercentage >= 80 ? 'text-emerald-400' : item.latestPercentage >= 60 ? 'text-blue-400' : 'text-red-400'}`}>
                        {item.latestPercentage}%
                      </div>
                      <div className="text-[8px] font-mono text-gray-600 uppercase">{item.versions.length} CYCLES</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <Search size={32} className="mx-auto text-gray-800 mb-3" />
                  <p className="text-gray-600 font-mono text-xs uppercase">No matches found in database</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;