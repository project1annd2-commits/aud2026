import React, { useState, useEffect } from 'react';
import { X, Lightbulb, BookOpen, Users, Laptop, UserCheck, ClipboardList, AlertTriangle } from 'lucide-react';
import { generateAIAnalysis, getMentorDetails } from '../utils/aiSuggestionService';
import { Audit, Teacher, Mentor } from '../types';

interface AISuggestionModalProps {
  audit: Audit;
  subject: Teacher | Mentor;
  onClose: () => void;
}

const AISuggestionModal: React.FC<AISuggestionModalProps> = ({ audit, subject, onClose }) => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'equipment' | 'mentors' | 'overview'>('overview');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await generateAIAnalysis(audit);
        setAnalysisResult(result);
      } catch (err) {
        console.error('Error generating AI analysis:', err);
        setError('Failed to generate AI suggestions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [audit]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="text-red-600" size={16} />;
      case 'medium': return <AlertTriangle className="text-yellow-600" size={16} />;
      case 'low': return <AlertTriangle className="text-green-600" size={16} />;
      default: return null;
    }
  };

  const getIconForCriterion = (criterionId: string) => {
    switch (criterionId) {
      case 'lesson_planning': return <BookOpen className="text-blue-600" size={18} />;
      case 'subject_knowledge': return <BookOpen className="text-purple-600" size={18} />;
      case 'teaching_methods': return <Users className="text-green-600" size={18} />;
      case 'classroom_management': return <ClipboardList className="text-indigo-600" size={18} />;
      case 'student_interaction': return <Users className="text-orange-600" size={18} />;
      case 'assessment_feedback': return <ClipboardList className="text-teal-600" size={18} />;
      case 'technology_integration': return <Laptop className="text-cyan-600" size={18} />;
      case 'professional_development': return <UserCheck className="text-pink-600" size={18} />;
      case 'collaboration': return <Users className="text-rose-600" size={18} />;
      case 'punctuality_attendance': return <UserCheck className="text-amber-600" size={18} />;
      default: return <Lightbulb className="text-gray-600" size={18} />;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">AI Analysis</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating AI-powered suggestions...</p>
            <p className="text-sm text-gray-500 mt-2">Analyzing audit data and generating personalized recommendations</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">AI Analysis Error</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-600" size={24} />
                <div>
                  <h3 className="font-semibold text-red-800">Analysis Failed</h3>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI-Powered Suggestions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Personalized recommendations for {subject.name} based on audit analysis
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex gap-2 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'overview' 
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'suggestions'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              Suggestions ({analysisResult.suggestions.length})
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'equipment'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              Equipment ({analysisResult.equipmentRecommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('mentors')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'mentors'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'}
              `}
            >
              Mentors ({analysisResult.mentorRecommendations.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Overall Feedback */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Lightbulb size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Overall Feedback</h3>
                    <p className="text-gray-700 mt-2 leading-relaxed">
                      {analysisResult.overallFeedback}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">High Priority</p>
                      <p className="text-2xl font-bold text-green-800 mt-1">
                        {analysisResult.suggestions.filter((s: any) => s.priority === 'high').length}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Medium Priority</p>
                      <p className="text-2xl font-bold text-yellow-800 mt-1">
                        {analysisResult.suggestions.filter((s: any) => s.priority === 'medium').length}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Low Priority</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">
                        {analysisResult.suggestions.filter((s: any) => s.priority === 'low').length}
                      </p>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <AlertTriangle size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Laptop size={18} />
                    Recommended Equipment
                  </h4>
                  {analysisResult.equipmentRecommendations.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysisResult.equipmentRecommendations.slice(0, 3).map((item: any, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                          <span className="text-gray-700">{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">No equipment recommendations at this time.</p>
                  )}
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCheck size={18} />
                    Recommended Mentors
                  </h4>
                  {analysisResult.mentorRecommendations.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {analysisResult.mentorRecommendations.slice(0, 3).map((item: any, index: number) => {
                        const mentor = getMentorDetails(item.mentorId);
                        return (
                          <li key={index} className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                            <span className="text-gray-700">{mentor ? mentor.name : 'Mentor'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">No mentor recommendations at this time.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Suggestions</h3>
              <p className="text-sm text-gray-600">
                Personalized recommendations for improvement based on audit criteria
              </p>

              {analysisResult.suggestions.length > 0 ? (
                <div className="space-y-4">
                  {analysisResult.suggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                          {getPriorityIcon(suggestion.priority)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                              {getIconForCriterion(suggestion.criterionId)}
                              {suggestion.criterionId.replace('_', ' ')}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                            {suggestion.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="mx-auto text-gray-400" size={48} />
                  <p className="text-gray-600 mt-4">No suggestions at this time.</p>
                  <p className="text-sm text-gray-500">Great job! All criteria meet or exceed expectations.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Equipment Recommendations</h3>
              <p className="text-sm text-gray-600">
                Suggested equipment to enhance teaching effectiveness based on audit analysis
              </p>

              {analysisResult.equipmentRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.equipmentRecommendations.map((item: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${getPriorityColor(item.priority)}`}>
                          <Laptop className={`text-${item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'yellow' : 'green'}-600`} size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                              {item.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-2 text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Laptop className="mx-auto text-gray-400" size={48} />
                  <p className="text-gray-600 mt-4">No equipment recommendations at this time.</p>
                  <p className="text-sm text-gray-500">Current equipment appears sufficient for teaching needs.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mentors' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Mentor Recommendations</h3>
              <p className="text-sm text-gray-600">
                Suggested mentors to support professional development based on audit results
              </p>

              {analysisResult.mentorRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {analysisResult.mentorRecommendations.map((item: any, index: number) => {
                    const mentor = getMentorDetails(item.mentorId);
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-full ${getPriorityColor(item.priority)}`}>
                            <UserCheck className={`text-${item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'yellow' : 'green'}-600`} size={18} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{mentor ? mentor.name : 'Mentor'}</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Expertise: {mentor ? mentor.expertise : 'Not specified'}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-700 mt-2 text-sm">
                              <strong>Reason:</strong> {item.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto text-gray-400" size={48} />
                  <p className="text-gray-600 mt-4">No mentor recommendations at this time.</p>
                  <p className="text-sm text-gray-500">Excellent performance! No additional mentorship needed.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              These suggestions are generated based on the audit analysis and are intended to support professional growth.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionModal;