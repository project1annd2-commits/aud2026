import React, { useState, useEffect } from 'react';
import { X, Download, History, Save, Pause, Play } from 'lucide-react';
import { InfrastructureAudit, AuditVersion, AuditResponse } from '../types';
import { infrastructureAuditCriteria } from '../data/auditCriteria';
import { storage } from '../utils/storage';
import { generateId, generateAccessCode, generateUniqueAccessCode, formatDate, calculatePercentage, getScoreBadgeColor, calculateAdjustedScore } from '../utils/helpers';
import { generateAuditPDF } from '../utils/pdfGenerator';

interface InfrastructureAuditModalProps {
  schoolId: string;
  existingAudit?: InfrastructureAudit;
  onComplete: () => void;
  onClose: () => void;
}

const InfrastructureAuditModal: React.FC<InfrastructureAuditModalProps> = ({
  schoolId,
  existingAudit,
  onComplete,
  onClose
}) => {
  const [responses, setResponses] = useState<AuditResponse[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  useEffect(() => {
    if (existingAudit && existingAudit.versions.length > 0) {
      // Pre-populate with latest version responses
      const latestVersion = existingAudit.versions[existingAudit.currentVersion];
      // Create a deep copy to ensure state updates work properly
      setResponses(latestVersion.responses.map(response => ({
        criteriaId: response.criteriaId,
        selectedOption: response.selectedOption,
        score: response.score,
        comment: response.comment
      })));
    } else {
      // Initialize empty responses
      setResponses(infrastructureAuditCriteria.map(criterion => ({
        criteriaId: criterion.id,
        selectedOption: '',
        score: 0,
        comment: ''
      })));
    }
  }, [existingAudit]);

  const handleResponseChange = (criteriaId: string, optionIndex: number) => {
    const criterion = infrastructureAuditCriteria.find(c => c.id === criteriaId);
    if (!criterion) return;

    setResponses(prev => {
      const newResponses = prev.map(response =>
        response.criteriaId === criteriaId
          ? {
            ...response,
            selectedOption: criterion.options[optionIndex],
            score: criterion.scores[optionIndex]
          }
          : response
      );
      return newResponses;
    });
  };

  const handleCommentChange = (criteriaId: string, comment: string) => {
    setResponses(prev => {
      const newResponses = prev.map(response =>
        response.criteriaId === criteriaId
          ? {
            ...response,
            comment: comment || ''
          }
          : response
      );
      return newResponses;
    });
  };

  const handleSubmit = async () => {
    if (responses.some(r => !r.selectedOption)) {
      alert('Please answer all criteria before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { totalScore, maxScore } = calculateAdjustedScore(responses, infrastructureAuditCriteria);

      const newVersion: AuditVersion = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        responses: [...responses],
        totalScore,
        maxScore
      };

      if (existingAudit) {
        // Create new version for re-audit, preserving all completed versions
        const completedVersions = existingAudit.versions.filter(v => !v.isDraft);
        const updatedAudit: InfrastructureAudit = {
          ...existingAudit,
          versions: [...completedVersions, newVersion],
          currentVersion: completedVersions.length
        };
        await storage.updateInfrastructureAudit(updatedAudit);
      } else {
        // Create new audit
        const newAudit: InfrastructureAudit = {
          id: generateId(),
          schoolId,
          accessCode: await generateUniqueAccessCode(),
          versions: [newVersion],
          currentVersion: 0,
          createdAt: new Date().toISOString()
        };
        await storage.addInfrastructureAudit(newAudit);
      }

      // Refresh the data after successful submission
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure data is saved
      onComplete();
    } catch (error) {
      console.error('Error submitting infrastructure audit:', error);
      // More detailed error message
      if (error instanceof Error) {
        alert(`Failed to submit audit: ${error.message}. Please try again.`);
      } else {
        alert('Failed to submit audit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePause = async () => {
    setIsPausing(true);

    try {
      const { totalScore, maxScore } = calculateAdjustedScore(responses, infrastructureAuditCriteria);

      const draftVersion: AuditVersion = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        responses: [...responses],
        totalScore,
        maxScore,
        isDraft: true
      };

      if (existingAudit) {
        // Create draft version, preserving all completed versions
        const completedVersions = existingAudit.versions.filter(v => !v.isDraft);
        const updatedAudit: InfrastructureAudit = {
          ...existingAudit,
          versions: [...completedVersions, draftVersion],
          currentVersion: completedVersions.length
        };
        await storage.updateInfrastructureAudit(updatedAudit);
      } else {
        // Create new audit with draft version
        const newAudit: InfrastructureAudit = {
          id: generateId(),
          schoolId,
          accessCode: await generateUniqueAccessCode(),
          versions: [draftVersion],
          currentVersion: 0,
          createdAt: new Date().toISOString()
        };
        await storage.addInfrastructureAudit(newAudit);
      }

      onComplete();
    } catch (error) {
      console.error('Error pausing infrastructure audit:', error);
      // More detailed error message
      if (error instanceof Error) {
        alert(`Failed to save audit progress: ${error.message}. Please try again.`);
      } else {
        alert('Failed to save audit progress. Please try again.');
      }
    } finally {
      setIsPausing(false);
    }
  };

  const downloadPDF = async () => {
    if (existingAudit) {
      await generateAuditPDF(existingAudit);
    }
  };

  const getCurrentScore = () => {
    const { totalScore, maxScore, applicableCount, notApplicableCount } = calculateAdjustedScore(responses, infrastructureAuditCriteria);
    return {
      totalScore,
      maxScore,
      percentage: calculatePercentage(totalScore, maxScore),
      applicableCount,
      notApplicableCount
    };
  };

  const currentScore = getCurrentScore();
  const hasUnansweredQuestions = responses.some(r => !r.selectedOption);
  const hasAnsweredQuestions = responses.some(r => r.selectedOption);
  const isDraftAudit = existingAudit?.versions[existingAudit.currentVersion]?.isDraft;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Infrastructure Audit</h2>
            {isDraftAudit && (
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Draft - In Progress
              </span>
            )}
            {existingAudit && (
              <p className="text-sm text-gray-600 mt-1">
                Access Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{existingAudit.accessCode}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {existingAudit && (
              <>
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <History size={16} />
                  History
                </button>
                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                >
                  <Download size={16} />
                  PDF
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Draft Notice */}
          {isDraftAudit && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Pause className="text-yellow-600" size={20} />
                <div>
                  <h3 className="font-semibold text-yellow-800">Audit In Progress</h3>
                  <p className="text-sm text-yellow-700">
                    This audit was paused and saved as a draft. You can continue where you left off or submit it when complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current Score Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Current Score</h3>
                <p className="text-sm text-gray-600">
                  {currentScore.totalScore} / {currentScore.maxScore} points
                  ({currentScore.applicableCount} applicable criteria)
                </p>
                {currentScore.notApplicableCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {currentScore.notApplicableCount} criteria marked as "Not Applicable"
                  </p>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadgeColor(currentScore.percentage)}`}>
                {currentScore.percentage}%
              </div>
            </div>
          </div>

          {/* Version History */}
          {showVersionHistory && existingAudit && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Version History</h3>
              <div className="space-y-2">
                {existingAudit.versions.map((version, index) => (
                  <div key={version.id} className="flex justify-between items-center text-sm">
                    <span>Version {index + 1}: {formatDate(version.timestamp)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(calculatePercentage(version.totalScore, version.maxScore))}`}>
                      {version.totalScore}/{version.maxScore} ({calculatePercentage(version.totalScore, version.maxScore)}%)
                    </span>
                  </div>
                ))}
              </div>


            </div>
          )}

          {/* Audit Form */}
          <div className="space-y-6">
            {infrastructureAuditCriteria.map((criterion) => {
              const response = responses.find(r => r.criteriaId === criterion.id);

              return (
                <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{criterion.label}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {criterion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${response?.selectedOption === option ? (
                          option === 'Not Applicable'
                            ? 'border-gray-500 bg-gray-50'
                            : 'border-purple-500 bg-purple-50'
                        ) : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name={criterion.id}
                          value={option}
                          checked={response?.selectedOption === option}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleResponseChange(criterion.id, index);
                            }
                          }}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm">{option}</span>
                        <span className={`ml-auto text-xs ${option === 'Not Applicable'
                          ? 'text-gray-400 italic'
                          : 'text-gray-500'
                          }`}>
                          ({criterion.scores[index]} pts)
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Comment/Suggestion Field */}
                  <div className="mt-4">
                    <label htmlFor={`comment-${criterion.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Comments & Suggestions (Optional)
                    </label>
                    <textarea
                      id={`comment-${criterion.id}`}
                      value={response?.comment || ''}
                      onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                      placeholder="Add any observations, suggestions, or notes for improvement..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-vertical"
                      rows={2}
                      onKeyDown={(e) => {
                        // Ensure space key works properly
                        if (e.key === ' ') {
                          e.stopPropagation();
                        }
                      }}
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 This field is for additional feedback and does not affect the scoring
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {hasAnsweredQuestions ? 'Close Without Saving' : 'Cancel'}
            </button>

            {hasAnsweredQuestions && (
              <button
                onClick={handlePause}
                disabled={isPausing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pause size={16} />
                {isPausing ? 'Saving...' : 'Save & Continue Later'}
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || hasUnansweredQuestions}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSubmitting ? 'Submitting...' : isDraftAudit ? 'Complete Audit' : existingAudit ? 'Update Audit' : 'Submit Audit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfrastructureAuditModal;