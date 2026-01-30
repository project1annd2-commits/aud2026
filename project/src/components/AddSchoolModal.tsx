import React, { useState } from 'react';
import { X, Building2, MapPin, Tag, ShieldCheck } from 'lucide-react';
import { School, Employee } from '../types';
import { generateId } from '../utils/helpers';

interface AddSchoolModalProps {
  currentEmployee: Employee;
  onAdd: (school: School) => void;
  onClose: () => void;
}

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({ currentEmployee, onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    code: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.location.trim()) {
      return;
    }

    const school: School = {
      id: generateId(),
      name: formData.name.trim(),
      location: formData.location.trim(),
      code: formData.code.trim() || undefined,
      createdBy: currentEmployee.username,
      createdAt: new Date().toISOString()
    };

    onAdd(school);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--bg-surface)]/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-[2.5rem] border border-[var(--border-primary)] shadow-2xl overflow-hidden animate-slideUp">
        {/* Header Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="relative p-8 border-b border-[var(--border-primary)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Register Institution</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest font-medium">Add to enterprise node network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative p-8 space-y-8">
          <div className="space-y-6">
            <div className="group">
              <label htmlFor="name" className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">
                <Building2 size={12} className="text-indigo-500" /> Institution Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl focus:border-indigo-500 transition-all text-sm text-[var(--text-primary)] outline-none shadow-sm group-hover:bg-[var(--bg-surface)]"
                placeholder="Enter formal institution name"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="location" className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">
                <MapPin size={12} className="text-indigo-500" /> Geographic Location
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl focus:border-indigo-500 transition-all text-sm text-[var(--text-primary)] outline-none shadow-sm group-hover:bg-[var(--bg-surface)]"
                placeholder="City, State / Region"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="code" className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-1">
                <Tag size={12} className="text-indigo-500" /> System Identifier (Optional)
              </label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-5 py-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl focus:border-indigo-500 transition-all text-sm text-[var(--text-primary)] outline-none shadow-sm group-hover:bg-[var(--bg-surface)]"
                placeholder="Unique node code"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ShieldCheck size={16} />
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">
              Authorized by <span className="text-indigo-500 font-bold">{currentEmployee.displayName}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:bg-[var(--bg-surface)] transition-all"
            >
              Cancel Request
            </button>
            <button
              type="submit"
              className="flex-[1.5] px-6 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Initialize Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSchoolModal;