import React, { useState, useEffect } from 'react';
import { Employee } from './types';
import { auth } from './utils/auth';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const employee = auth.getCurrentEmployee();
    setCurrentEmployee(employee);
    setIsLoading(false);
  }, []);

  const handleLogin = (employee: Employee) => {
    setCurrentEmployee(employee);
  };

  const handleLogout = () => {
    setCurrentEmployee(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentEmployee) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {currentEmployee.role === 'admin' ? (
          <AdminDashboard currentEmployee={currentEmployee} onLogout={handleLogout} />
        ) : (
          <Dashboard currentEmployee={currentEmployee} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}

export default App;