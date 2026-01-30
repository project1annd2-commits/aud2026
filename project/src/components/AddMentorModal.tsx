import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Mentor } from '../types';
import { generateId } from '../utils/helpers';

interface AddMentorModalProps {
  schoolId: string;
  onAdd: (mentor: Mentor) => void;
  onClose: () => void;
}

const AddMentorModal: React.FC<AddMentorModalProps> = ({ schoolId, onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    phone: '',
    email: '',
    expertise: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.qualification.trim() || !formData.phone.trim() || !formData.expertise.trim()) {
      return;
    }

    const mentor: Mentor = {
      id: generateId(),
      schoolId,
      name: formData.name.trim(),
      qualification: formData.qualification.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      expertise: formData.expertise.trim(),
      createdAt: new Date().toISOString()
    };

    onAdd(mentor);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Mentor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">
              Qualification *
            </label>
            <input
              type="text"
              id="qualification"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., M.Ed, B.A."
              required
            />
          </div>

          <div>
            <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 mb-1">
              Area of Expertise / Role *
            </label>
            <input
              type="text"
              id="expertise"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Academic Coordinator, Science Mentor"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Mentor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMentorModal;