import React, { useState, useEffect } from 'react';
import { X, Download, History, Save, Pause, Play, Video, Upload, Loader2, Trash2, Brain } from 'lucide-react';
import { Teacher, Mentor, Audit, AuditVersion, AuditResponse } from '../types';
import { teacherAuditCriteria, mentorAuditCriteria } from '../data/auditCriteria';
import { storage } from '../utils/storage';
import { generateId, generateUniqueAccessCode, formatDate, calculatePercentage, getScoreBadgeColor, calculateAdjustedScore } from '../utils/helpers';
import { generateAuditPDF } from '../utils/pdfGenerator';
import AISuggestionModal from './AISuggestionModal';

interface AuditModalProps {
  type: 'teacher' | 'mentor';
  subject: Teacher | Mentor;
  schoolId: string;
  onClose: () => void;
}

const AuditModal: React.FC<AuditModalProps> = ({ type, subject, schoolId, onClose }) => {
  const [responses, setResponses] = useState<AuditResponse[]>([]);
  const [existingAudit, setExistingAudit] = useState<Audit | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const criteria = type === 'teacher' ? teacherAuditCriteria : mentorAuditCriteria;

  useEffect(() => {
    const loadExistingAudit = async () => {
      try {
        setIsLoading(true);
        // Check for existing audits
        const audits = await storage.getAuditsBySubject(subject.id);
        if (audits.length > 0) {
          const latest = audits.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            // Handle invalid dates
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            return dateB.getTime() - dateA.getTime();
          })[0];
          setExistingAudit(latest);

          // Pre-populate with latest version responses
          const latestVersion = latest.versions[latest.currentVersion];

          // Merge saved responses with current criteria to handle any new criteria added
          const mergedResponses = criteria.map(criterion => {
            const savedResponse = latestVersion.responses.find(r => r.criteriaId === criterion.id);
            if (savedResponse) {
              return {
                criteriaId: savedResponse.criteriaId,
                selectedOption: savedResponse.selectedOption,
                score: savedResponse.score,
                comment: savedResponse.comment || ''
              };
            } else {
              // New criterion not in saved audit - initialize as empty
              return {
                criteriaId: criterion.id,
                selectedOption: '',
                score: 0,
                comment: ''
              };
            }
          });

          setResponses(mergedResponses);
        } else {
          // Initialize empty responses
          setResponses(criteria.map(criterion => ({
            criteriaId: criterion.id,
            selectedOption: '',
            score: 0,
            comment: ''
          })));
        }
      } catch (error) {
        console.error('Error loading existing audit:', error);
        // Initialize empty responses on error
        setResponses(criteria.map(criterion => ({
          criteriaId: criterion.id,
          selectedOption: '',
          score: 0,
          comment: ''
        })));
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAudit();
  }, [subject.id, criteria]);

  const handleResponseChange = (criteriaId: string, optionIndex: number) => {
    const criterion = criteria.find(c => c.id === criteriaId);
    if (!criterion) return;

    const newResponse = {
      criteriaId,
      selectedOption: criterion.options[optionIndex],
      score: criterion.scores[optionIndex],
      comment: responses.find(r => r.criteriaId === criteriaId)?.comment || ''
    };

    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.criteriaId === criteriaId);
      if (existingIndex >= 0) {
        const newResponses = [...prev];
        newResponses[existingIndex] = newResponse;
        return newResponses;
      } else {
        return [...prev, newResponse];
      }
    });
  };

  const handleCommentChange = (criteriaId: string, comment: string) => {
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.criteriaId === criteriaId);
      if (existingIndex >= 0) {
        const newResponses = [...prev];
        newResponses[existingIndex] = {
          ...newResponses[existingIndex],
          comment: comment || ''
        };
        return newResponses;
      }
      return prev;
    });
  };
  const handleVideoUpload = async (criteriaId: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file.');
      return;
    }

    setUploadingId(criteriaId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      console.log("Video upload response:", data);

      setResponses(prev => {
        const existingIndex = prev.findIndex(r => r.criteriaId === criteriaId);
        if (existingIndex >= 0) {
          const newResponses = [...prev];
          newResponses[existingIndex] = {
            ...newResponses[existingIndex],
            videoUrl: data.url,
            thumbnailUrl: data.thumbnailUrl,
            recognitionResults: data.recognitionResults || null
          };
          console.log("Updated response:", newResponses[existingIndex]);
          return newResponses;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveVideo = (criteriaId: string) => {
    setResponses(prev => {
      const existingIndex = prev.findIndex(r => r.criteriaId === criteriaId);
      if (existingIndex >= 0) {
        const newResponses = [...prev];
        const { videoUrl, thumbnailUrl, ...rest } = newResponses[existingIndex];
        newResponses[existingIndex] = rest;
        return newResponses;
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (responses.some(r => !r.selectedOption)) {
      alert('Please answer all criteria before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { totalScore, maxScore } = calculateAdjustedScore(responses, criteria);

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
        const updatedAudit: Audit = {
          ...existingAudit,
          versions: [...completedVersions, newVersion],
          currentVersion: completedVersions.length
        };
        await storage.updateAudit(updatedAudit);
      } else {
        // Create new audit
        const newAudit: Audit = {
          id: generateId(),
          type,
          subjectId: subject.id,
          schoolId,
          accessCode: await generateUniqueAccessCode(),
          versions: [newVersion],
          currentVersion: 0,
          createdAt: new Date().toISOString()
        };
        await storage.addAudit(newAudit);
      }

      // Refresh the data after successful submission
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure data is saved
      onClose();
    } catch (error) {
      console.error('Error submitting audit:', error);
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
      const { totalScore, maxScore } = calculateAdjustedScore(responses, criteria);

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
        const updatedAudit: Audit = {
          ...existingAudit,
          versions: [...completedVersions, draftVersion],
          currentVersion: completedVersions.length
        };
        await storage.updateAudit(updatedAudit);
      } else {
        // Create new audit with draft version
        const newAudit: Audit = {
          id: generateId(),
          type,
          subjectId: subject.id,
          schoolId,
          accessCode: await generateUniqueAccessCode(),
          versions: [draftVersion],
          currentVersion: 0,
          createdAt: new Date().toISOString()
        };
        await storage.addAudit(newAudit);
      }

      onClose();
    } catch (error) {
      console.error('Error pausing audit:', error);
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
    try {
      const audits = await storage.getAuditsBySubject(subject.id);
      const audit = audits[0];
      if (audit) {
        await generateAuditPDF(audit);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const getCurrentScore = () => {
    const { totalScore, maxScore, applicableCount, notApplicableCount } = calculateAdjustedScore(responses, criteria);
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading audit data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {type === 'teacher' ? 'Teacher' : 'Mentor'} Audit: {subject.name}
              {isDraftAudit && (
                <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Draft - In Progress
                </span>
              )}
            </h2>
            {existingAudit && (
              <p className="text-sm text-gray-600 mt-1">
                Access Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{existingAudit.accessCode}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {type === 'teacher' && hasAnsweredQuestions && (
              <button
                onClick={() => setShowAISuggestions(true)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                title="Get AI-powered suggestions for improvement"
              >
                <Brain size={16} />
                AI Suggestions
              </button>
            )}
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
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Version History</h3>
              <div className="space-y-2">
                {existingAudit.versions.filter(v => !v.isDraft).map((version, index) => (
                  <div key={version.id} className="flex justify-between items-center text-sm">
                    <span>
                      Audit {index + 1}: {formatDate(version.timestamp)}
                      {version.editedBy && <span className="text-gray-500 ml-1">by {version.editedBy}</span>}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(calculatePercentage(version.totalScore, version.maxScore))}`}>
                      {version.totalScore}/{version.maxScore} ({calculatePercentage(version.totalScore, version.maxScore)}%)
                    </span>
                  </div>
                ))}
                {isDraftAudit && (
                  <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                    <span className="text-yellow-600 font-medium">
                      Current Draft: {formatDate(existingAudit.versions[existingAudit.currentVersion].timestamp)}
                    </span>
                    <span className="text-yellow-600 text-xs">In Progress</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Form */}
          <div className="space-y-6">
            {criteria.map((criterion) => {
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
                            : 'border-blue-500 bg-blue-50'
                        ) : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name={criterion.id}
                          value={option}
                          checked={response?.selectedOption === option}
                          onChange={() => handleResponseChange(criterion.id, index)}
                          className="text-blue-600 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical"
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

                  {/* Video Upload for Lesson Planning */}
                  {criterion.id === 'lesson_planning' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Subject Knowledge and Content Delivery */}
                  {criterion.id === 'subject_knowledge' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Teaching Methods and Strategies */}
                  {criterion.id === 'teaching_methods' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Classroom Management and Environment */}
                  {criterion.id === 'classroom_management' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Student Interaction and Communication */}
                  {criterion.id === 'student_interaction' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Assessment and Feedback */}
                  {criterion.id === 'assessment_feedback' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Technology Integration and Innovation */}
                  {criterion.id === 'technology_integration' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Professional Development and Growth */}
                  {criterion.id === 'professional_development' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Collaboration and Teamwork */}
                  {criterion.id === 'collaboration' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Video Upload for Punctuality and Attendance */}
                  {criterion.id === 'punctuality_attendance' && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Video className="text-blue-600" size={20} />
                          <h4 className="text-sm font-semibold text-blue-900">Lesson Video Proof</h4>
                        </div>
                        {!response?.videoUrl && !uploadingId && (
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            <Upload size={14} />
                            Upload Video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(criterion.id, file);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {uploadingId === criterion.id && (
                        <div className="flex items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-blue-600" size={20} />
                          <p className="text-sm text-blue-700">Processing video with AI libraries...</p>
                        </div>
                      )}

                      {response?.videoUrl && (
                        <div className="relative group rounded-lg overflow-hidden border border-blue-200 aspect-video bg-black">
                          {response.thumbnailUrl ? (
                            <img
                              src={`http://localhost:5000${response.thumbnailUrl}`}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="text-white" size={48} />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <a
                              href={`http://localhost:5000${response.videoUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-white rounded-full text-blue-600 hover:scale-110 transition-transform"
                            >
                              <Play size={24} fill="currentColor" />
                            </a>
                            <button
                              onClick={() => handleRemoveVideo(criterion.id)}
                              className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded uppercase font-bold tracking-wider">
                            Video Evidence Uploaded
                          </div>
                        </div>
                      )}

                      {response?.recognitionResults && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">AI Analysis Results</h4>
                          <div className="text-sm">
                            <p className="text-green-700 mb-1">
                              <strong>Summary:</strong> {response.recognitionResults.analysis?.summary || 'No significant interactions detected.'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-green-800">Student Interactions:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Raising Hand: {response.recognitionResults.analysis?.student_interactions?.raising_hand ? 'Yes' : 'No'}</li>
                                  <li>Using Book: {response.recognitionResults.analysis?.student_interactions?.using_book ? 'Yes' : 'No'}</li>
                                  <li>Using Phone: {response.recognitionResults.analysis?.student_interactions?.using_phone ? 'Yes' : 'No'}</li>
                                  <li>Interactive: {response.recognitionResults.analysis?.student_interactions?.interactive ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-green-800">Teacher Activities:</p>
                                <ul className="list-disc list-inside text-green-700 ml-3">
                                  <li>Explaining: {response.recognitionResults.analysis?.teacher_activities?.explaining ? 'Yes' : 'No'}</li>
                                  <li>Monitoring: {response.recognitionResults.analysis?.teacher_activities?.monitoring ? 'Yes' : 'No'}</li>
                                </ul>
                              </div>
                            </div>
                            {response.recognitionResults.note && (
                              <p className="text-xs text-green-600 italic mt-2">
                                Note: {response.recognitionResults.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {!response?.videoUrl && !uploadingId && (
                        <p className="text-xs text-blue-600 italic">
                          Upload a record of the lesson to enhance the audit evidence.
                        </p>
                      )}
                    </div>
                  )}
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSubmitting ? 'Submitting...' : isDraftAudit ? 'Complete Audit' : existingAudit ? 'Submit Re-audit' : 'Submit Audit'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Suggestions Modal */}
      {showAISuggestions && existingAudit && (
        <AISuggestionModal
          audit={existingAudit}
          subject={subject}
          onClose={() => setShowAISuggestions(false)}
        />
      )}
      {showAISuggestions && !existingAudit && (
        <AISuggestionModal
          audit={{
            id: generateId(),
            type,
            subjectId: subject.id,
            schoolId,
            versions: [{
              id: generateId(),
              timestamp: new Date().toISOString(),
              responses,
              totalScore: currentScore.totalScore,
              maxScore: currentScore.maxScore
            }],
            currentVersion: 0,
            createdAt: new Date().toISOString(),
            accessCode: ''
          }}
          subject={subject}
          onClose={() => setShowAISuggestions(false)}
        />
      )}
    </div>
  );
};

export default AuditModal;