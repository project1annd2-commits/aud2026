import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Employee } from './types';
import { auth } from './utils/auth';
import { storage } from './utils/storage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import TeacherSupportPage from './components/TeacherSupportPage';

function App() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const initializeApp = async () => {
      const initTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn('Initialization taking too long, forcing start...');
          setIsLoading(false);
        }
      }, 10000);

      try {
        await storage.init();
        const employee = auth.getCurrentEmployee();
        setCurrentEmployee(employee);
        if (employee) {
          await auth.initDevice(employee);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        clearTimeout(initTimeout);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = async (employee: Employee) => {
    setCurrentEmployee(employee);
    await auth.initDevice(employee);
  };

  const handleLogout = async () => {
    await auth.logout();
    setCurrentEmployee(null);
  };

  if (currentPath === '/support') {
    return <TeacherSupportPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[var(--text-secondary)] font-mono uppercase tracking-widest text-xs">Initializing Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300`}>
      {!currentEmployee ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          {(currentEmployee.role === 'admin' || currentEmployee.role === 'viewer') ? (
            <AdminDashboard currentEmployee={currentEmployee} onLogout={handleLogout} />
          ) : (
            <Dashboard currentEmployee={currentEmployee} onLogout={handleLogout} />
          )}
        </div>
      )}

      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed bottom-6 right-6 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all z-50 group"
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <div className="relative w-6 h-6">
          {isDark ? (
            <Sun size={24} className="text-yellow-400 animate-fadeIn" />
          ) : (
            <Moon size={24} className="text-indigo-600 animate-fadeIn" />
          )}
        </div>
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          {isDark ? "Light Mode" : "Dark Mode"}
        </div>
      </button>
    </div>
  );
}

export default App;