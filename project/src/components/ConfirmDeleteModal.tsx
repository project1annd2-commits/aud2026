import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  cascadeInfo?: string[];
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isDeleting = false,
  cascadeInfo = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      <div className="bg-[var(--bg-surface)] rounded-3xl shadow-2xl w-full max-w-md border border-[var(--border-primary)] overflow-hidden scale-in">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">{message}</p>

          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 mb-6">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Target for Deletion</div>
            <div className="font-bold text-red-700 text-lg">"{itemName}"</div>

            {cascadeInfo.length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-100">
                <p className="text-red-700 text-xs font-bold mb-3 uppercase tracking-tight">Affected Data:</p>
                <div className="flex flex-wrap gap-2">
                  {cascadeInfo.map((info, index) => (
                    <span key={index} className="px-3 py-1 rounded-full bg-red-100/50 text-red-600 text-[10px] font-bold border border-red-200/50">
                      {info}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 text-[var(--text-secondary)] font-bold bg-[var(--bg-primary)] rounded-xl hover:bg-[var(--bg-surface)] border border-[var(--border-primary)] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Processing...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;