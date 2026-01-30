import { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Building2, Database, Users, Activity, Shield, BarChart, ChevronLeft } from 'lucide-react';
import { auth } from '../utils/auth';
import { storage } from '../utils/storage';
import { Employee } from '../types';
import ResultsViewer from './ResultsViewer';

interface LoginPageProps {
  onLogin: (employee: Employee) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'demo'>('login');

  // Statistics state
  const [stats, setStats] = useState({
    schools: 0,
    audits: 0,
    teachers: 0,
    isLoading: true
  });

  // Load statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [schools, audits, infraAudits] = await Promise.all([
          storage.getSchools(),
          storage.getAudits(),
          storage.getInfrastructureAudits()
        ]);

        // Get all teachers for calculation
        const teacherPromises = schools.map(school => storage.getTeachersBySchool(school.id));
        const teachersResults = await Promise.all(teacherPromises);
        const allTeachers = teachersResults.flat();

        setStats({
          schools: schools.length,
          audits: audits.length + infraAudits.length,
          teachers: allTeachers.length,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to load statistics:', error);
        setStats({
          schools: 0,
          audits: 0,
          teachers: 0,
          isLoading: false
        });
      }
    };

    loadStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    const result = await auth.login(formData.username.trim(), formData.password);

    if (result.employee && result.status === 'SUCCESS') {
      onLogin(result.employee);
    } else if (result.status === 'DEVICE_PENDING') {
      setError('Your device is currently pending admin approval.');
    } else if (result.status === 'DEVICE_REJECTED') {
      setError('This device has been blocked by an administrator.');
    } else {
      setError('Invalid credentials.');
    }

    setIsLoading(false);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-2 text-[var(--accent-primary)] hover:opacity-80 transition-all font-bold px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm"
            >
              <ChevronLeft size={20} />
              Back to Login
            </button>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-3xl p-8 border border-[var(--border-primary)] shadow-sm">
            <ResultsViewer />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex overflow-hidden">
      {/* Hero Section */}
      <div className="hidden lg:flex w-3/5 bg-[var(--bg-surface)] relative flex-col justify-between p-16 border-r border-[var(--border-primary)] overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--accent-primary)]/5 rounded-full blur-[120px] -mr-96 -mt-96"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 bg-[var(--accent-primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Activity size={24} />
            </div>
            <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Audit<span className="text-[var(--accent-primary)]">Sync</span>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[var(--accent-primary)] w-16 h-1 rounded-full opacity-20"></div>
            <h1 className="text-6xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
              Quality Assurance <br />
              <span className="text-[var(--accent-primary)]">Reimagined.</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] font-medium max-w-lg leading-relaxed">
              Empowering leadership with real-time performance tracking and comprehensive behavioral audits for modern educational institutions.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-8">
              {[
                { val: stats.isLoading ? '...' : stats.schools, label: 'Active Institutions', icon: Building2, color: 'indigo' },
                { val: stats.isLoading ? '...' : stats.audits, label: 'Audits Completed', icon: BarChart, color: 'blue' },
                { val: stats.isLoading ? '...' : stats.teachers, label: 'Tracked Personnel', icon: Users, color: 'emerald' },
                { val: '98.7%', label: 'Compliance Index', icon: Shield, color: 'sky' },
              ].map((stat, i) => (
                <div key={i} className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-sm group hover:border-[var(--accent-primary)] transition-all">
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                      <stat.icon size={20} />
                    </div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {stat.val}
                    </div>
                  </div>
                  <div className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="avatar" />
                </div>
              ))}
            </div>
            <div>
              <div className="text-[var(--text-primary)] font-bold text-sm tracking-tight">Enterprise Staff Portal</div>
              <div className="text-[var(--text-muted)] text-xs font-medium">Authorized personnel currently online</div>
            </div>
          </div>
          <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">v2.0.26</div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="w-full lg:w-2/5 p-8 lg:p-16 flex items-center justify-center relative bg-[var(--bg-primary)]">
        <div className="w-full max-w-md">
          <div className="bg-[var(--bg-surface)] rounded-[2.5rem] p-10 border border-[var(--border-primary)] shadow-xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent opacity-50"></div>

            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/10 rounded-3xl mb-6 border border-indigo-500/20 shadow-sm transition-all duration-500 hover:scale-110">
                <ShieldCheck className="text-[var(--accent-primary)]" size={40} />
              </div>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">Login</h3>
              <p className="text-[var(--text-muted)] font-medium text-sm">Enter your credentials to continue</p>
            </div>

            <div className="flex bg-[var(--bg-primary)] p-1.5 rounded-2xl mb-10 border border-[var(--border-primary)] shadow-sm">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'login' ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-indigo-600/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                Staff Login
              </button>
              <button
                onClick={() => setActiveTab('demo')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'demo' ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-indigo-600/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                View Demo
              </button>
            </div>

            {activeTab === 'login' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <User className="text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" size={20} />
                    </div>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-14 pr-6 py-5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-[var(--accent-primary)] focus:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all placeholder:text-[var(--text-muted)] text-sm font-semibold"
                      placeholder="Username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <Lock className="text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)] transition-colors" size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-14 pr-14 py-5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-[var(--accent-primary)] focus:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-all placeholder:text-[var(--text-muted)] text-sm font-semibold"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-5 flex items-center text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3 animate-headShake">
                    <Shield size={18} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--accent-primary)] text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Enter Dashboard
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-[var(--bg-primary)] rounded-3xl p-8 border border-[var(--border-primary)] text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                    <Database size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--text-primary)] mb-4">Explore Data Hub</h4>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
                    View complete performance metrics and institution audits without account privileges.
                  </p>
                  <button
                    onClick={() => setShowResults(true)}
                    className="w-full bg-[var(--bg-surface)] text-[var(--text-primary)] py-4 rounded-2xl font-bold border border-[var(--border-primary)] hover:bg-[var(--bg-primary)] transition-all flex items-center justify-center gap-3 shadow-sm"
                  >
                    Open Public Portal
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-[var(--border-primary)]">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
                <span>Enterprise Shield</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;