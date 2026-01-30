import { useState, useEffect } from 'react';
import { Download, School as Building, User, UserCheck, Wrench, Terminal, ShieldCheck, ChevronRight, MessageSquare, Clock, XCircle, SearchX, Zap } from 'lucide-react';
import { Audit, InfrastructureAudit, School, Teacher, Mentor } from '../types';
import { storage } from '../utils/storage';
import { formatDate, calculatePercentage, calculateAdjustedScore } from '../utils/helpers';
import { generateAuditPDF } from '../utils/pdfGenerator';
import { teacherAuditCriteria, mentorAuditCriteria, infrastructureAuditCriteria } from '../data/auditCriteria';

interface ResultsViewerProps {
  initialAccessCode?: string;
}

const ResultsViewer: React.FC<ResultsViewerProps> = ({ initialAccessCode = '' }) => {
  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [audit, setAudit] = useState<Audit | InfrastructureAudit | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    if (initialAccessCode) {
      handleSearch(initialAccessCode);
    }
  }, [initialAccessCode]);

  const handleSearch = async (code?: string) => {
    const searchCode = code || accessCode;
    if (!searchCode.trim()) {
      setError('System requires access protocol to proceed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const foundAudit = await storage.getAuditByAccessCode(searchCode.trim());

      if (foundAudit) {
        setAudit(foundAudit);
        setError('');
        if (!code) setAccessCode(searchCode.trim());

        // Load related data
        const schoolData = await storage.getSchoolById(foundAudit.schoolId);
        setSchool(schoolData || null);

        if ('type' in foundAudit) {
          if (foundAudit.type === 'teacher') {
            const teacherData = await storage.getTeacherById(foundAudit.subjectId);
            setTeacher(teacherData || null);
          } else {
            const mentorData = await storage.getMentorById(foundAudit.subjectId);
            setMentor(mentorData || null);
          }
        }
      } else {
        setError('Invalid access protocol. Link failed.');
        setAudit(null);
      }
    } catch (err) {
      console.error('Error searching for audit:', err);
      setError('Communication error. Channel failed.');
      setAudit(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (audit) await generateAuditPDF(audit);
  };

  const renderAuditResults = () => {
    if (!audit) return null;
    const currentVersion = audit.versions[audit.currentVersion];
    let criteria = infrastructureAuditCriteria;
    if ('type' in audit) criteria = audit.type === 'teacher' ? teacherAuditCriteria : mentorAuditCriteria;

    const { totalScore, maxScore, applicableCount, notApplicableCount } = calculateAdjustedScore(currentVersion.responses, criteria);
    const percentage = calculatePercentage(totalScore, maxScore);

    let subjectName = '';
    let icon = <Building size={28} />;

    if ('type' in audit) {
      icon = audit.type === 'teacher' ? <User size={28} className="text-blue-400" /> : <UserCheck size={28} className="text-emerald-400" />;
      subjectName = audit.type === 'teacher' ? (teacher?.name || 'Unknown Teacher') : (mentor?.name || 'Unknown Mentor');
    } else {
      subjectName = 'Infrastructure Log';
      icon = <Wrench size={28} className="text-purple-400" />;
    }

    return (
      <div className="space-y-10 animate-fadeInUp">
        {/* Modern Header */}
        <div className="glass-card rounded-[3rem] p-10 border-[var(--border-primary)] relative overflow-hidden shadow-2xl bg-[var(--bg-surface)] dark:bg-[var(--bg-glass)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-[2rem] bg-[var(--bg-glass)] border border-[var(--border-primary)] flex items-center justify-center shadow-2xl transform hover:rotate-6 transition-transform">
                {icon}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-bold text-[var(--text-primary)] uppercase tracking-tighter">{subjectName}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--accent-blue)] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">
                    <Building size={12} /> {school?.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-glass)] px-3 py-1 rounded-full border border-[var(--border-primary)]">
                    <Clock size={12} /> {formatDate(currentVersion.timestamp)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-primary)]">
              <div className="text-right">
                <div className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-[0.2em] mb-1">Efficiency</div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono uppercase tracking-widest">{totalScore} / {maxScore} PTS</div>
              </div>
              <div className={`text-6xl font-bold font-mono tracking-tighter shadow-sm ${percentage >= 80 ? 'text-[var(--accent-emerald)]' : percentage >= 60 ? 'text-yellow-400' : 'text-[var(--accent-red)]'}`}>
                {percentage}%
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[var(--border-primary)] flex flex-wrap justify-between items-center gap-4">
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
              Telemetry Sync: <span className="text-[var(--text-secondary)]">{applicableCount} Validated</span> | <span className="text-[var(--text-secondary)]">{notApplicableCount} Filtered</span>
            </div>
            <button
              onClick={downloadPDF}
              className="group flex items-center gap-3 bg-[var(--accent-blue)] text-white px-8 py-3.5 rounded-2xl hover:opacity-90 transition-all shadow-xl active:scale-95 border border-white/10"
            >
              <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Generate PDF Report</span>
            </button>
          </div>
        </div>

        {/* Responses Grid */}
        <div className="grid grid-cols-1 gap-6">
          {currentVersion.responses.map((response, index) => {
            const crit = criteria.find(c => c.id === response.criteriaId);
            const score = response.score;
            const isNA = score === 0;

            return (
              <div key={response.criteriaId} className="group relative glass-card hover:bg-[var(--bg-glass)] rounded-[2rem] p-8 border-[var(--border-primary)] hover:border-[var(--accent-blue)] transition-all duration-300 bg-[var(--bg-surface)] dark:bg-[var(--bg-glass)]">
                <div className="flex flex-col md:flex-row items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-[10px] font-black font-mono text-[var(--accent-blue)] opacity-30">LOG_{String(index + 1).padStart(3, '0')}</span>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                        {crit?.label}
                      </h4>
                    </div>
                    <div className={`text-md font-medium leading-relaxed ${isNA ? 'text-[var(--text-muted)] italic font-mono' : 'text-[var(--text-secondary)]'}`}>
                      {response.selectedOption}
                    </div>

                    {response.comment && (
                      <div className="mt-6 p-6 bg-[var(--bg-glass)] border-l-4 border-blue-500/30 rounded-r-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
                        <div className="flex items-start gap-4">
                          <MessageSquare size={16} className="text-[var(--accent-blue)] mt-1" />
                          <div>
                            <span className="text-[9px] font-bold text-[var(--accent-blue)] uppercase tracking-widest block mb-1.5">Domain Insights</span>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono">{response.comment}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center md:text-right min-w-[100px]">
                    <div className={`text-4xl font-bold font-mono tracking-tighter ${isNA ? 'text-[var(--text-muted)] opacity-20' : score >= 3 ? 'text-[var(--accent-emerald)]' : score >= 2 ? 'text-yellow-400' : 'text-[var(--accent-red)]'}`}>
                      {isNA ? 'N/A' : score.toFixed(1)}
                    </div>
                    {!isNA && <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Scale Limit 4.0</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Intro */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[var(--accent-blue)] text-[10px] font-mono font-bold uppercase tracking-widest mb-6">
          <ShieldCheck size={12} /> Secure Archive Uplink
        </div>
        <h1 className="text-6xl font-bold text-[var(--text-primary)] tracking-tighter uppercase mb-2">Audit <span className="text-[var(--accent-blue)]">Report</span></h1>
        <p className="text-[var(--text-muted)] font-mono text-xs uppercase tracking-[0.2em]">Synchronizing with central audit mainframe...</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-xl mx-auto mb-20">
        <div className="relative group">
          <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--accent-blue)] opacity-50 group-focus-within:opacity-100 transition-colors" size={24} />
          <input
            type="text"
            placeholder="ACCESS PROTOCOL"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-16 pr-44 py-8 bg-[var(--bg-glass)] border-2 border-[var(--border-primary)] rounded-[2rem] focus:ring-4 focus:ring-blue-500/20 focus:border-[var(--accent-blue)] text-left text-3xl font-mono text-[var(--text-primary)] tracking-[0.6em] focus:bg-[var(--bg-surface)] shadow-2xl transition-all uppercase placeholder:text-[var(--text-muted)] opacity-80"
            maxLength={4}
            disabled={loading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="h-14 px-8 bg-[var(--accent-blue)] hover:opacity-90 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? <Zap size={18} className="animate-spin" /> : <><span>INITIALIZE</span><ChevronRight size={18} /></>}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-4 animate-shake">
            <XCircle className="text-red-500" size={20} />
            <p className="text-[10px] font-mono font-black text-red-500 uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>

      {/* Main Results */}
      <div className="mt-20">
        {audit ? renderAuditResults() : (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
            <SearchX size={80} className="text-gray-400 mb-6" />
            <p className="text-sm font-mono uppercase tracking-[0.3em]">Awaiting Valid Search Key</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsViewer;