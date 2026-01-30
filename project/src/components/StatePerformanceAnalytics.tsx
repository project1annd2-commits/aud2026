import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, UserCheck, Target, Building, MapPin, Globe, BarChart3, PieChart, Database, ArrowUpRight } from 'lucide-react';
import { School, Teacher, Mentor, Employee } from '../types';
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
  schoolLocation: string;
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

interface RegionalData {
  region: string;
  schoolCount: number;
  teacherCount: number;
  mentorCount: number;
  auditCount: number;
  averageScore: number;
  improvingCount: number;
  stableCount: number;
  decliningCount: number;
}

interface DomainPerformance {
  domain: string;
  averageScore: number;
  maxScore: number;
  percentage: number;
  totalCount: number;
}

const StatePerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ currentEmployee }) => {
  const [auditData, setAuditData] = useState<AuditData[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'regional' | 'domains' | 'trends'>('overview');
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [domainPerformance, setDomainPerformance] = useState<DomainPerformance[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [currentEmployee]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);

      const [schoolsData, allAudits, allInfraAudits] = await Promise.all([
        storage.getSchools(),
        storage.getAudits(),
        storage.getInfrastructureAudits()
      ]);

      setSchools(schoolsData);

      const teacherPromises = schoolsData.map(school => storage.getTeachersBySchool(school.id));
      const mentorPromises = schoolsData.map(school => storage.getMentorsBySchool(school.id));

      const [teacherResults, mentorResults] = await Promise.all([
        Promise.all(teacherPromises),
        Promise.all(mentorPromises)
      ]);

      const allTeachers = teacherResults.flat();
      const allMentors = mentorResults.flat();

      setTeachers(allTeachers);
      setMentors(allMentors);

      const processedData: AuditData[] = [];

      [...allAudits].forEach(audit => {
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
            schoolLocation: school?.location || 'Unknown Location',
            versions,
            latestPercentage: versions[versions.length - 1].percentage,
            trend,
            improvementRate
          });
        }
      });

      allInfraAudits.forEach(audit => {
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
            schoolLocation: school?.location || 'Unknown Location',
            versions,
            latestPercentage: versions[versions.length - 1].percentage,
            trend,
            improvementRate
          });
        }
      });

      setAuditData(processedData);

      // Calculate regional stats
      const regions: Record<string, { schools: School[]; audits: AuditData[]; }> = {};
      schoolsData.forEach(school => {
        if (!regions[school.location]) regions[school.location] = { schools: [], audits: [] };
        regions[school.location].schools.push(school);
      });
      processedData.forEach(audit => {
        if (regions[audit.schoolLocation]) regions[audit.schoolLocation].audits.push(audit);
      });

      const regionalStats: RegionalData[] = Object.entries(regions).map(([region, data]) => {
        const sCount = data.schools.length;
        const sAudits = data.audits.length;
        return {
          region,
          schoolCount: sCount,
          teacherCount: data.schools.reduce((c, s) => c + allTeachers.filter(t => t.schoolId === s.id).length, 0),
          mentorCount: data.schools.reduce((c, s) => c + allMentors.filter(m => m.schoolId === s.id).length, 0),
          auditCount: sAudits,
          averageScore: sAudits > 0 ? Math.round(data.audits.reduce((sum, a) => sum + a.latestPercentage, 0) / sAudits) : 0,
          improvingCount: data.audits.filter(a => a.trend === 'improving').length,
          stableCount: data.audits.filter(a => a.trend === 'stable').length,
          decliningCount: data.audits.filter(a => a.trend === 'declining').length
        };
      });
      setRegionalData(regionalStats);

      // Domain scores
      const domainScores: Record<string, { scores: number[]; maxScores: number[] }> = {};
      [...allAudits, ...allInfraAudits].forEach(audit => {
        const latestVer = audit.versions[audit.currentVersion];
        if (latestVer && !latestVer.isDraft) {
          const criteria = ('type' in audit)
            ? (audit.type === 'teacher' ? teacherAuditCriteria : mentorAuditCriteria)
            : infrastructureAuditCriteria;

          latestVer.responses.forEach(resp => {
            const crit = criteria.find(c => c.id === resp.criteriaId);
            if (crit && resp.score > 0) {
              if (!domainScores[crit.label]) domainScores[crit.label] = { scores: [], maxScores: [] };
              domainScores[crit.label].scores.push(resp.score);
              domainScores[crit.label].maxScores.push(4);
            }
          });
        }
      });

      const domainPerf = Object.entries(domainScores).map(([domain, data]) => ({
        domain,
        averageScore: parseFloat((data.scores.reduce((s, x) => s + x, 0) / data.scores.length).toFixed(2)),
        maxScore: 4,
        percentage: calculatePercentage(data.scores.reduce((s, x) => s + x, 0), data.maxScores.reduce((s, x) => s + x, 0)),
        totalCount: data.scores.length
      }));
      setDomainPerformance(domainPerf);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const overallStats = {
    avgScore: auditData.length > 0 ? Math.round(auditData.reduce((s, i) => s + i.latestPercentage, 0) / auditData.length) : 0,
    improving: auditData.filter(i => i.trend === 'improving').length,
    stable: auditData.filter(i => i.trend === 'stable').length,
    declining: auditData.filter(i => i.trend === 'declining').length,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest animate-pulse">Aggregating Regional Insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-4">
            <Globe size={12} /> Institutional Performance Network
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">Regional <span className="text-[var(--accent-primary)]">Analytics</span></h1>
          <p className="text-[var(--text-muted)] font-medium text-sm mt-1">Cross-Sector Performance & Compliance Tracking</p>
        </div>

        <div className="flex flex-wrap bg-[var(--bg-primary)] p-1.5 rounded-xl border border-[var(--border-primary)] shadow-sm">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'regional', icon: MapPin, label: 'Regions' },
            { id: 'domains', icon: PieChart, label: 'Domains' },
            { id: 'trends', icon: TrendingUp, label: 'Growth' }
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Network Avg', val: `${overallStats.avgScore}%`, icon: Target, color: 'blue' },
              { label: 'Growth Nodes', val: overallStats.improving, icon: ArrowUpRight, color: 'emerald' },
              { label: 'Locked Nodes', val: overallStats.stable, icon: Database, color: 'indigo' },
              { label: 'Priority Focus', val: overallStats.declining, icon: TrendingDown, color: 'red' }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 rounded-3xl border-white/5 relative overflow-hidden group">
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all`}></div>
                <div className="relative z-10">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 mb-4 inline-block border border-${stat.color}-500/10`}>
                    <stat.icon size={20} />
                  </div>
                  <div className="text-4xl font-black font-mono text-white mb-1 tracking-tighter">{stat.val}</div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-gray-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 border-white/10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8">Institutional Coverage</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { label: 'Sectors', val: schools.length, icon: Building, color: 'blue' },
                  { label: 'Personnel', val: teachers.length, icon: Users, color: 'emerald' },
                  { label: 'Mentors', val: mentors.length, icon: UserCheck, color: 'purple' }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
                    <s.icon size={32} className={`mx-auto mb-4 text-${s.color}-400`} />
                    <div className="text-3xl font-black font-mono text-white tracking-tighter">{s.val}</div>
                    <div className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-8 border-white/10">
              <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-8">Top Performing Sectors</h3>
              <div className="space-y-4">
                {auditData.sort((a, b) => b.latestPercentage - a.latestPercentage).slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <div className="text-xs font-black text-white uppercase truncate max-w-[120px]">{item.schoolName}</div>
                      <div className="text-[9px] font-mono text-gray-500 uppercase">{item.subjectName}</div>
                    </div>
                    <div className={`text-lg font-black font-mono ${item.latestPercentage >= 80 ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {item.latestPercentage}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'regional' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {regionalData.map((reg, i) => (
              <div key={i} className="glass-card p-6 rounded-3xl border-white/5 hover:border-blue-500/20 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400"><MapPin size={18} /></div>
                    <div className="text-sm font-bold text-white uppercase tracking-tight">{reg.region}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-black font-mono ${reg.averageScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {reg.averageScore}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-xl font-black font-mono text-white">{reg.schoolCount}</div>
                    <div className="text-[8px] font-mono text-gray-600 uppercase">Sectors</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="text-xl font-black font-mono text-white">{reg.auditCount}</div>
                    <div className="text-[8px] font-mono text-gray-600 uppercase">Cycles</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'domains' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {domainPerformance.sort((a, b) => b.percentage - a.percentage).map((domain, i) => (
            <div key={i} className="glass-card p-6 rounded-3xl border-white/10 hover:border-blue-500/20 transition-all">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold text-white uppercase tracking-tight max-w-[200px] truncate">{domain.domain}</div>
                <div className={`text-lg font-black font-mono ${domain.percentage >= 80 ? 'text-emerald-400' : 'text-blue-400'}`}>{domain.percentage}%</div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                <div className={`h-full ${domain.percentage >= 80 ? 'bg-emerald-500' : domain.percentage >= 60 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${domain.percentage}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                <span>Avg Efficiency: {domain.averageScore}/{domain.maxScore}</span>
                <span>{domain.totalCount} Cycles Logged</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="glass-card rounded-[2rem] p-8 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-10">Historical Performance Trends</h3>

          <div className="space-y-12">
            {auditData.filter(i => i.versions.length > 1).slice(0, 6).map((item, i) => (
              <div key={i} className="relative">
                <div className="flex items-center justify-between mb-4">
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
                    {item.improvementRate >= 0 ? '+' : ''}{Math.round(item.improvementRate)}% Efficiency Shift
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {item.versions.map((v, vi) => (
                    <div key={vi} className="flex-1">
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className={`h-full ${v.percentage >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${v.percentage}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-gray-600 uppercase">
                        <span>Phase 0{v.auditNumber}</span>
                        <span className="text-white text-[10px] font-black">{v.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatePerformanceAnalytics;